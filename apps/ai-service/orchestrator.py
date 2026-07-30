import os
import time
import json
from typing import Dict, Any, List, AsyncGenerator
from llm.provider import get_provider
from prompts.engine import PromptEngine
from tools.registry import registry as tool_registry
from tools.implementations import * # Ensure tools are registered
from rag.retrieval import retrieve_context, format_context_for_prompt

class ResponseValidator:
    @staticmethod
    def validate(chunk: Dict[str, Any]) -> Dict[str, Any]:
        """Placeholder for response validation."""
        return chunk

class AIOrchestrator:
    def __init__(self):
        self.llm = get_provider()

    async def process_chat(
        self, 
        conversation_id: str, 
        system_prompt_id: str, 
        messages: List[Dict[str, str]], 
        metadata: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        
        user_id = metadata.get("userId", "default")
        
        # 1. Policy Layer & Prompt Engine
        try:
            prompt_meta, system_prompt = PromptEngine.load_prompt(system_prompt_id)
        except FileNotFoundError:
            system_prompt = "You are a helpful AI assistant."
            prompt_meta = {"version": "fallback"}

        # 2. RAG Context Injection
        # Only fetch context if the last message was from the user
        last_message = messages[-1]["content"] if messages and messages[-1]["role"] == "user" else ""
        if last_message:
            contexts = await retrieve_context(user_id=user_id, query=last_message)
            rag_prompt = format_context_for_prompt(contexts)
            system_prompt += rag_prompt

        # 3. Tool Selection
        tools = tool_registry.discover()
        
        # 4. LLM Execution Loop (Handle Tool Calls)
        model = os.environ.get("OPENAI_MODEL", "gpt-4o")
        start_time = time.time()
        
        while True:
            stream = self.llm.chat_stream(
                system_prompt=system_prompt,
                messages=messages,
                model=model,
                tools=tools
            )

            tool_calls = []
            
            # Stream response to user
            async for chunk in stream:
                validated_chunk = ResponseValidator.validate(chunk)
                if not validated_chunk:
                    continue
                    
                if validated_chunk.get("type") == "tool_calls":
                    tool_calls = validated_chunk.get("calls", [])
                    continue
                    
                if validated_chunk.get("type") == "complete":
                    latency_ms = int((time.time() - start_time) * 1000)
                    validated_chunk.setdefault("metrics", {})
                    validated_chunk["metrics"]["latencyMs"] = latency_ms
                    validated_chunk["metrics"]["model"] = model
                    validated_chunk["metrics"]["provider"] = os.environ.get("LLM_PROVIDER", "mock")
                    validated_chunk["metrics"]["promptVersion"] = prompt_meta.get("version", "unknown")
                    
                yield validated_chunk
                
            if not tool_calls:
                break # We're done
                
            # Execute tools and append to messages for the next LLM call
            # We must append the tool calls themselves
            messages.append({
                "role": "assistant",
                "tool_calls": tool_calls
            })
            
            for tc in tool_calls:
                func_name = tc["function"]["name"]
                try:
                    args = json.loads(tc["function"]["arguments"])
                    yield {"type": "delta", "content": f"\n\n> ⚙️ Executing tool: `{func_name}`...\n\n"}
                    
                    result = tool_registry.execute(func_name, **args)
                    
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "name": func_name,
                        "content": str(result)
                    })
                except Exception as e:
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "name": func_name,
                        "content": f"Error executing tool: {str(e)}"
                    })
                    
            # Loop restarts with the new tool output messages

orchestrator = AIOrchestrator()

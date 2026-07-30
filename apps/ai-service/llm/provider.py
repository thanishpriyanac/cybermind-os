import os
import json
import asyncio
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class LLMProvider(ABC):
    @abstractmethod
    async def chat_stream(
        self, 
        system_prompt: str, 
        messages: List[Dict[str, str]], 
        model: str,
        tools: List[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pass

class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

    async def chat_stream(
        self, 
        system_prompt: str, 
        messages: List[Dict[str, str]], 
        model: str,
        tools: List[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        
        formatted_messages = [{"role": "system", "content": system_prompt}]
        formatted_messages.extend(messages)

        # Convert tool registry format to OpenAI format
        openai_tools = None
        if tools:
            openai_tools = []
            for t in tools:
                openai_tools.append({
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["input_schema"]
                    }
                })

        stream = await self.client.chat.completions.create(
            model=model,
            messages=formatted_messages,
            stream=True,
            tools=openai_tools,
            stream_options={"include_usage": True}
        )
        
        full_content = ""
        tool_calls = {}
        metrics = {"inputTokens": 0, "outputTokens": 0, "totalTokens": 0}

        async for chunk in stream:
            if not chunk.choices:
                if chunk.usage:
                    metrics["inputTokens"] = chunk.usage.prompt_tokens
                    metrics["outputTokens"] = chunk.usage.completion_tokens
                    metrics["totalTokens"] = chunk.usage.total_tokens
                continue
                
            delta = chunk.choices[0].delta
            
            if delta.content:
                full_content += delta.content
                yield {"type": "delta", "content": delta.content}
                
            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls:
                        tool_calls[idx] = {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": ""}}
                    if tc.function.arguments:
                        tool_calls[idx]["function"]["arguments"] += tc.function.arguments

        if tool_calls:
            calls = [v for k, v in sorted(tool_calls.items())]
            yield {"type": "tool_calls", "calls": calls, "metrics": metrics}
        else:
            yield {"type": "complete", "content": full_content, "metrics": metrics}

class MockProvider(LLMProvider):
    async def chat_stream(
        self, 
        system_prompt: str, 
        messages: List[Dict[str, str]], 
        model: str,
        tools: List[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        
        last_message = messages[-1]["content"] if messages else ""
        
        # Simulate tool calling for CVE
        if "CVE" in last_message.upper() and tools:
            # Fake tool call
            yield {
                "type": "tool_calls", 
                "calls": [{
                    "id": "call_mock123",
                    "type": "function",
                    "function": {
                        "name": "cve_lookup",
                        "arguments": '{"cve_id": "CVE-2021-44228"}'
                    }
                }], 
                "metrics": {"inputTokens": 10, "outputTokens": 5, "totalTokens": 15}
            }
            return
            
        mock_response = f"[MOCK] AI response to: {last_message}"
        
        words = mock_response.split(" ")
        full_content = ""
        for word in words:
            full_content += word + " "
            yield {"type": "delta", "content": word + " "}
            await asyncio.sleep(0.05)
            
        yield {
            "type": "complete", 
            "content": full_content.strip(), 
            "metrics": {"inputTokens": 10, "outputTokens": 20, "totalTokens": 30}
        }

def get_provider() -> LLMProvider:
    provider_name = os.environ.get("LLM_PROVIDER", "mock").lower()
    if provider_name == "openai":
        return OpenAIProvider()
    return MockProvider()

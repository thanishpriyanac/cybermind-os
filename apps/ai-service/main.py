from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

from orchestrator import orchestrator
from rag.parser import parse_document
from rag.ingestion import process_and_ingest_document

app = FastAPI(title="CYBERMIND AI Service")

class HealthResponse(BaseModel):
    status: str

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "ok"}

@app.get("/ready", response_model=HealthResponse)
def readiness_check():
    return {"status": "ready"}

@app.get("/live", response_model=HealthResponse)
def liveness_check():
    return {"status": "live"}

class ChatRequest(BaseModel):
    conversationId: Optional[str] = None
    systemPrompt: str
    messages: List[Dict[str, str]]
    metadata: Dict[str, Any]

@app.post("/chat")
async def chat(request: ChatRequest):
    async def generate():
        async for chunk in orchestrator.process_chat(
            conversation_id=request.conversationId or "new",
            system_prompt_id=request.systemPrompt,
            messages=request.messages,
            metadata=request.metadata
        ):
            # SSE format
            yield f"data: {json.dumps(chunk)}\n\n"
            
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    userId: str = Form(...),
    tenantId: str = Form("default")
):
    try:
        content = await file.read()
        parsed_text = parse_document(content, file.content_type)
        
        result = await process_and_ingest_document(
            user_id=userId,
            tenant_id=tenantId,
            filename=file.filename,
            mime_type=file.content_type,
            content=parsed_text
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

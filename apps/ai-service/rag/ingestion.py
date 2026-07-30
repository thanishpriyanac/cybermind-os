import os
import hashlib
import uuid
import datetime
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.http import models

from .qdrant import get_qdrant_client, COLLECTION_NAME
from .embeddings import generate_embeddings

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    is_separator_regex=False,
)

async def process_and_ingest_document(
    user_id: str,
    tenant_id: str,
    filename: str,
    mime_type: str,
    content: str, # For now, assume plain text passed in. We will handle parsing at the router level.
) -> Dict[str, Any]:
    """
    Chunks the document text, generates embeddings, and upserts to Qdrant.
    """
    
    # 1. Generate Document ID & Hash
    sha256 = hashlib.sha256(content.encode("utf-8")).hexdigest()
    document_id = str(uuid.uuid4())
    created_at = datetime.datetime.utcnow().isoformat()
    
    # Check if duplicate hash exists for this user
    qdrant = get_qdrant_client()
    existing = qdrant.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)),
                models.FieldCondition(key="sha256", match=models.MatchValue(value=sha256)),
            ]
        ),
        limit=1
    )
    if existing[0]:
        return {"status": "duplicate", "document_id": existing[0][0].payload.get("document_id")}

    # 2. Chunk Text
    # For now page_number is 1 for all plain text, we would enhance this with true PDF pagination
    chunks = text_splitter.split_text(content)
    
    # 3. Embed & Ingest
    if chunks:
        # Batch generation
        embeddings = await generate_embeddings(chunks)
        
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            # Rough token count estimate (characters / 4)
            token_count = len(chunk) // 4 
            
            payload = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "document_id": document_id,
                "filename": filename,
                "mime_type": mime_type,
                "sha256": sha256,
                "page_number": 1, 
                "chunk_index": i,
                "token_count": token_count,
                "created_at": created_at,
                "content": chunk, # Keep the raw text for retrieval
                "source": filename
            }
            
            points.append(
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload=payload
                )
            )
            
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        
    return {
        "status": "success",
        "document_id": document_id,
        "chunks": len(chunks)
    }

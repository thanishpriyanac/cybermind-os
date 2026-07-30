from typing import List, Dict, Any
from qdrant_client.http import models

from .qdrant import get_qdrant_client, COLLECTION_NAME
from .embeddings import generate_embeddings

async def retrieve_context(user_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant chunks for a given user's query.
    """
    # 1. Embed query
    query_embeddings = await generate_embeddings([query])
    if not query_embeddings:
        return []
    
    query_vector = query_embeddings[0]
    
    # 2. Search Qdrant
    qdrant = get_qdrant_client()
    
    # Using simple vector search with payload filter
    search_results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(key="user_id", match=models.MatchValue(value=user_id)),
            ]
        ),
        limit=top_k
    )
    
    # 3. Format results
    contexts = []
    for hit in search_results:
        payload = hit.payload
        contexts.append({
            "content": payload.get("content", ""),
            "metadata": {
                "source": payload.get("source", "Unknown"),
                "document_id": payload.get("document_id", ""),
                "page_number": payload.get("page_number", 1),
                "chunk_index": payload.get("chunk_index", 0),
                "confidence": hit.score
            }
        })
        
    return contexts

def format_context_for_prompt(contexts: List[Dict[str, Any]]) -> str:
    """
    Formats the retrieved contexts into a string that can be injected into the LLM prompt.
    Includes the citations requirement.
    """
    if not contexts:
        return ""
        
    formatted = "\n\n--- RELEVANT CONTEXT ---\n"
    formatted += "Use the following context to answer the user's question.\n"
    formatted += "IMPORTANT: Every answer from RAG MUST include the Source, Document, Page, Chunk, and Confidence at the end of the response.\n\n"
    
    for i, ctx in enumerate(contexts):
        meta = ctx["metadata"]
        formatted += f"[Document {i+1}]: {ctx['content']}\n"
        formatted += f"Source Metadata: Source={meta['source']} | Document={meta['document_id']} | Page={meta['page_number']} | Chunk={meta['chunk_index']} | Confidence={meta['confidence']:.4f}\n\n"
        
    formatted += "--- END RELEVANT CONTEXT ---\n"
    return formatted

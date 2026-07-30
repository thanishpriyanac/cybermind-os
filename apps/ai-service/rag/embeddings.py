import os
from openai import AsyncOpenAI
from typing import List

# Use the environment variable as requested by the user
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates embeddings for a list of texts using the configured OpenAI model.
    """
    if not texts:
        return []
        
    provider = os.environ.get("LLM_PROVIDER", "mock").lower()
    if provider == "mock":
        import random
        # Return a list of random floats for each text (size 1536)
        return [[random.random() for _ in range(1536)] for _ in texts]
        
    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    
    # Ensure they are in the same order as requested
    embeddings = [data.embedding for data in sorted(response.data, key=lambda x: x.index)]
    return embeddings

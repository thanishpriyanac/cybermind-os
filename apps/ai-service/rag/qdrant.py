import os
from qdrant_client import QdrantClient
from qdrant_client.http import models

# Environment config
QDRANT_URL = os.environ.get("QDRANT_URL", "http://localhost:16333")
COLLECTION_NAME = "cybermind_documents"
EMBEDDING_DIMENSIONS = 1536 # For text-embedding-3-small

client = QdrantClient(url=QDRANT_URL, timeout=10.0)

def initialize_qdrant():
    """Ensure the cybermind_documents collection exists."""
    collections = client.get_collections().collections
    if not any(c.name == COLLECTION_NAME for c in collections):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=EMBEDDING_DIMENSIONS, 
                distance=models.Distance.COSINE
            ),
        )
        # Create payload indexes for fast filtering
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="user_id",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="document_id",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )

# Initialize on module import
initialize_qdrant()

def get_qdrant_client() -> QdrantClient:
    return client

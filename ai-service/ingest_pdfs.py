import os
import hashlib
from typing import List, Dict
import chromadb
from chromadb.config import Settings
from pypdf import PdfReader
from dotenv import load_dotenv
from pathlib import Path

# Resolve paths relative to this script's location
current_dir = Path(__file__).parent.resolve()
project_root = current_dir.parent
env_path = project_root / ".env"

load_dotenv(dotenv_path=env_path)

_raw_chroma = os.getenv("CHROMA_PATH", str(project_root / "chroma_db"))
if not os.path.isabs(_raw_chroma):
    CHROMA_PATH = str((project_root / _raw_chroma).resolve())
else:
    CHROMA_PATH = _raw_chroma

_raw_pdf = os.getenv("PDF_DIR", str(project_root / "PDFs"))
if not os.path.isabs(_raw_pdf):
    PDF_DIR = str((project_root / _raw_pdf).resolve())
else:
    PDF_DIR = _raw_pdf

# Initialize ChromaDB client
client = chromadb.PersistentClient(path=CHROMA_PATH, settings=Settings(anonymized_telemetry=False))

# We'll use the default SentenceTransformer embedding function provided by Chroma
# or we can rely on the same one used in main.py. Chroma uses all-MiniLM-L6-v2 by default.
try:
    collection = client.get_or_create_collection(
        name="pdf_knowledge",
        metadata={"hnsw:space": "cosine"}
    )
except Exception as e:
    print(f"Error creating/getting collection: {e}")
    exit(1)

def compute_file_hash(filepath: str) -> str:
    hasher = hashlib.md5()
    with open(filepath, 'rb') as f:
        buf = f.read()
        hasher.update(buf)
    return hasher.hexdigest()

def extract_chunks(filepath: str, chunk_size: int = 1000, overlap: int = 200) -> List[Dict]:
    chunks = []
    try:
        reader = PdfReader(filepath)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        # Simple overlap chunking
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append({
                "text": chunk,
                "source": os.path.basename(filepath),
                "chunk_index": len(chunks)
            })
            start += (chunk_size - overlap)
            
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        
    return chunks

def ingest_all_pdfs():
    if not os.path.exists(PDF_DIR):
        print(f"PDF directory not found: {PDF_DIR}")
        return

    # To ensure idempotency, we track file hashes in metadata.
    # In a real system, you'd query the DB to see if the hash is already present.
    # For simplicity, we'll fetch existing distinct sources.
    existing_metadata = collection.get(include=["metadatas"])
    ingested_hashes = set()
    if existing_metadata and existing_metadata["metadatas"]:
        for meta in existing_metadata["metadatas"]:
            if meta and "file_hash" in meta:
                ingested_hashes.add(meta["file_hash"])

    files_processed = 0
    chunks_added = 0

    for filename in os.listdir(PDF_DIR):
        if not filename.lower().endswith(".pdf"):
            continue
            
        filepath = os.path.join(PDF_DIR, filename)
        file_hash = compute_file_hash(filepath)
        
        if file_hash in ingested_hashes:
            print(f"Skipping {filename} (already ingested)")
            continue
            
        print(f"Ingesting {filename}...")
        chunks = extract_chunks(filepath)
        
        if not chunks:
            print(f"No text extracted from {filename}")
            continue
            
        ids = []
        documents = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{file_hash}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            metadatas.append({
                "source": chunk["source"],
                "file_hash": file_hash,
                "chunk_index": i
            })
            
        # Batch add to avoid large payload issues
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            collection.add(
                ids=ids[i:i+batch_size],
                documents=documents[i:i+batch_size],
                metadatas=metadatas[i:i+batch_size]
            )
            
        files_processed += 1
        chunks_added += len(chunks)
        ingested_hashes.add(file_hash)
        
    print(f"\nIngestion complete. Processed {files_processed} new files, added {chunks_added} chunks.")

if __name__ == "__main__":
    ingest_all_pdfs()

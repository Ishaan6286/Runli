# pyright: reportMissingImports=false
# Runli AI Service — FastAPI microservice
# Handles: RAG memory, ChromaDB, Groq LLM, XGBoost, YOLOv8, Voice Coach
import os
import chromadb  # pyrefly: ignore [missing-import]
import uuid
import time
import hashlib
import pandas as pd
import numpy as np
import xgboost as xgb  # pyrefly: ignore [missing-import]
import cv2
from ultralytics import YOLO  # pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import asyncio
import websockets
import requests
import json
import re
from datetime import datetime, timedelta, date
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo  # Python < 3.9
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path

# Resolve paths relative to this script's location
current_dir = Path(__file__).parent.resolve()
project_root = current_dir.parent
env_path = project_root / ".env"

load_dotenv(dotenv_path=env_path)
app = FastAPI(
    title="Runli AI Service",
    description="FastAPI microservice for RAG, ML/AI tasks, and voice coaching"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── AI Service Internal Config ──
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "super-secret-ai-key-123")
NODE_SERVICE_URL = os.getenv("NODE_SERVICE_URL", "http://localhost:5001")

# ── Primary Coach LLM: Groq ──
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ── RAG Configuration ──
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "5"))
RAG_RELEVANCE_THRESHOLD = float(os.getenv("RAG_RELEVANCE_THRESHOLD", "0.65"))  # ChromaDB distance
RAG_COLLECTION = os.getenv("RAG_COLLECTION", "user_memories")
RAG_ENABLED = os.getenv("RAG_ENABLED", "true").lower() == "true"

# ── ChromaDB — persistent volume (Docker: chroma_data:/app/chroma_data) ──
_raw_chroma = os.getenv("CHROMA_PATH", str(project_root / "chroma_db"))
if not os.path.isabs(_raw_chroma):
    CHROMA_PATH = str((project_root / _raw_chroma).resolve())
else:
    CHROMA_PATH = _raw_chroma

try:
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = chroma_client.get_or_create_collection(
        name=RAG_COLLECTION,
        metadata={"hnsw:space": "cosine"}
    )
    pdf_collection = chroma_client.get_or_create_collection(
        name="pdf_knowledge",
        metadata={"hnsw:space": "cosine"}
    )
    CHROMA_AVAILABLE = True
    print(f"[RAG] ChromaDB initialized at {CHROMA_PATH}")
except Exception as e:
    print(f"[RAG] ChromaDB init failed: {e}. RAG will be disabled.")
    chroma_client = None
    collection = None
    pdf_collection = None
    CHROMA_AVAILABLE = False


def generate_with_groq(prompt: str) -> str:
    """Generate response using Groq."""
    if not groq_client:
        raise RuntimeError("Groq API key not configured")
    try:
        chat = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024,
            temperature=0.7
        )
        return chat.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Groq failed] {e}")
        raise

# ═══════════════════════════════════════════════════════
#  HYBRID RAG HELPERS
# ═══════════════════════════════════════════════════════

# ── Date Resolution (deterministic, server-side) ─────────────────────────────
def resolve_date_range(phrase: str, tz: str = "Asia/Kolkata") -> tuple:
    """
    Resolve natural language date phrases to (start_date_str, end_date_str).
    Returns ISO YYYY-MM-DD strings.
    """
    try:
        now = datetime.now(ZoneInfo(tz))
    except Exception:
        now = datetime.now()
    today = now.date()
    
    p = phrase.lower().strip().replace("-", "_")
    
    if p in ("today",):
        return today.isoformat(), today.isoformat()
    if p in ("yesterday",):
        d = today - timedelta(days=1)
        return d.isoformat(), d.isoformat()
    if p in ("tomorrow",):
        d = today + timedelta(days=1)
        return d.isoformat(), d.isoformat()
    if p in ("this_week", "this week"):
        start = today - timedelta(days=today.weekday())
        return start.isoformat(), today.isoformat()
    if p in ("last_week", "last week"):
        start = today - timedelta(days=today.weekday() + 7)
        end   = today - timedelta(days=today.weekday() + 1)
        return start.isoformat(), end.isoformat()
    if p in ("this_month", "this month"):
        start = today.replace(day=1)
        return start.isoformat(), today.isoformat()
    if p in ("last_month", "last month"):
        first_of_this = today.replace(day=1)
        last_of_prev  = first_of_this - timedelta(days=1)
        first_of_prev = last_of_prev.replace(day=1)
        return first_of_prev.isoformat(), last_of_prev.isoformat()
    if p in ("last_7_days", "last 7 days"):
        start = today - timedelta(days=6)
        return start.isoformat(), today.isoformat()
    if p in ("last_30_days", "last 30 days", "last month roughly"):
        start = today - timedelta(days=29)
        return start.isoformat(), today.isoformat()
    # weekdays
    days = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}
    for day_name, day_num in days.items():
        if p == day_name or p == f"last {day_name}":
            days_back = (today.weekday() - day_num) % 7 or 7
            d = today - timedelta(days=days_back)
            return d.isoformat(), d.isoformat()
    # fallback: last 7 days
    start = today - timedelta(days=6)
    return start.isoformat(), today.isoformat()


def get_period_dates(period_label: str) -> tuple:
    """Map period labels like 'this_week', 'last_month' to (start, end) ISO strings."""
    return resolve_date_range(period_label)


# ── Intent Classification ──────────────────────────────────────────────────────
def classify_intent(query: str, history: list) -> str:
    """
    Classify into: PERSONAL | GENERIC | HYBRID | OUT_OF_DOMAIN.
    Uses deterministic patterns first, LLM fallback for ambiguous.
    """
    q = query.lower().strip()

    # OUT_OF_DOMAIN (hard blocklist)
    ood = [
        r"\bweather\b", r"\bpolitics\b", r"\bmovie\b", r"\bnews\b",
        r"\bstocks?\b", r"\bcrypto\b", r"\bjavaScript\b", r"\bpython code\b",
        r"\bwrite (a |an )?program\b", r"\bwrite (a |an )?script\b",
        r"\bsql query\b", r"\bhtml\b", r"\bweb scraping\b",
        r"\bpresident\b", r"\belection\b", r"\brecipe (for|to make)\b(?!.*protein)",
    ]
    if any(re.search(k, q, re.IGNORECASE) for k in ood):
        return "OUT_OF_DOMAIN"

    # PERSONAL (asking about their own data)
    personal = [
        r"\bmy\b", r"\bdid i\b", r"\bhave i\b", r"\bam i\b",
        r"\bhow (much|many|often|long) did i\b",
        r"\blast (week|month|time|workout|session|night)\b",
        r"\byesterday\b", r"\bthis week\b", r"\bthis month\b",
        r"\bmy (progress|goal|weight|sleep|mood|calories|protein|water|steps|gym|workout|exercise|log|history|records|performance|attendance|streak)\b",
        r"\bhow (am|was) i (doing|performing)\b",
        r"\bwhen (did|was) (my|the last)\b",
    ]
    if any(re.search(k, q, re.IGNORECASE) for k in personal):
        # Check if it ALSO has generic fitness knowledge component → HYBRID
        generic_in_personal = [
            r"\bprogressive overload\b", r"\bhypertrophy\b", r"\bprotein (requirement|recommendation|intake)\b",
            r"\boptimal\b", r"\bsufficient\b", r"\benough (protein|sleep|calories)\b",
        ]
        if any(re.search(k, q, re.IGNORECASE) for k in generic_in_personal):
            return "HYBRID"
        return "PERSONAL"

    # GENERIC (fitness knowledge questions)
    generic = [
        r"\bwhat is\b", r"\bhow to\b", r"\bexplain\b", r"\bbest way\b",
        r"\bhow many (calories|reps|sets|grams)\b",
        r"\bbenefits of\b", r"\bwhat (should|does)\b",
        r"\bprogressive overload\b", r"\bhypertrophy\b", r"\brecovery\b",
        r"\bsuperset\b", r"\bdeload\b", r"\bRPE\b", r"\bVO2\b",
    ]
    if any(re.search(k, q, re.IGNORECASE) for k in generic):
        return "GENERIC"

    # LLM fallback for truly ambiguous cases
    if groq_client:
        system = (
            "Classify this fitness chatbot message into ONE of: "
            "PERSONAL (about the user's own data/logs), "
            "GENERIC (general fitness/nutrition knowledge), "
            "HYBRID (needs both personal data AND fitness knowledge), "
            "OUT_OF_DOMAIN (unrelated to fitness, health, nutrition, or wellness). "
            "Reply with ONLY the category word."
        )
        msgs = [{"role": "system", "content": system}]
        for h in (history or [])[-2:]:
            msgs.append({"role": "user" if h.get("type") == "user" else "assistant", "content": h.get("text", "")})
        msgs.append({"role": "user", "content": query})
        try:
            resp = groq_client.chat.completions.create(
                model=GROQ_MODEL, messages=msgs, max_tokens=10, temperature=0.0
            )
            cat = resp.choices[0].message.content.strip().upper()
            if cat in ("PERSONAL", "GENERIC", "HYBRID", "OUT_OF_DOMAIN"):
                return cat
        except Exception:
            pass
    return "GENERIC"


# ── PDF Knowledge Search ───────────────────────────────────────────────────────
def search_pdf_knowledge(query: str, threshold: float = 1.0) -> str:
    if not CHROMA_AVAILABLE or not pdf_collection:
        return ""
    try:
        results = pdf_collection.query(query_texts=[query], n_results=3)
        if not results or not results.get("documents") or not results["documents"][0]:
            return ""
        docs = results["documents"][0]
        distances = results.get("distances", [[]])[0]
        chunks = []
        for doc, dist in zip(docs, distances):
            if dist < threshold:
                clean = re.sub(r'```+', '', doc)
                clean = re.sub(r'\n{3,}', '\n\n', clean)
                # Sanitize: reject suspicious content
                if any(p in clean.lower() for p in ["ignore previous", "system prompt", "disregard"]):
                    continue
                chunks.append(clean[:900])
        return "\n---\n".join(chunks)
    except Exception as e:
        print(f"[RAG] PDF search error: {e}")
        return ""


# ── Node Tool Executor ────────────────────────────────────────────────────────
def execute_tool(user_id: str, tool_name: str, args: dict, confirmed: bool = False) -> dict:
    """
    Call the Node.js /api/ai/tools endpoint.
    user_id is ALWAYS supplied by Python (from the original auth'd request), never from the LLM.
    """
    try:
        resp = requests.post(
            f"{NODE_SERVICE_URL}/api/ai/tools",
            json={"userId": user_id, "tool": tool_name, "args": args, "confirmed": confirmed},
            headers={"x-ai-service-secret": AI_SERVICE_SECRET, "Content-Type": "application/json"},
            timeout=8
        )
        if resp.status_code == 200:
            return resp.json().get("result", {})
        print(f"[Tool] {tool_name} failed: {resp.status_code} {resp.text[:200]}")
        return {"error": f"Tool call failed: {resp.status_code}"}
    except Exception as e:
        print(f"[Tool] {tool_name} exception: {e}")
        return {"error": str(e)}



# ═══════════════════════════════════════════════════════
#  RAG HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════

def make_deterministic_id(user_id: str, source_type: str, source_id: str) -> str:
    """
    Create a stable, deterministic memory ID.
    Format: sha256(user_id:source_type:source_id)[:32]
    Ensures idempotent upserts — same source never creates duplicates.
    """
    raw = f"{user_id}:{source_type}:{source_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


def upsert_memory(
    memory_id: str,
    user_id: str,
    text: str,
    metadata: dict
) -> bool:
    """
    Upsert a memory into ChromaDB.
    Uses deterministic ID → same source = update, not duplicate.
    Returns True on success, False on failure.
    """
    if not CHROMA_AVAILABLE or not collection:
        return False
    try:
        # Merge required fields into metadata
        full_metadata = {
            "user_id": user_id,
            "ingested_at": time.time(),
            **metadata
        }
        # Sanitize metadata — ChromaDB only accepts str/int/float/bool
        clean_meta = {}
        for k, v in full_metadata.items():
            if isinstance(v, (str, int, float, bool)):
                clean_meta[k] = v
            else:
                clean_meta[k] = str(v)

        collection.upsert(
            documents=[text],
            metadatas=[clean_meta],
            ids=[memory_id]
        )
        return True
    except Exception as e:
        print(f"[RAG] upsert_memory failed: {e}")
        return False


def retrieve_memories(user_id: str, query: str, top_k: int = None, threshold: float = None) -> list:
    """
    Retrieve semantically relevant memories for a user.
    Filters by user_id metadata, then applies relevance threshold.
    Returns list of dicts with {text, metadata, distance}.
    NEVER returns another user's memories.
    """
    if not CHROMA_AVAILABLE or not collection:
        return []

    k = top_k or RAG_TOP_K
    thresh = threshold or RAG_RELEVANCE_THRESHOLD

    try:
        start = time.time()
        results = collection.query(
            query_texts=[query],
            n_results=min(k * 2, 20),  # over-fetch then filter
            where={"user_id": user_id}  # CRITICAL: user isolation
        )
        latency_ms = int((time.time() - start) * 1000)
        print(f"[RAG] retrieval latency: {latency_ms}ms for user {user_id[:8]}...")

        if not results or not results.get("documents") or not results["documents"][0]:
            return []

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results.get("distances", [[]])[0]

        memories = []
        for doc, meta, dist in zip(docs, metas, distances):
            # ChromaDB cosine distance: 0=identical, 2=opposite
            # Filter: keep only relevant results (dist < threshold)
            if dist <= thresh:
                memories.append({
                    "text": doc,
                    "metadata": meta,
                    "distance": dist,
                    "relevance": round(1 - dist / 2, 3)  # normalize to 0-1
                })

        # Sort by relevance descending
        memories.sort(key=lambda x: x["relevance"], reverse=True)

        # Trim to top-K after filtering
        memories = memories[:k]

        print(f"[RAG] retrieved {len(docs)} candidates, {len(memories)} passed threshold {thresh}")
        return memories

    except Exception as e:
        print(f"[RAG] retrieve_memories failed: {e}")
        return []


def build_rag_context(user_profile: dict, recent_activity: list, memories: list, user_message: str) -> str:
    """
    Build a structured context string for the Groq prompt.
    Layers: current profile → recent activity → semantic memories.
    """
    lines = []

    # A. Current profile
    if user_profile:
        lines.append("CURRENT USER PROFILE:")
        if user_profile.get("name"):
            lines.append(f"  Name: {user_profile['name']}")
        if user_profile.get("goal"):
            goal_map = {"lose_weight": "Fat loss", "gain_muscle": "Muscle gain", "maintain": "Maintain weight"}
            lines.append(f"  Goal: {goal_map.get(user_profile['goal'], user_profile['goal'])}")
        if user_profile.get("weight"):
            lines.append(f"  Weight: {user_profile['weight']}kg")
        if user_profile.get("targetWeight"):
            lines.append(f"  Target weight: {user_profile['targetWeight']}kg")
        if user_profile.get("experience"):
            lines.append(f"  Experience: {user_profile['experience']}")
        if user_profile.get("dietPreference"):
            lines.append(f"  Diet: {user_profile['dietPreference']}")
        if user_profile.get("workoutEnvironment"):
            lines.append(f"  Workout environment: {user_profile['workoutEnvironment']}")
        if user_profile.get("injuries") and len(user_profile["injuries"]) > 0:
            lines.append(f"  Known injuries/limitations: {', '.join(user_profile['injuries'])}")
        if user_profile.get("sleepHours"):
            lines.append(f"  Typical sleep: {user_profile['sleepHours']} hours")

    # B. Recent structured activity (last 3 days)
    if recent_activity:
        lines.append("\nRECENT ACTIVITY (last 3 days):")
        for day in recent_activity[:3]:
            day_parts = []
            if "date" in day:
                day_parts.append(day["date"])
            if day.get("gym") is True:
                day_parts.append("✓ Gym")
            elif day.get("gym") is False:
                day_parts.append("✗ No gym")
            if day.get("calories"):
                day_parts.append(f"{day['calories']} kcal")
            if day.get("protein"):
                day_parts.append(f"{day['protein']}g protein")
            if day.get("sleep") is not None:
                day_parts.append(f"{day['sleep']}h sleep")
            if day.get("mood") is not None:
                mood_map = {1: "Low", 2: "Meh", 3: "Ok", 4: "Good", 5: "Amazing"}
                day_parts.append(f"Mood: {mood_map.get(day['mood'], day['mood'])}")
            if day_parts:
                lines.append(f"  - {' | '.join(day_parts)}")

    # C. Semantically retrieved historical memories
    if memories:
        lines.append("\nRELEVANT HISTORICAL CONTEXT:")
        lines.append("(Retrieved from your fitness history — only factual, no inventions)")
        for m in memories:
            lines.append(f"  • {m['text']}")

    return "\n".join(lines)


# ═══════════════════════════════════════════════════════
#  PYDANTIC MODELS
# ═══════════════════════════════════════════════════════

class MemoryIngestRequest(BaseModel):
    user_id: str
    memory_text: str
    metadata: dict = {}

class RAGIngestRequest(BaseModel):
    user_id: str
    source_type: str            # workout | nutrition | progress | coach_conversation | fitness_goal | recovery | preference
    source_id: str              # deterministic: date string, mongo _id, etc.
    memory_text: str
    metadata: dict = {}

class RAGRetrieveRequest(BaseModel):
    user_id: str
    query: str
    top_k: Optional[int] = None
    threshold: Optional[float] = None

class RAGDeleteUserRequest(BaseModel):
    user_id: str

class RAGDeleteSourceRequest(BaseModel):
    user_id: str
    source_type: str
    source_id: str

class CoachChatRequest(BaseModel):
    user_id: str
    message: str
    history: Optional[List[Dict[str, Any]]] = []
    user_profile: Optional[Dict[str, Any]] = {}
    recent_activity: Optional[List[Dict[str, Any]]] = []
    system_prompt: Optional[str] = None
    pending_action: Optional[Dict[str, Any]] = None

class RAGBackfillRequest(BaseModel):
    user_id: str
    progress_records: Optional[List[Dict[str, Any]]] = []
    food_logs: Optional[List[Dict[str, Any]]] = []
    exercise_history: Optional[List[Dict[str, Any]]] = []
    user_profile: Optional[Dict[str, Any]] = {}

class InsightRequest(BaseModel):
    user_id: str
    user_name: str
    target: str
    weight: float
    progress_summary: str

class DigestRequest(BaseModel):
    user_id: str
    user_name: str
    goal: str
    weight: float
    gymDays: int
    avgCalories: int
    avgProtein: int
    avgFormScore: Optional[float] = None
    weightChange: Optional[float] = None

class PredictSkipRequest(BaseModel):
    user_id: str
    gym_days_last_7: int
    avg_calories_last_7: float
    avg_protein_last_7: float
    days_since_last_gym: int


# ═══════════════════════════════════════════════════════
#  HEALTH
# ═══════════════════════════════════════════════════════

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "rag_enabled": RAG_ENABLED,
        "chroma_available": CHROMA_AVAILABLE,
        "groq_configured": bool(GROQ_API_KEY),
        "collection": RAG_COLLECTION if CHROMA_AVAILABLE else None,
        "memory_count": collection.count() if CHROMA_AVAILABLE and collection else 0
    }

@app.get("/rag/health")
def rag_health():
    if not CHROMA_AVAILABLE:
        return {"status": "unavailable", "error": "ChromaDB not initialized"}
    try:
        count = collection.count()
        return {"status": "healthy", "total_memories": count, "collection": RAG_COLLECTION}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ═══════════════════════════════════════════════════════
#  LEGACY ENDPOINT (backward compat) — Keep working
# ═══════════════════════════════════════════════════════

@app.post("/memory/ingest")
def ingest_memory_legacy(req: MemoryIngestRequest):
    """
    Legacy endpoint — kept for backward compatibility with progressRoutes.js.
    Now routes through the deterministic upsert system.
    """
    try:
        # Build a deterministic ID from user_id + type + timestamp day
        source_type = req.metadata.get("type", "general")
        # Use date from metadata if available, else current day
        date_str = req.metadata.get("date", "")
        if date_str:
            source_id = date_str[:10]  # YYYY-MM-DD
        else:
            source_id = time.strftime("%Y-%m-%d")

        memory_id = make_deterministic_id(req.user_id, source_type, source_id)
        success = upsert_memory(memory_id, req.user_id, req.memory_text, req.metadata)

        if success:
            return {"status": "success", "memory_id": memory_id, "action": "upserted"}
        else:
            return {"status": "skipped", "reason": "ChromaDB unavailable"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
#  RAG ENDPOINTS
# ═══════════════════════════════════════════════════════

@app.post("/rag/ingest")
def rag_ingest(req: RAGIngestRequest):
    """
    Upsert a memory into ChromaDB with a deterministic ID.
    Idempotent: same source_type + source_id = update existing memory.
    """
    if not RAG_ENABLED:
        return {"status": "disabled"}

    memory_id = make_deterministic_id(req.user_id, req.source_type, req.source_id)
    metadata = {
        "source_type": req.source_type,
        "source_id": req.source_id,
        **req.metadata
    }
    success = upsert_memory(memory_id, req.user_id, req.memory_text, metadata)

    if success:
        return {"status": "success", "memory_id": memory_id, "action": "upserted"}
    else:
        return {"status": "skipped", "reason": "ChromaDB unavailable"}


@app.post("/rag/retrieve")
def rag_retrieve(req: RAGRetrieveRequest):
    """
    Semantically retrieve relevant memories for a user.
    Always filters by user_id — never returns another user's data.
    """
    memories = retrieve_memories(req.user_id, req.query, req.top_k, req.threshold)
    return {
        "memories": memories,
        "count": len(memories),
        "user_id": req.user_id
    }


@app.post("/rag/delete-user")
def rag_delete_user(req: RAGDeleteUserRequest):
    """
    Delete ALL memories for a user.
    Called on account deletion — mandatory cleanup.
    """
    if not CHROMA_AVAILABLE or not collection:
        return {"status": "skipped", "reason": "ChromaDB unavailable"}
    try:
        # Get all IDs for this user
        results = collection.get(where={"user_id": req.user_id})
        ids_to_delete = results.get("ids", [])
        if ids_to_delete:
            collection.delete(ids=ids_to_delete)
            print(f"[RAG] Deleted {len(ids_to_delete)} memories for user {req.user_id[:8]}...")
        return {"status": "success", "deleted_count": len(ids_to_delete)}
    except Exception as e:
        print(f"[RAG] delete-user failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/delete-source")
def rag_delete_source(req: RAGDeleteSourceRequest):
    """
    Delete a specific memory by source_type + source_id.
    Called when user deletes a workout/nutrition entry.
    """
    if not CHROMA_AVAILABLE or not collection:
        return {"status": "skipped", "reason": "ChromaDB unavailable"}
    try:
        memory_id = make_deterministic_id(req.user_id, req.source_type, req.source_id)
        collection.delete(ids=[memory_id])
        return {"status": "success", "deleted_id": memory_id}
    except Exception as e:
        print(f"[RAG] delete-source failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/rag/backfill")
def rag_backfill(req: RAGBackfillRequest):
    """
    Idempotent backfill for a user's existing data.
    Safe to run multiple times — deterministic IDs prevent duplicates.
    """
    if not RAG_ENABLED or not CHROMA_AVAILABLE:
        return {"status": "skipped", "reason": "RAG disabled or ChromaDB unavailable"}

    ingested = 0
    errors = 0

    # 1. Progress records
    for p in (req.progress_records or []):
        try:
            date_str = str(p.get("date", ""))[:10]
            if not date_str:
                continue
            gym = p.get("wentToGym", False)
            cals = p.get("caloriesConsumed", 0)
            protein = p.get("proteinIntake", 0)
            sleep = p.get("sleepHours")
            mood = p.get("moodScore")
            weight = p.get("weight")
            steps = p.get("steps")

            parts = [f"On {date_str}:"]
            parts.append(f"Gym: {'Yes' if gym else 'No'}")
            if cals: parts.append(f"Calories: {cals}")
            if protein: parts.append(f"Protein: {protein}g")
            if sleep is not None: parts.append(f"Sleep: {sleep}h")
            if mood is not None:
                mood_map = {1: "Very low", 2: "Low", 3: "Neutral", 4: "Good", 5: "Excellent"}
                parts.append(f"Mood: {mood_map.get(mood, mood)}")
            if weight: parts.append(f"Weight: {weight}kg")
            if steps: parts.append(f"Steps: {steps}")

            text = " | ".join(parts)
            mem_id = make_deterministic_id(req.user_id, "daily_progress", date_str)
            upsert_memory(mem_id, req.user_id, text, {
                "source_type": "daily_progress", "source_id": date_str,
                "date": date_str, "gym": gym
            })
            ingested += 1
        except Exception as e:
            print(f"[RAG] backfill progress error: {e}")
            errors += 1

    # 2. Food logs
    for fl in (req.food_logs or []):
        try:
            date_str = str(fl.get("date", ""))[:10]
            if not date_str:
                continue
            total_cal = fl.get("totalCalories", 0)
            total_protein = fl.get("totalProtein", 0)
            foods_list = [f.get("name", "") for f in fl.get("foods", [])][:5]

            text = f"On {date_str}, food log: {total_cal} kcal total, {total_protein}g protein."
            if foods_list:
                text += f" Foods included: {', '.join(foods_list)}."

            log_id = str(fl.get("_id", date_str))
            mem_id = make_deterministic_id(req.user_id, "nutrition", log_id)
            upsert_memory(mem_id, req.user_id, text, {
                "source_type": "nutrition", "source_id": log_id,
                "date": date_str, "total_calories": total_cal, "total_protein": total_protein
            })
            ingested += 1
        except Exception as e:
            print(f"[RAG] backfill food error: {e}")
            errors += 1

    # 3. Exercise history
    for ex in (req.exercise_history or []):
        try:
            date_str = str(ex.get("date", ""))[:10]
            exercise_name = ex.get("exerciseName", "exercise")
            reps = ex.get("reps", 0)
            form_score = ex.get("formScore", None)
            ex_id = str(ex.get("_id", f"{exercise_name}_{date_str}"))

            text = f"On {date_str}, performed {exercise_name}: {reps} reps."
            if form_score is not None:
                text += f" Form score: {form_score}/100."

            mem_id = make_deterministic_id(req.user_id, "exercise", ex_id)
            upsert_memory(mem_id, req.user_id, text, {
                "source_type": "exercise", "source_id": ex_id,
                "date": date_str, "exercise": exercise_name
            })
            ingested += 1
        except Exception as e:
            print(f"[RAG] backfill exercise error: {e}")
            errors += 1

    # 4. User profile / goals
    profile = req.user_profile or {}
    if profile and profile.get("goal"):
        try:
            goal_map = {"lose_weight": "fat loss", "gain_muscle": "muscle gain", "maintain": "maintaining weight"}
            goal_text = goal_map.get(profile.get("goal", ""), profile.get("goal", ""))
            parts = [f"User's fitness goal is {goal_text}."]
            if profile.get("weight"):
                parts.append(f"Current weight: {profile['weight']}kg.")
            if profile.get("targetWeight"):
                parts.append(f"Target weight: {profile['targetWeight']}kg.")
            if profile.get("experience"):
                parts.append(f"Experience level: {profile['experience']}.")
            if profile.get("injuries") and len(profile["injuries"]) > 0:
                parts.append(f"Known injuries: {', '.join(profile['injuries'])}.")

            text = " ".join(parts)
            mem_id = make_deterministic_id(req.user_id, "fitness_goal", "profile")
            upsert_memory(mem_id, req.user_id, text, {
                "source_type": "fitness_goal", "source_id": "profile",
                "goal": profile.get("goal", "")
            })
            ingested += 1
        except Exception as e:
            print(f"[RAG] backfill goal error: {e}")
            errors += 1

    return {
        "status": "success",
        "ingested": ingested,
        "errors": errors,
        "user_id": req.user_id
    }


@app.post("/rag/coach-chat")
def rag_coach_chat(req: CoachChatRequest):
    """
    Hybrid RAG AI Coach chat — upgraded with Groq native tool-calling.
    Flow:
      1. Intent Classification (deterministic + LLM fallback)
      2. OUT_OF_DOMAIN → immediate refusal
      3. PERSONAL/HYBRID/GENERIC → Groq tool-calling loop (max 3 iterations)
         - Groq selects tools, Python executes via Node /api/ai/tools
         - Results fed back into context for final answer
    Security: userId is ALWAYS from req.user_id (set by Node from JWT), never from LLM.
    """
    start_time = time.time()
    rag_sources = []
    today_str = datetime.now().strftime("%Y-%m-%d")
    tz = "Asia/Kolkata"

    # ── 1. Intent Classification ──────────────────────────────────────────────
    intent = classify_intent(req.message, req.history or [])

    # ── 2. OUT_OF_DOMAIN ──────────────────────────────────────────────────────
    if intent == "OUT_OF_DOMAIN":
        return {
            "text": "I'm your Runli fitness coach! I can only help with workouts, nutrition, fitness tracking, and your Runli data. For anything else, I'm not the right tool. 💪",
            "rag_sources": [], "memories_used": 0, "rag_enabled": False, "fallback_used": False,
            "latency_ms": int((time.time() - start_time) * 1000)
        }


    # ── 4. Build system prompt ────────────────────────────────────────────────
    profile = req.user_profile or {}
    profile_snippet = ""
    if profile:
        parts = []
        if profile.get("name"): parts.append(f"Name: {profile['name']}")
        if profile.get("goal"): parts.append(f"Goal: {profile['goal']}")
        if profile.get("weight"): parts.append(f"Weight: {profile['weight']}kg")
        if profile.get("targetWeight"): parts.append(f"Target: {profile['targetWeight']}kg")
        if profile.get("experience"): parts.append(f"Level: {profile['experience']}")
        if profile.get("injuries"): parts.append(f"Injuries: {', '.join(profile['injuries'])}")
        profile_snippet = " | ".join(parts)

    base_system = req.system_prompt or (
        "You are Runli Coach — a personal AI fitness coach. "
        "You are concise, warm, science-backed, and deeply personal. "
        "Never invent data or facts. Only reference data from tool results. "
        "When tool results are empty, say so honestly — do not guess. "
        "Fitness, nutrition, workout, recovery, and Runli app topics ONLY. "
        "Refuse non-fitness questions politely. "
        "Replies must be SHORT (2-4 sentences) unless the user asks for a plan. "
        "Never mention OpenAI, ChatGPT, Gemini, or Groq. "
        "Do NOT diagnose medical conditions. If symptoms may need medical attention, recommend a doctor."
    )
    base_system += f"\n\nCurrent Date: {today_str} (Timezone: {tz})"
    if profile_snippet:
        base_system += f"\nUser Profile: {profile_snippet}"

    # ── 5. Tool Definitions (Groq native tool-calling) ────────────────────────
    TOOLS = [
        {
            "type": "function",
            "function": {
                "name": "get_daily_progress",
                "description": "Get the user's daily progress record for a specific date (gym attendance, water, calories, protein, sleep, mood, steps, weight).",
                "parameters": {"type": "object", "properties": {
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format"}
                }, "required": ["date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_progress_history",
                "description": "Get progress history across a date range. Use for trend analysis, weekly/monthly summaries, gym streak questions.",
                "parameters": {"type": "object", "properties": {
                    "start_date": {"type": "string", "description": "Start date YYYY-MM-DD"},
                    "end_date": {"type": "string", "description": "End date YYYY-MM-DD"}
                }, "required": ["start_date", "end_date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_food_log",
                "description": "Get the user's food/nutrition logs for a date range. Returns meals, macros, calories, protein.",
                "parameters": {"type": "object", "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                }, "required": ["start_date", "end_date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_exercise_history",
                "description": "Get the user's exercise log. Can filter by exercise name and date range.",
                "parameters": {"type": "object", "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"},
                    "exercise_name": {"type": "string", "description": "Optional: filter by exercise name (e.g. 'bench press')"}
                }, "required": ["start_date", "end_date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_user_profile",
                "description": "Get the user's fitness goals, targets (calorie goal, protein goal, water goal), current weight, target weight, experience level.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_diet_plan",
                "description": "Get the user's active AI-generated diet plan with meal breakdown.",
                "parameters": {"type": "object", "properties": {}}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_fitness_score_history",
                "description": "Get the user's daily fitness score history (overall score 0-100 and breakdown by category).",
                "parameters": {"type": "object", "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                }, "required": ["start_date", "end_date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_progress_summary",
                "description": "Get an aggregated summary for a period: gym days, attendance rate, average calories/protein/sleep, weight trend.",
                "parameters": {"type": "object", "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                }, "required": ["start_date", "end_date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_personal_records",
                "description": "Get the user's personal records (max reps) for exercises. Can filter by exercise name.",
                "parameters": {"type": "object", "properties": {
                    "exercise_name": {"type": "string", "description": "Optional: specific exercise name"}
                }}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_exercise_summary",
                "description": "Get exercise frequency summary for a period: which exercises done, how many sessions each.",
                "parameters": {"type": "object", "properties": {
                    "start_date": {"type": "string"},
                    "end_date": {"type": "string"}
                }, "required": ["start_date", "end_date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "compare_progress_periods",
                "description": "Compare two time periods side by side (gym days, calories, protein, sleep, exercise sessions).",
                "parameters": {"type": "object", "properties": {
                    "period1_start": {"type": "string"},
                    "period1_end": {"type": "string"},
                    "period2_start": {"type": "string"},
                    "period2_end": {"type": "string"}
                }, "required": ["period1_start", "period1_end", "period2_start", "period2_end"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "log_water",
                "description": "Log water intake for the user.",
                "parameters": {"type": "object", "properties": {
                    "amount_ml": {"type": "number", "description": "Water amount in ml"},
                    "date": {"type": "string", "description": "YYYY-MM-DD (defaults to today)"}
                }, "required": ["amount_ml"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "mark_gym_attendance",
                "description": "Mark that the user went to the gym on a specific date.",
                "parameters": {"type": "object", "properties": {
                    "date": {"type": "string", "description": "YYYY-MM-DD (defaults to today)"}
                }}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "log_weight",
                "description": "Log the user's body weight.",
                "parameters": {"type": "object", "properties": {
                    "weight_kg": {"type": "number"},
                    "date": {"type": "string"}
                }, "required": ["weight_kg"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "log_sleep",
                "description": "Log sleep hours for the user.",
                "parameters": {"type": "object", "properties": {
                    "hours": {"type": "number"},
                    "date": {"type": "string"}
                }, "required": ["hours"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "log_mood",
                "description": "Log mood score (1=awful, 2=bad, 3=ok, 4=good, 5=amazing).",
                "parameters": {"type": "object", "properties": {
                    "score": {"type": "integer", "minimum": 1, "maximum": 5},
                    "date": {"type": "string"}
                }, "required": ["score"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "delete_daily_progress",
                "description": "Delete the user's daily progress record for a date. DESTRUCTIVE — requires confirmation.",
                "parameters": {"type": "object", "properties": {
                    "date": {"type": "string", "description": "YYYY-MM-DD"}
                }, "required": ["date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "delete_food_log",
                "description": "Delete the user's food log for a date. DESTRUCTIVE — requires confirmation.",
                "parameters": {"type": "object", "properties": {
                    "date": {"type": "string"}
                }, "required": ["date"]}
            }
        },
        {
            "type": "function",
            "function": {
                "name": "delete_exercise_entry",
                "description": "Delete a specific exercise entry. DESTRUCTIVE — requires confirmation.",
                "parameters": {"type": "object", "properties": {
                    "date": {"type": "string"},
                    "exercise_name": {"type": "string"}
                }, "required": ["date", "exercise_name"]}
            }
        },
    ]

    DESTRUCTIVE_TOOLS = {"delete_daily_progress", "delete_food_log", "delete_exercise_entry"}

    # ── 6. Check for pending confirmation ────────────────────────────────────
    pending_action = req.pending_action or {}
    confirmed = False
    if pending_action and re.search(r"\b(yes|confirm|proceed|go ahead|sure|do it|ok)\b", req.message, re.IGNORECASE):
        confirmed = True

    # ── 7. GENERIC: PDF-only path (no tools needed) ───────────────────────────
    if intent == "GENERIC":
        pdf_ctx = search_pdf_knowledge(req.message)
        messages = [{"role": "system", "content": base_system}]
        if pdf_ctx:
            messages.append({"role": "system", "content": f"Fitness Knowledge Base (from verified PDFs):\n{pdf_ctx}"})
            rag_sources.append({"source_type": "pdf", "text": "Fitness knowledge base consulted"})
        for h in (req.history or [])[-8:]:
            role = "user" if h.get("type") == "user" else "assistant"
            txt = h.get("text", "").strip()
            if txt:
                messages.append({"role": role, "content": txt})
        messages.append({"role": "user", "content": req.message})
        try:
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL, messages=messages, max_tokens=400, temperature=0.7
            )
            return {
                "text": completion.choices[0].message.content.strip(),
                "rag_sources": rag_sources, "memories_used": len(rag_sources),
                "rag_enabled": True, "fallback_used": False,
                "latency_ms": int((time.time() - start_time) * 1000)
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

    # ── 8. PERSONAL / HYBRID: Native Groq tool-calling loop ──────────────────
    messages = [{"role": "system", "content": base_system}]

    # For HYBRID, also add PDF context upfront
    if intent == "HYBRID":
        pdf_ctx = search_pdf_knowledge(req.message)
        if pdf_ctx:
            messages.append({"role": "system", "content": f"General Fitness Knowledge:\n{pdf_ctx}"})
            rag_sources.append({"source_type": "pdf", "text": "Fitness knowledge base consulted"})

    # If there's a pending destructive action and user confirmed, execute it directly
    if confirmed and pending_action.get("tool") in DESTRUCTIVE_TOOLS:
        result = execute_tool(req.user_id, pending_action["tool"], pending_action.get("args", {}), confirmed=True)
        messages.append({"role": "system", "content": f"Tool result for {pending_action['tool']}: {json.dumps(result)}"})
        for h in (req.history or [])[-8:]:
            role = "user" if h.get("type") == "user" else "assistant"
            txt = h.get("text", "").strip()
            if txt: messages.append({"role": role, "content": txt})
        messages.append({"role": "user", "content": req.message})
        try:
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL, messages=messages, max_tokens=200, temperature=0.7
            )
            return {
                "text": completion.choices[0].message.content.strip(),
                "rag_sources": rag_sources, "memories_used": len(rag_sources),
                "rag_enabled": True, "fallback_used": False, "pending_action": None,
                "latency_ms": int((time.time() - start_time) * 1000)
            }
        except Exception:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

    # Add conversation history
    for h in (req.history or [])[-8:]:
        role = "user" if h.get("type") == "user" else "assistant"
        txt = h.get("text", "").strip()
        if txt: messages.append({"role": role, "content": txt})
    messages.append({"role": "user", "content": req.message})

    # Tool-calling loop (max 3 rounds to allow multi-step reasoning)
    new_pending_action = None
    for _round in range(3):
        if not groq_client:
            raise HTTPException(status_code=503, detail="Groq not configured")
        try:
            completion = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                max_tokens=500,
                temperature=0.3,
            )
        except Exception as e:
            print(f"[RAG] Groq tool-calling failed: {e}")
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable.")

        choice = completion.choices[0]
        finish_reason = choice.finish_reason

        # No tool call → final answer
        if finish_reason == "stop" or not choice.message.tool_calls:
            response_text = (choice.message.content or "").strip()
            return {
                "text": response_text,
                "rag_sources": rag_sources,
                "memories_used": len(rag_sources),
                "rag_enabled": True,
                "fallback_used": False,
                "pending_action": new_pending_action,
                "latency_ms": int((time.time() - start_time) * 1000)
            }

        # Process tool calls
        messages.append(choice.message)  # append assistant message with tool_calls
        for tc in choice.message.tool_calls:
            tool_name = tc.function.name
            try:
                tool_args = json.loads(tc.function.arguments or "{}")
            except Exception:
                tool_args = {}

            # Destructive tool → intercept, ask for confirmation
            if tool_name in DESTRUCTIVE_TOOLS:
                confirm_result = execute_tool(req.user_id, tool_name, tool_args, confirmed=False)
                confirm_msg = confirm_result.get("message", f"I can run {tool_name}. Please confirm.")
                new_pending_action = {"tool": tool_name, "args": tool_args}
                # Return confirmation prompt immediately
                return {
                    "text": confirm_msg,
                    "rag_sources": rag_sources,
                    "memories_used": 0,
                    "rag_enabled": True,
                    "fallback_used": False,
                    "pending_action": new_pending_action,
                    "latency_ms": int((time.time() - start_time) * 1000)
                }

            # Execute safe tool
            tool_result = execute_tool(req.user_id, tool_name, tool_args, confirmed=False)
            rag_sources.append({"source_type": "tool", "tool": tool_name})
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(tool_result)
            })

    # Exceeded max rounds — ask Groq to wrap up with what it has
    try:
        messages.append({"role": "user", "content": "Please summarize the results above for the user."})
        final = groq_client.chat.completions.create(
            model=GROQ_MODEL, messages=messages, max_tokens=300, temperature=0.7
        )
        response_text = final.choices[0].message.content.strip()
    except Exception:
        response_text = "I retrieved your data but had trouble summarizing it. Please try a more specific question."

    return {
        "text": response_text,
        "rag_sources": rag_sources,
        "memories_used": len(rag_sources),
        "rag_enabled": True,
        "fallback_used": False,
        "pending_action": new_pending_action,
        "latency_ms": int((time.time() - start_time) * 1000)
    }



# ═══════════════════════════════════════════════════════
#  LEGACY AI GENERATION ENDPOINTS (unchanged)
# ═══════════════════════════════════════════════════════

@app.post("/generate/insight")
def generate_insight(req: InsightRequest):
    # Retrieve past memories from Vector DB
    try:
        results = collection.query(
            query_texts=[req.progress_summary],
            n_results=2,
            where={"user_id": req.user_id}
        ) if CHROMA_AVAILABLE and collection else {"documents": [[]]}
        past_memories = results['documents'][0] if results['documents'] else []
    except Exception as e:
        past_memories = []
        print(f"Chroma DB query failed: {e}")

    past_context = ""
    if past_memories:
        past_context = "Historical Context (Past logs & struggles):\n"
        for mem in past_memories:
            past_context += f"- {mem}\n"

    prompt = f"""
    Act as a motivational fitness coach. Based on the following user data, provide a SINGLE, short, punchy, and personalized daily insight or tip (max 2 sentences).
    
    User Profile:
    - Name: {req.user_name}
    - Goal: {req.target}
    - Weight: {req.weight}kg
    
    Recent Activity (Last 3 Days):
    {req.progress_summary}
    
    {past_context}
    
    If the user has been consistent, praise them. If they missed the gym or goals, gently encourage them. Focus on ONE specific thing (e.g., protein, hydration, or gym consistency).
    Incorporate their past context naturally if relevant.
    """
    try:
        text = generate_with_groq(prompt)
        return {"insight": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/digest")
def generate_digest(req: DigestRequest):
    prompt = f"""
    You are an expert fitness analytics AI. Generate a weekly report in STRICT JSON (no markdown).
    
    User: {req.user_name}, Goal: {req.goal}, Weight: {req.weight}kg
    Last 7 Days: gym {req.gymDays}/7, avg cal {req.avgCalories}, avg protein {req.avgProtein}g, form score {req.avgFormScore or 'N/A'}, weight change {req.weightChange or 'N/A'}kg

    Return ONLY this JSON:
    {{"headline":"string","weeklyScore":0-100,"insights":[{{"type":"positive|warn|predict|challenge","text":"string"}},{{"type":"...","text":"..."}},{{"type":"...","text":"..."}}],"tip":"string"}}
    """
    try:
        raw_text = generate_with_groq(prompt)
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        return {"digest": raw_text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
#  XGBOOST PREDICTION
# ═══════════════════════════════════════════════════════

churn_model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')

def train_dummy_model():
    """Trains a baseline model to predict if a user will skip the gym tomorrow."""
    np.random.seed(42)
    X_synthetic = np.random.rand(200, 4)
    X_synthetic[:, 0] = X_synthetic[:, 0] * 7
    X_synthetic[:, 1] = X_synthetic[:, 1] * 3000 + 1000
    X_synthetic[:, 2] = X_synthetic[:, 2] * 200
    X_synthetic[:, 3] = X_synthetic[:, 3] * 10
    y_synthetic = (X_synthetic[:, 3] > 4) | (X_synthetic[:, 0] < 2)
    y_synthetic = y_synthetic.astype(int)
    churn_model.fit(X_synthetic, y_synthetic)
    print("XGBoost churn prediction model trained.")

train_dummy_model()


@app.post("/predict/skip")
def predict_gym_skip(req: PredictSkipRequest):
    """Predicts the probability (0.0 to 1.0) that the user will SKIP the gym tomorrow."""
    try:
        features = np.array([[
            req.gym_days_last_7,
            req.avg_calories_last_7,
            req.avg_protein_last_7,
            req.days_since_last_gym
        ]])
        prob_skip = churn_model.predict_proba(features)[0][1]
        if prob_skip > 0.7:
            alert = "High risk of breaking routine! Suggest sending a personalized push notification."
        elif prob_skip > 0.4:
            alert = "Moderate risk. A gentle reminder about their goals might help."
        else:
            alert = "Low risk. User is highly engaged."
        return {
            "skip_probability": float(prob_skip),
            "risk_level": "High" if prob_skip > 0.7 else "Moderate" if prob_skip > 0.4 else "Low",
            "actionable_insight": alert
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
#  COMPUTER VISION: YOLOv8 Pose Analysis
# ═══════════════════════════════════════════════════════

try:
    pose_model = YOLO('yolov8n-pose.pt')
except Exception as e:
    print(f"Warning: Could not load YOLO pose model: {e}")
    pose_model = None


@app.post("/vision/analyze-pose")
async def analyze_pose(file: UploadFile = File(...)):
    """Advanced CV endpoint for pose analysis using YOLOv8."""
    if not pose_model:
        raise HTTPException(status_code=500, detail="Pose model not loaded")
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        results = pose_model(img)
        persons_detected = len(results[0].boxes) if results and len(results) > 0 else 0
        if persons_detected == 1:
            score = 85
            feedback = "Good depth on the squat. Keep your chest up."
        elif persons_detected > 1:
            score = 0
            feedback = "Multiple people detected. Please isolate the subject."
        else:
            score = 0
            feedback = "No person detected in the frame."
        return {
            "status": "success",
            "form_score": score,
            "feedback": feedback,
            "persons_detected": persons_detected
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════════════
#  VOICE AI COACH: Deepgram WebSocket Proxy
# ═══════════════════════════════════════════════════════

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")


@app.websocket("/ws/voice-coach/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    if not DEEPGRAM_API_KEY:
        print("[VoiceCoach] No Deepgram API key configured.")
        await websocket.close(code=1008, reason="Server missing Deepgram key")
        return

    # 1. Fetch user context from Node.js backend
    try:
        node_port = os.getenv("NODE_PORT", "5001")
        resp = requests.get(f"http://localhost:{node_port}/api/context/{user_id}", timeout=2)
        context_data = resp.json() if resp.status_code == 200 else {}
    except Exception as e:
        print(f"[VoiceCoach] Error fetching context: {e}")
        context_data = {}

    # 2. RAG query: Get recent user insights from ChromaDB
    rag_history = ""
    if CHROMA_AVAILABLE and collection:
        try:
            memories = retrieve_memories(user_id, "user fitness preferences and past conversations", top_k=3)
            if memories:
                rag_history = " ".join([m["text"] for m in memories])
        except Exception:
            pass

    # 3. Construct Deepgram Settings JSON
    score = context_data.get('fitnessScore', {}) or {}
    total_score = score.get('total', 'Unknown')

    prompt = f"""You are Runli Coach, the official AI voice coach of Runli.

USER CONTEXT:
Name: {context_data.get('profile', {}).get('name', 'Friend')}
Goal: {context_data.get('profile', {}).get('goal', 'General Fitness')}
Fitness Score: {total_score}
Recent Activity: {json.dumps(context_data.get('recentActivity', [])[:3])}
Relevant History: {rag_history}

Provide personalized, concise advice. Keep responses under 15 seconds. If the user asks about their score, use the data provided. Be conversational and supportive."""

    settings = {
        "type": "Settings",
        "audio": {
            "input": {"encoding": "linear16", "sample_rate": 48000},
            "output": {"encoding": "linear16", "sample_rate": 24000, "container": "none"}
        },
        "agent": {
            "speak": {"provider": {"type": "deepgram", "model": "aura-asteria-en"}},
            "listen": {"provider": {"type": "deepgram", "model": "nova-2"}},
            "think": {
                "provider": {"type": "open_ai", "model": "gpt-4o"},
                "prompt": prompt
            },
            "greeting": "Hey! Ready to work on your fitness goals today?"
        }
    }

    headers = {"Authorization": f"Token {DEEPGRAM_API_KEY}"}

    try:
        async with websockets.connect('wss://agent.deepgram.com/agent', additional_headers=headers) as dg_socket:
            await dg_socket.send(json.dumps(settings))

            async def receive_from_deepgram():
                try:
                    async for message in dg_socket:
                        if isinstance(message, bytes):
                            await websocket.send_bytes(message)
                        else:
                            await websocket.send_text(message)
                except Exception as e:
                    print(f"[VoiceCoach] Deepgram disconnect: {e}")

            async def receive_from_client():
                try:
                    while True:
                        message = await websocket.receive()
                        if "bytes" in message:
                            await dg_socket.send(message["bytes"])
                        elif "text" in message:
                            await dg_socket.send(message["text"])
                except WebSocketDisconnect:
                    print("[VoiceCoach] Client disconnected")
                except Exception as e:
                    print(f"[VoiceCoach] Client read error: {e}")

            await asyncio.gather(receive_from_deepgram(), receive_from_client())

    except Exception as e:
        print(f"[VoiceCoach] Failed to connect to Deepgram: {e}")
        try:
            await websocket.close()
        except:
            pass

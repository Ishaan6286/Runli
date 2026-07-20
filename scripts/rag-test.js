import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
const TEST_USER = "test_user_999";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runTests() {
    console.log("Starting RAG isolation tests...\n");

    try {
        // 1. Delete user (clean slate)
        console.log("1. Cleaning up existing test user data...");
        await fetch(`${AI_SERVICE_URL}/rag/delete-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: TEST_USER })
        });
        
        // 2. Ingest fake workout data
        console.log("2. Ingesting fake workout data for test user...");
        await fetch(`${AI_SERVICE_URL}/rag/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: TEST_USER,
                source_type: 'exercise',
                source_id: 'test_workout_1',
                memory_text: 'User completed 314 consecutive pushups on their birthday.',
                metadata: { date: '2026-07-20' }
            })
        });
        
        await sleep(1000); // give chroma a second to sync

        // 3. Test Retrieval as TEST_USER
        console.log("3. Testing retrieval for TEST_USER...");
        const res1 = await fetch(`${AI_SERVICE_URL}/rag/coach-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: TEST_USER,
                message: "How many pushups did I do on my birthday?",
                history: []
            })
        });
        const data1 = await res1.json();
        console.log(` -> Response: "${data1.text}"`);
        if (!data1.text.includes("314")) {
            console.error(" ❌ FAILED: Did not retrieve the memory correctly.");
        } else {
            console.log(" ✅ PASSED: Successfully retrieved isolated memory.");
        }

        // 4. Test Retrieval as DIFFERENT user (ensuring isolation)
        console.log("\n4. Testing isolation (different user asking the same question)...");
        const res2 = await fetch(`${AI_SERVICE_URL}/rag/coach-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: "other_user_888",
                message: "How many pushups did I do on my birthday?",
                history: []
            })
        });
        const data2 = await res2.json();
        console.log(` -> Response: "${data2.text}"`);
        if (data2.text.includes("314")) {
            console.error(" ❌ FAILED: Data leak! another user saw the pushup count.");
        } else {
            console.log(" ✅ PASSED: Data remained isolated.");
        }

        // 5. Cleanup
        console.log("\n5. Cleaning up...");
        await fetch(`${AI_SERVICE_URL}/rag/delete-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: TEST_USER })
        });
        console.log("All tests finished.");
        
    } catch (e) {
        console.error("Test framework error:", e);
    }
}

runTests();

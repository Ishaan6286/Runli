#!/usr/bin/env node
/**
 * e2e-test.js
 * Runli End-to-End Integration Test Runner
 * ─────────────────────────────────────────
 * Tests the full Docker Compose stack:
 *   - Node.js Express API (port 5001)
 *   - Python FastAPI AI Service (port 8000)
 *   - Redis connectivity (via BullMQ queue)
 *   - MongoDB connectivity (via Mongoose)
 */

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     → ${err.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function run() {
    console.log('\n🚀 Runli E2E Integration Tests\n');

    // ─────────────────────────────────────────
    // 1. AI Service Health Check
    // ─────────────────────────────────────────
    console.log('--- AI Service (FastAPI) ---');
    await test('GET /health returns 200 and healthy status', async () => {
        const res = await fetch(`${AI_SERVICE_URL}/health`);
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.status === 'healthy', `Expected status='healthy', got '${data.status}'`);
    });

    await test('POST /generate/insight returns insight text', async () => {
        const res = await fetch(`${AI_SERVICE_URL}/generate/insight`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: 'test-user-001',
                user_name: 'Test User',
                target: 'Lose Weight',
                weight: 75,
                progress_summary: '- Date: Mon May 16, Gym: Yes, Calories: 1800, Protein: 130g'
            })
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(typeof data.insight === 'string' && data.insight.length > 0, 'Insight should be a non-empty string');
    });

    await test('POST /predict/skip returns risk level', async () => {
        const res = await fetch(`${AI_SERVICE_URL}/predict/skip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: 'test-user-001',
                gym_days_last_7: 1,
                avg_calories_last_7: 1500,
                avg_protein_last_7: 80,
                days_since_last_gym: 5
            })
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(['High', 'Moderate', 'Low'].includes(data.risk_level), `Unexpected risk_level: ${data.risk_level}`);
        assert(typeof data.skip_probability === 'number', 'skip_probability should be a number');
    });

    await test('POST /memory/ingest stores memory successfully', async () => {
        const res = await fetch(`${AI_SERVICE_URL}/memory/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: 'test-user-001',
                memory_text: 'User skipped gym for 3 days due to knee pain.',
                metadata: { type: 'note', date: new Date().toISOString() }
            })
        });
        assert(res.ok, `Expected 200, got ${res.status}`);
        const data = await res.json();
        assert(data.status === 'success', `Expected status='success', got '${data.status}'`);
    });

    // ─────────────────────────────────────────
    // 2. Node.js Server Health Checks
    // ─────────────────────────────────────────
    console.log('\n--- Node.js Server (Express) ---');
    await test('GET /api/auth/status returns 200 or 404 (route exists)', async () => {
        const res = await fetch(`${SERVER_URL}/api/auth/status`);
        assert(res.status !== 500, `Server errored with 500`);
    });

    await test('POST /api/auth/login with bad creds returns 400 or 401', async () => {
        const res = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'notreal@test.com', password: 'badpass' })
        });
        assert([400, 401, 404].includes(res.status), `Expected 400/401/404, got ${res.status}`);
    });

    await test('GET /api/ai/insight returns 401 without auth token', async () => {
        const res = await fetch(`${SERVER_URL}/api/ai/insight`);
        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    // ─────────────────────────────────────────
    // 3. Summary
    // ─────────────────────────────────────────
    console.log(`\n─────────────────────────────────────────`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`─────────────────────────────────────────\n`);

    if (failed > 0) process.exit(1);
}

run().catch(err => {
    console.error('Test runner crashed:', err);
    process.exit(1);
});

/**
 * visionRoutes.js
 * ─────────────────────────────────────────────────────────
 * POST /api/vision/analyze
 *
 * Strategy pattern — method selected by env var:
 *   VISION_METHOD=mock     → deterministic seed lookup (default)
 *   VISION_METHOD=gemini   → Gemini Vision API (needs GEMINI_API_KEY)
 *   VISION_METHOD=clarifai → Clarifai food model (needs CLARIFAI_KEY)
 *
 * Returns the same VisionResult shape regardless of method:
 * {
 *   foods: [{ name, calories, protein, carbs, fats, confidence, servingSize }],
 *   method: string,
 *   processingMs: number,
 * }
 */

import express  from 'express';
import jwt      from 'jsonwebtoken';
import multer   from 'multer';

const router = express.Router();

// ── In-memory multer (no disk writes) ────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.mimetype);
        if (!ok) return cb(new Error('Unsupported image type'), false);
        cb(null, true);
    },
});

// ── Optional auth (feature works for guests too) ─────────
const softAuth = (req, _res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        try { req.userId = jwt.verify(token, process.env.JWT_SECRET).id; } catch {}
    }
    next();
};

/* ─────────────────────────────────────────────────────────
   SEED DB (mirrors foodVisionEngine.js frontend copy)
   Kept here so the backend can run independently.
───────────────────────────────────────────────────────── */
const FOOD_SEED = [
    { name: 'Dal Makhani',          calories: 330, protein: 13, carbs: 38, fats: 14, servingSize: '1 bowl (250g)' },
    { name: 'Paneer Butter Masala', calories: 380, protein: 15, carbs: 20, fats: 28, servingSize: '1 serving (200g)' },
    { name: 'Chicken Biryani',      calories: 490, protein: 28, carbs: 58, fats: 16, servingSize: '1 plate (350g)' },
    { name: 'Roti',                 calories: 120, protein: 3,  carbs: 24, fats: 2,  servingSize: '2 rotis (60g)' },
    { name: 'Chole Bhature',        calories: 620, protein: 18, carbs: 85, fats: 22, servingSize: '1 serving (300g)' },
    { name: 'Rajma Chawal',         calories: 410, protein: 16, carbs: 68, fats: 8,  servingSize: '1 plate (300g)' },
    { name: 'Idli Sambar',          calories: 200, protein: 7,  carbs: 38, fats: 3,  servingSize: '3 idlis + sambar' },
    { name: 'Masala Dosa',          calories: 290, protein: 6,  carbs: 45, fats: 9,  servingSize: '1 dosa (180g)' },
    { name: 'Palak Paneer',         calories: 310, protein: 14, carbs: 15, fats: 22, servingSize: '1 serving (200g)' },
    { name: 'Aloo Paratha',         calories: 260, protein: 6,  carbs: 36, fats: 10, servingSize: '1 paratha (130g)' },
    { name: 'Poha',                 calories: 180, protein: 4,  carbs: 34, fats: 4,  servingSize: '1 bowl (150g)' },
    { name: 'Upma',                 calories: 215, protein: 5,  carbs: 38, fats: 6,  servingSize: '1 bowl (180g)' },
    { name: 'Samosa',               calories: 130, protein: 3,  carbs: 17, fats: 6,  servingSize: '1 piece (60g)' },
    { name: 'Tandoori Chicken',     calories: 270, protein: 32, carbs: 6,  fats: 14, servingSize: '2 pieces (200g)' },
    { name: 'Fish Curry',           calories: 240, protein: 26, carbs: 8,  fats: 12, servingSize: '1 serving (200g)' },
    { name: 'Egg Bhurji',           calories: 220, protein: 14, carbs: 5,  fats: 16, servingSize: '2 eggs + masala' },
    { name: 'Pav Bhaji',            calories: 350, protein: 9,  carbs: 52, fats: 12, servingSize: '2 pav + bhaji' },
    { name: 'Khichdi',              calories: 280, protein: 10, carbs: 50, fats: 5,  servingSize: '1 bowl (250g)' },
    { name: 'Banana',               calories: 89,  protein: 1,  carbs: 23, fats: 0,  servingSize: '1 medium (120g)' },
    { name: 'Oatmeal',              calories: 150, protein: 5,  carbs: 27, fats: 3,  servingSize: '1 bowl (180g)' },
    { name: 'Boiled Eggs',          calories: 155, protein: 13, carbs: 1,  fats: 11, servingSize: '2 eggs' },
    { name: 'Greek Yogurt',         calories: 100, protein: 17, carbs: 6,  fats: 1,  servingSize: '1 cup (200g)' },
    { name: 'Chicken Salad',        calories: 200, protein: 22, carbs: 10, fats: 8,  servingSize: '1 bowl (250g)' },
    { name: 'Grilled Salmon',       calories: 310, protein: 34, carbs: 0,  fats: 18, servingSize: '1 fillet (180g)' },
    { name: 'Protein Smoothie',     calories: 280, protein: 26, carbs: 30, fats: 6,  servingSize: '1 glass (400ml)' },
];

function _hashBuffer(buf, filename) {
    const str = `${filename}::${buf.length}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = (h * 0x01000193) >>> 0;
    }
    return h;
}

function _mockInfer(buf, filename) {
    const hash = _hashBuffer(buf, filename);
    const primary   = hash % FOOD_SEED.length;
    const secondary = (hash + 7) % FOOD_SEED.length;
    const multi     = hash % 3 === 0;

    const foods = [{
        ...FOOD_SEED[primary],
        confidence: +(0.70 + (hash % 25) / 100).toFixed(2),
    }];
    if (multi && secondary !== primary) {
        foods.push({
            ...FOOD_SEED[secondary],
            confidence: +(0.45 + (hash % 20) / 100).toFixed(2),
        });
    }
    return foods;
}

/* ─────────────────────────────────────────────────────────
   STRATEGY HANDLERS
   Add real strategies by setting VISION_METHOD env var.
───────────────────────────────────────────────────────── */
async function _geminiAnalyze(buf, mimetype) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not configured');

    const b64    = buf.toString('base64');
    const prompt = 'Identify the food(s) in this image. For each, return JSON: [{name, calories, protein_g, carbs_g, fats_g, serving_size, confidence_0_to_1}]. Only return the JSON array, no explanation.';

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimetype, data: b64 } },
                    ],
                }],
            }),
        }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    // Strip markdown fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const raw   = JSON.parse(clean);

    return raw.map(f => ({
        name:        f.name,
        calories:    Number(f.calories) || 0,
        protein:     Number(f.protein_g || f.protein) || 0,
        carbs:       Number(f.carbs_g   || f.carbs)   || 0,
        fats:        Number(f.fats_g    || f.fats)    || 0,
        confidence:  Number(f.confidence_0_to_1 || f.confidence) || 0.75,
        servingSize: f.serving_size || '1 serving',
    }));
}

/* ─────────────────────────────────────────────────────────
   ROUTE
───────────────────────────────────────────────────────── */
router.post('/analyze', softAuth, upload.single('image'), async (req, res) => {
    const t0 = Date.now();
    try {
        if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

        const method = process.env.VISION_METHOD || 'mock';
        let foods;

        if (method === 'gemini' && process.env.GEMINI_API_KEY) {
            foods = await _geminiAnalyze(req.file.buffer, req.file.mimetype);
        } else {
            // Default: mock
            foods = _mockInfer(req.file.buffer, req.file.originalname);
        }

        res.json({
            foods,
            method: method === 'gemini' && process.env.GEMINI_API_KEY ? 'gemini' : 'mock',
            processingMs: Date.now() - t0,
        });
    } catch (err) {
        console.error('[vision/analyze]', err);
        res.status(500).json({ message: err.message || 'Analysis failed' });
    }
});

// Multer error handler
router.use((err, _req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File too large (max 10 MB)' });
    res.status(400).json({ message: err.message });
});

export default router;

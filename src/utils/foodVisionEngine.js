/**
 * foodVisionEngine.js
 * ─────────────────────────────────────────────────────────
 * CV placeholder with a stable, ML-ready public interface.
 *
 * Public API (never changes when swapping to a real model):
 *   analyzeImageFile(file: File)        → Promise<VisionResult>
 *   analyzeImageBase64(b64: string)     → Promise<VisionResult>
 *
 * VisionResult shape:
 * {
 *   foods: [{
 *     name, calories, protein, carbs, fats,
 *     confidence,   // 0–1
 *     servingSize,  // e.g. "1 serving (200g)"
 *   }],
 *   method: 'mock' | 'cnn' | 'clarifai' | 'gemini',
 *   processingMs: number,
 * }
 *
 * SWAP GUIDE (future):
 *   Replace the body of _runMockInference() with a fetch()
 *   to your CNN endpoint or a Vision API call.
 *   Everything above it remains unchanged.
 */

/* ─────────────────────────────────────────────────────────
   SEED FOOD DATABASE
   30 common Indian + global dishes with realistic macros.
   This is the mock "model weights".
───────────────────────────────────────────────────────── */
const FOOD_SEED = [
  { name: 'Dal Makhani',        calories: 330, protein: 13, carbs: 38, fats: 14, servingSize: '1 bowl (250g)' },
  { name: 'Paneer Butter Masala', calories: 380, protein: 15, carbs: 20, fats: 28, servingSize: '1 serving (200g)' },
  { name: 'Chicken Biryani',    calories: 490, protein: 28, carbs: 58, fats: 16, servingSize: '1 plate (350g)' },
  { name: 'Roti',               calories: 120, protein: 3,  carbs: 24, fats: 2,  servingSize: '2 rotis (60g)' },
  { name: 'Chole Bhature',      calories: 620, protein: 18, carbs: 85, fats: 22, servingSize: '1 serving (300g)' },
  { name: 'Rajma Chawal',       calories: 410, protein: 16, carbs: 68, fats: 8,  servingSize: '1 plate (300g)' },
  { name: 'Idli Sambar',        calories: 200, protein: 7,  carbs: 38, fats: 3,  servingSize: '3 idlis + sambar' },
  { name: 'Masala Dosa',        calories: 290, protein: 6,  carbs: 45, fats: 9,  servingSize: '1 dosa (180g)' },
  { name: 'Palak Paneer',       calories: 310, protein: 14, carbs: 15, fats: 22, servingSize: '1 serving (200g)' },
  { name: 'Aloo Paratha',       calories: 260, protein: 6,  carbs: 36, fats: 10, servingSize: '1 paratha (130g)' },
  { name: 'Poha',               calories: 180, protein: 4,  carbs: 34, fats: 4,  servingSize: '1 bowl (150g)' },
  { name: 'Upma',               calories: 215, protein: 5,  carbs: 38, fats: 6,  servingSize: '1 bowl (180g)' },
  { name: 'Samosa',             calories: 130, protein: 3,  carbs: 17, fats: 6,  servingSize: '1 piece (60g)' },
  { name: 'Pakora',             calories: 180, protein: 5,  carbs: 20, fats: 9,  servingSize: '4 pieces (80g)' },
  { name: 'Tandoori Chicken',   calories: 270, protein: 32, carbs: 6,  fats: 14, servingSize: '2 pieces (200g)' },
  { name: 'Fish Curry',         calories: 240, protein: 26, carbs: 8,  fats: 12, servingSize: '1 serving (200g)' },
  { name: 'Egg Bhurji',         calories: 220, protein: 14, carbs: 5,  fats: 16, servingSize: '2 eggs + masala' },
  { name: 'Pav Bhaji',          calories: 350, protein: 9,  carbs: 52, fats: 12, servingSize: '2 pav + bhaji' },
  { name: 'Khichdi',            calories: 280, protein: 10, carbs: 50, fats: 5,  servingSize: '1 bowl (250g)' },
  { name: 'Lassi',              calories: 180, protein: 7,  carbs: 28, fats: 5,  servingSize: '1 glass (300ml)' },
  { name: 'Banana',             calories: 89,  protein: 1,  carbs: 23, fats: 0,  servingSize: '1 medium (120g)' },
  { name: 'Apple',              calories: 72,  protein: 0,  carbs: 19, fats: 0,  servingSize: '1 medium (150g)' },
  { name: 'Oatmeal',            calories: 150, protein: 5,  carbs: 27, fats: 3,  servingSize: '1 bowl (180g)' },
  { name: 'Boiled Eggs',        calories: 155, protein: 13, carbs: 1,  fats: 11, servingSize: '2 eggs' },
  { name: 'Greek Yogurt',       calories: 100, protein: 17, carbs: 6,  fats: 1,  servingSize: '1 cup (200g)' },
  { name: 'Chicken Salad',      calories: 200, protein: 22, carbs: 10, fats: 8,  servingSize: '1 bowl (250g)' },
  { name: 'Pasta Arrabbiata',   calories: 380, protein: 12, carbs: 62, fats: 9,  servingSize: '1 plate (300g)' },
  { name: 'Grilled Salmon',     calories: 310, protein: 34, carbs: 0,  fats: 18, servingSize: '1 fillet (180g)' },
  { name: 'Mixed Rice Bowl',    calories: 420, protein: 16, carbs: 65, fats: 10, servingSize: '1 bowl (350g)' },
  { name: 'Protein Smoothie',   calories: 280, protein: 26, carbs: 30, fats: 6,  servingSize: '1 glass (400ml)' },
];

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

/** Deterministic hash of (filename + size) → integer */
function _hashFile(file) {
  const str = `${file.name}::${file.size}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

/** Convert File to base64 string */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result.split(',')[1];
      resolve(b64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─────────────────────────────────────────────────────────
   MOCK INFERENCE ENGINE
   Simulates a CNN food detector. Consistently returns 1-2
   food items based on image hash so UI is predictable.
───────────────────────────────────────────────────────── */
function _runMockInference(hash, fileName = "") {
  // Demo intelligence: guess food based on file name if possible
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('cucumber')) {
    return [{ name: 'Cucumber Slices', calories: 16, protein: 0.6, carbs: 3.6, fats: 0.1, servingSize: '1 cup (104g)', confidence: 0.94 }];
  }
  if (lowerName.includes('pizza')) {
    return [{ name: 'Margherita Pizza', calories: 260, protein: 11, carbs: 33, fats: 10, servingSize: '1 slice (95g)', confidence: 0.88 }];
  }
  if (lowerName.includes('salad')) {
    return [{ name: 'Garden Salad', calories: 120, protein: 3, carbs: 12, fats: 7, servingSize: '1 bowl', confidence: 0.91 }];
  }
  if (lowerName.includes('burger')) {
    return [{ name: 'Cheeseburger', calories: 350, protein: 16, carbs: 32, fats: 18, servingSize: '1 burger', confidence: 0.95 }];
  }

  const exactMatch = FOOD_SEED.find(f => lowerName.includes(f.name.toLowerCase()));
  if (exactMatch) {
    return [{ ...exactMatch, confidence: 0.89 + (hash % 10) / 100 }];
  }

  const primary   = hash % FOOD_SEED.length;
  const secondary = (hash + 7) % FOOD_SEED.length;
  const multiDetect = hash % 3 === 0; // ~33% chance of 2 detections

  const primaryFood = {
    ...FOOD_SEED[primary],
    confidence: 0.70 + (hash % 25) / 100,  // 0.70–0.94
  };

  const results = [primaryFood];

  if (multiDetect && secondary !== primary) {
    results.push({
      ...FOOD_SEED[secondary],
      confidence: 0.45 + (hash % 20) / 100, // 0.45–0.64
    });
  }

  return results;
}

/* ─────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────── */

/**
 * Analyze a File object.
 * Validates type and size before running inference.
 */
export async function analyzeImageFile(file) {
  const t0 = Date.now();

  // ── Validation ──────────────────────────────────────
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
  if (!ALLOWED.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, or WebP image.`);
  }
  const MAX_MB = 10;
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`File too large (${(file.size / 1e6).toFixed(1)} MB). Maximum is ${MAX_MB} MB.`);
  }

  // ── Simulate async model inference ──────────────────
  // In production: replace this block with a real fetch() to your CNN/API.
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600)); // 0.9–1.5s

  const hash  = _hashFile(file);
  const foods = _runMockInference(hash, file.name);

  return {
    foods,
    method: 'mock',
    processingMs: Date.now() - t0,
  };
}

/**
 * Analyze a base64-encoded image string.
 * Useful when the frontend sends a data URL via fetch.
 * In production: forward b64 to your Vision API.
 */
export async function analyzeImageBase64(b64, fileName = 'image.jpg') {
  // Reconstruct a synthetic "file-like" for hashing
  const syntheticFile = {
    name: fileName,
    size: Math.round(b64.length * 0.75), // approximate bytes
  };

  await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

  const hash  = _hashFile(syntheticFile);
  const foods = _runMockInference(hash, fileName);

  return {
    foods,
    method: 'mock',
    processingMs: 800,
  };
}

/**
 * Validate an image file without running inference.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateImageFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
  if (!ALLOWED.includes(file.type)) {
    return { valid: false, error: 'Please upload a JPEG, PNG, or WebP image.' };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: `File is ${(file.size / 1e6).toFixed(1)} MB — max is 10 MB.` };
  }
  return { valid: true };
}

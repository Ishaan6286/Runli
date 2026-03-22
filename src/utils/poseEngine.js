/**
 * poseEngine.js
 * ─────────────────────────────────────────────────────────
 * Mock pose generator with a stable, ML-ready public interface.
 *
 * Public API (never changes when swapping to MediaPipe/MoveNet):
 *   createPoseDetector(exerciseName) → PoseDetector
 *   detector.getFrame(timestamp?)   → PoseFrame
 *   detector.destroy()
 *
 * PoseFrame shape:
 * {
 *   keypoints: [{ name, x, y, score }],   // x/y in 0–1 (normalised)
 *   timestamp: number,
 *   method: 'mock' | 'mediapipe' | 'movenet',
 * }
 *
 * SWAP GUIDE (future):
 *   Replace createMockDetector() body with MediaPipe / TF.js setup.
 *   The PoseCamera component calls only getFrame() — never changes.
 */

/* ─────────────────────────────────────────────────────────
   BODY LANDMARKS (MediaPipe standard 33-point model)
   We only animate the subset needed for form analysis.
───────────────────────────────────────────────────────── */
export const LANDMARKS = {
  NOSE:           0,
  LEFT_SHOULDER:  11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW:     13,
  RIGHT_ELBOW:    14,
  LEFT_WRIST:     15,
  RIGHT_WRIST:    16,
  LEFT_HIP:       23,
  RIGHT_HIP:      24,
  LEFT_KNEE:      25,
  RIGHT_KNEE:     26,
  LEFT_ANKLE:     27,
  RIGHT_ANKLE:    28,
};

// Skeleton connections to draw lines between
export const SKELETON_CONNECTIONS = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso sides
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

/* ─────────────────────────────────────────────────────────
   EXERCISE POSE SIMULATIONS
   Each returns a full 29-slot keypoint array (indices 0–28).
   Uses sine/cosine animation to simulate a rep cycle.
───────────────────────────────────────────────────────── */

function _baseBody(phase) {
  // Standing neutral skeleton, normalised 0–1 coords (portrait view)
  return {
    0:  { x: 0.50, y: 0.08 }, // nose
    11: { x: 0.40, y: 0.28 }, // L shoulder
    12: { x: 0.60, y: 0.28 }, // R shoulder
    13: { x: 0.35, y: 0.43 }, // L elbow
    14: { x: 0.65, y: 0.43 }, // R elbow
    15: { x: 0.32, y: 0.57 }, // L wrist
    16: { x: 0.68, y: 0.57 }, // R wrist
    23: { x: 0.43, y: 0.53 }, // L hip
    24: { x: 0.57, y: 0.53 }, // R hip
    25: { x: 0.43, y: 0.70 }, // L knee
    26: { x: 0.57, y: 0.70 }, // R knee
    27: { x: 0.43, y: 0.88 }, // L ankle
    28: { x: 0.57, y: 0.88 }, // R ankle
  };
}

const EXERCISE_SIMS = {
  squat(t) {
    const depth = Math.max(0, Math.sin(t * 0.7)); // 0–1
    const hipDrop = depth * 0.12;
    const kneeBend = depth * 0.14;
    const b = _baseBody(t);
    return {
      ...b,
      23: { x: 0.43, y: 0.53 + hipDrop },
      24: { x: 0.57, y: 0.53 + hipDrop },
      25: { x: 0.40, y: 0.70 + kneeBend },
      26: { x: 0.60, y: 0.70 + kneeBend },
    };
  },

  bicep_curl(t) {
    const curl = Math.max(0, Math.sin(t * 0.9));
    const elbowY = 0.43 - curl * 0.08;
    const wristY = 0.57 - curl * 0.22;
    const b = _baseBody(t);
    return {
      ...b,
      13: { x: 0.34, y: elbowY },
      15: { x: 0.36, y: wristY },
      14: { x: 0.66, y: elbowY },
      16: { x: 0.64, y: wristY },
    };
  },

  push_up(t) {
    const down = Math.max(0, Math.sin(t * 0.8));
    const elbowBend = down * 0.12;
    const b = _baseBody(t);
    // Horizontal push-up stance
    return {
      ...b,
      0:  { x: 0.50, y: 0.18 + elbowBend },
      11: { x: 0.35, y: 0.35 + elbowBend },
      12: { x: 0.65, y: 0.35 + elbowBend },
      13: { x: 0.28, y: 0.48 },
      14: { x: 0.72, y: 0.48 },
      15: { x: 0.22, y: 0.55 },
      16: { x: 0.78, y: 0.55 },
      23: { x: 0.43, y: 0.56 },
      24: { x: 0.57, y: 0.56 },
      25: { x: 0.43, y: 0.72 },
      26: { x: 0.57, y: 0.72 },
    };
  },

  shoulder_press(t) {
    const press = Math.max(0, Math.sin(t * 0.75));
    const wristY = 0.20 - press * 0.13;
    const elbowY = 0.33 - press * 0.06;
    const b = _baseBody(t);
    return {
      ...b,
      13: { x: 0.32, y: elbowY },
      14: { x: 0.68, y: elbowY },
      15: { x: 0.38, y: wristY },
      16: { x: 0.62, y: wristY },
    };
  },

  deadlift(t) {
    const hinge = Math.max(0, Math.sin(t * 0.65));
    const hipY = 0.53 + hinge * 0.16;
    const shoulderY = 0.28 + hinge * 0.18;
    const b = _baseBody(t);
    return {
      ...b,
      0:  { x: 0.50, y: 0.08 + hinge * 0.18 },
      11: { x: 0.40, y: shoulderY },
      12: { x: 0.60, y: shoulderY },
      13: { x: 0.36, y: shoulderY + 0.13 },
      14: { x: 0.64, y: shoulderY + 0.13 },
      15: { x: 0.43, y: hipY + 0.04 },
      16: { x: 0.57, y: hipY + 0.04 },
      23: { x: 0.43, y: hipY },
      24: { x: 0.57, y: hipY },
    };
  },
};

function _getSimFn(exerciseName) {
  const n = (exerciseName || '').toLowerCase();
  if (n.includes('squat'))   return EXERCISE_SIMS.squat;
  if (n.includes('curl'))    return EXERCISE_SIMS.bicep_curl;
  if (n.includes('push'))    return EXERCISE_SIMS.push_up;
  if (n.includes('press'))   return EXERCISE_SIMS.shoulder_press;
  if (n.includes('deadlift'))return EXERCISE_SIMS.deadlift;
  return EXERCISE_SIMS.squat; // default
}

/* ─────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────── */

/**
 * Create a pose detector for the given exercise.
 * Returns an object with:
 *   getFrame() → PoseFrame
 *   destroy()  → void
 */
export function createPoseDetector(exerciseName = 'squat') {
  const simFn = _getSimFn(exerciseName);
  let destroyed = false;

  return {
    getFrame() {
      if (destroyed) return null;
      const t = Date.now() / 1000;
      const raw = simFn(t);

      // Convert to array format matching MediaPipe output
      const keypoints = Object.entries(raw).map(([idx, { x, y }]) => ({
        name: Object.keys(LANDMARKS).find(k => LANDMARKS[k] === Number(idx)) || `kp_${idx}`,
        index: Number(idx),
        x,
        y,
        score: 0.85 + Math.sin(t + Number(idx)) * 0.1, // realistic confidence jitter
      }));

      return {
        keypoints,
        timestamp: Date.now(),
        method: 'mock',
      };
    },

    destroy() {
      destroyed = true;
    },
  };
}

/** Compute angle (degrees) between three 2D points at the middle vertex */
export function computeAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs(radians * (180 / Math.PI));
  if (deg > 180) deg = 360 - deg;
  return deg;
}

/** Find a keypoint by name or index in a PoseFrame.keypoints array */
export function getKP(keypoints, nameOrIndex) {
  if (typeof nameOrIndex === 'number') {
    return keypoints.find(k => k.index === nameOrIndex) || null;
  }
  return keypoints.find(k => k.name === nameOrIndex) || null;
}

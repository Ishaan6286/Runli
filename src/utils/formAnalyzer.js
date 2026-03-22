/**
 * formAnalyzer.js
 * ─────────────────────────────────────────────────────────
 * Stateful exercise form checker + rep counter.
 *
 * Usage:
 *   const analyzer = createFormAnalyzer('squat');
 *   const feedback  = analyzer.analyze(poseFrame);
 *   // feedback: FormFeedback
 *   analyzer.reset();
 *
 * FormFeedback shape:
 * {
 *   reps: number,
 *   phase: 'up' | 'down' | 'hold',
 *   issues: [{ joint, message, severity: 'good'|'warn'|'error' }],
 *   overallScore: number,   // 0–100
 * }
 */

import { computeAngle, getKP, LANDMARKS as L } from './poseEngine.js';

/* ─────────────────────────────────────────────────────────
   EXERCISE RULE SETS
   Each rule set is a function: (keypoints) → issues[]
   and a phase detector: (keypoints, prevPhase) → phase
───────────────────────────────────────────────────────── */

const RULES = {
  squat: {
    detectPhase(kps, prev) {
      const lk = getKP(kps, L.LEFT_KNEE);
      const lh = getKP(kps, L.LEFT_HIP);
      const la = getKP(kps, L.LEFT_ANKLE);
      if (!lk || !lh || !la) return prev;
      const angle = computeAngle(lh, lk, la);
      if (angle < 120) return 'down';
      if (angle > 155) return 'up';
      return prev;
    },
    analyze(kps) {
      const issues = [];
      const lh = getKP(kps, L.LEFT_HIP);
      const lk = getKP(kps, L.LEFT_KNEE);
      const la = getKP(kps, L.LEFT_ANKLE);
      const ls = getKP(kps, L.LEFT_SHOULDER);

      if (lh && lk && la) {
        const kneeAngle = computeAngle(lh, lk, la);
        if (kneeAngle < 95) {
          issues.push({ joint: 'left_knee', message: 'Full depth — great!', severity: 'good' });
        } else if (kneeAngle < 130) {
          issues.push({ joint: 'left_knee', message: 'Go a bit deeper', severity: 'warn' });
        } else {
          issues.push({ joint: 'left_knee', message: 'Not reaching depth', severity: 'error' });
        }

        // Knee valgus approximation
        if (lk.x < lh.x - 0.04) {
          issues.push({ joint: 'left_knee', message: 'Knee caving inward', severity: 'warn' });
        }
      }

      if (ls && lh) {
        const lean = Math.abs(ls.x - lh.x);
        if (lean < 0.05) {
          issues.push({ joint: 'back', message: 'Torso upright', severity: 'good' });
        } else {
          issues.push({ joint: 'back', message: 'Reduce forward lean', severity: 'warn' });
        }
      }

      return issues;
    },
  },

  bicep_curl: {
    detectPhase(kps, prev) {
      const le = getKP(kps, L.LEFT_ELBOW);
      const ls = getKP(kps, L.LEFT_SHOULDER);
      const lw = getKP(kps, L.LEFT_WRIST);
      if (!le || !ls || !lw) return prev;
      const angle = computeAngle(ls, le, lw);
      if (angle < 70)  return 'up';
      if (angle > 145) return 'down';
      return prev;
    },
    analyze(kps) {
      const issues = [];
      const le = getKP(kps, L.LEFT_ELBOW);
      const ls = getKP(kps, L.LEFT_SHOULDER);
      const lw = getKP(kps, L.LEFT_WRIST);

      if (le && ls && lw) {
        const angle = computeAngle(ls, le, lw);
        if (angle < 40) {
          issues.push({ joint: 'left_elbow', message: 'Full contraction!', severity: 'good' });
        } else if (angle < 75) {
          issues.push({ joint: 'left_elbow', message: 'Curl higher', severity: 'warn' });
        }

        // Elbow drift
        const drift = Math.abs(le.x - ls.x);
        if (drift > 0.12) {
          issues.push({ joint: 'left_elbow', message: 'Elbow drifting forward', severity: 'warn' });
        } else {
          issues.push({ joint: 'left_elbow', message: 'Elbows pinned — good', severity: 'good' });
        }
      }
      return issues;
    },
  },

  push_up: {
    detectPhase(kps, prev) {
      const le = getKP(kps, L.LEFT_ELBOW);
      const ls = getKP(kps, L.LEFT_SHOULDER);
      const lw = getKP(kps, L.LEFT_WRIST);
      if (!le || !ls || !lw) return prev;
      const angle = computeAngle(ls, le, lw);
      if (angle < 90)  return 'down';
      if (angle > 155) return 'up';
      return prev;
    },
    analyze(kps) {
      const issues = [];
      const ls = getKP(kps, L.LEFT_SHOULDER);
      const lh = getKP(kps, L.LEFT_HIP);
      const lk = getKP(kps, L.LEFT_KNEE);
      const le = getKP(kps, L.LEFT_ELBOW);
      const lw = getKP(kps, L.LEFT_WRIST);

      if (ls && lh && lk) {
        // Body alignment — shoulders, hips, knees should be on a line
        const alignDiff = Math.abs((lh.y - ls.y) - (lk.y - lh.y));
        if (alignDiff < 0.04) {
          issues.push({ joint: 'back', message: 'Body straight', severity: 'good' });
        } else if (lh.y > ls.y + 0.08) {
          issues.push({ joint: 'back', message: 'Hips dropping', severity: 'error' });
        } else {
          issues.push({ joint: 'back', message: 'Hips too high', severity: 'warn' });
        }
      }
      if (le && ls && lw) {
        const angle = computeAngle(ls, le, lw);
        if (angle < 95) {
          issues.push({ joint: 'left_elbow', message: 'Full range at bottom', severity: 'good' });
        } else {
          issues.push({ joint: 'left_elbow', message: 'Lower chest to floor', severity: 'warn' });
        }
      }
      return issues;
    },
  },

  shoulder_press: {
    detectPhase(kps, prev) {
      const lw = getKP(kps, L.LEFT_WRIST);
      const ls = getKP(kps, L.LEFT_SHOULDER);
      if (!lw || !ls) return prev;
      if (lw.y < ls.y - 0.12) return 'up';
      if (lw.y > ls.y - 0.02) return 'down';
      return prev;
    },
    analyze(kps) {
      const issues = [];
      const le = getKP(kps, L.LEFT_ELBOW);
      const lw = getKP(kps, L.LEFT_WRIST);
      const ls = getKP(kps, L.LEFT_SHOULDER);
      const lh = getKP(kps, L.LEFT_HIP);

      if (le && lw) {
        if (lw.y < le.y) {
          issues.push({ joint: 'left_wrist', message: 'Wrists above elbows', severity: 'good' });
        } else {
          issues.push({ joint: 'left_wrist', message: 'Drive wrists up higher', severity: 'warn' });
        }
      }
      if (ls && lh) {
        const lean = Math.abs(ls.x - lh.x);
        if (lean < 0.04) {
          issues.push({ joint: 'back', message: 'No forward lean', severity: 'good' });
        } else {
          issues.push({ joint: 'back', message: 'Avoid arching back', severity: 'warn' });
        }
      }
      return issues;
    },
  },

  deadlift: {
    detectPhase(kps, prev) {
      const lh = getKP(kps, L.LEFT_HIP);
      const la = getKP(kps, L.LEFT_ANKLE);
      if (!lh || !la) return prev;
      const ratio = lh.y / (la.y || 1);
      if (ratio > 0.75) return 'down';
      if (ratio < 0.65) return 'up';
      return prev;
    },
    analyze(kps) {
      const issues = [];
      const ls = getKP(kps, L.LEFT_SHOULDER);
      const lh = getKP(kps, L.LEFT_HIP);
      const lk = getKP(kps, L.LEFT_KNEE);

      if (ls && lh) {
        const backAngle = Math.abs(ls.y - lh.y);
        if (backAngle > 0.18) {
          issues.push({ joint: 'back', message: 'Back neutral', severity: 'good' });
        } else {
          issues.push({ joint: 'back', message: 'Avoid rounding back', severity: 'error' });
        }
      }
      if (lh && lk) {
        if (lh.y < lk.y - 0.02) {
          issues.push({ joint: 'left_hip', message: 'Hip hinge correct', severity: 'good' });
        } else {
          issues.push({ joint: 'left_hip', message: 'Initiate with hips first', severity: 'warn' });
        }
      }
      return issues;
    },
  },
};

function _getRuleSet(exerciseName) {
  const n = (exerciseName || '').toLowerCase();
  if (n.includes('squat'))    return RULES.squat;
  if (n.includes('curl'))     return RULES.bicep_curl;
  if (n.includes('push'))     return RULES.push_up;
  if (n.includes('press'))    return RULES.shoulder_press;
  if (n.includes('deadlift')) return RULES.deadlift;
  return RULES.squat;
}

/* ─────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────── */

export function createFormAnalyzer(exerciseName = 'squat') {
  const ruleSet = _getRuleSet(exerciseName);
  let reps = 0;
  let phase = 'up';
  let prevPhase = 'up';

  return {
    analyze(poseFrame) {
      if (!poseFrame) return null;
      const { keypoints } = poseFrame;

      // Phase detection + rep counting
      phase = ruleSet.detectPhase(keypoints, phase);
      if (phase !== prevPhase) {
        if (phase === 'up' && prevPhase === 'down') reps += 1;
        prevPhase = phase;
      }

      // Form issues
      const issues = ruleSet.analyze(keypoints);

      // Score: start at 100, deduct for warns and errors
      const warnCount  = issues.filter(i => i.severity === 'warn').length;
      const errorCount = issues.filter(i => i.severity === 'error').length;
      const overallScore = Math.max(0, 100 - warnCount * 10 - errorCount * 20);

      return { reps, phase, issues, overallScore };
    },

    reset() {
      reps = 0;
      phase = 'up';
      prevPhase = 'up';
    },

    getReps() {
      return reps;
    },
  };
}

import React, { useState } from "react";

function getYouTubeId(url) {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    // Handle youtu.be short links
    if (urlObj.hostname === "youtu.be") return urlObj.pathname.substring(1);
    // Handle YouTube Shorts
    if (urlObj.pathname.includes("/shorts/")) {
      return urlObj.pathname.split("/shorts/")[1].split("?")[0];
    }
    // Handle regular YouTube URLs
    if (urlObj.hostname.includes("youtube")) return urlObj.searchParams.get("v");
    return url;
  } catch {
    return url;
  }
}

const exercises = {
  chest: [
    "Bench Press (Flat)", "Bench Press (Incline)", "Bench Press (Decline)",
    "Dumbbell Press (Flat)", "Dumbbell Press (Incline)", "Dumbbell Press (Decline)",
    "Push-ups", "Cable Crossover", "Dips (Chest variation)",
    "Dumbbell Fly", "Pec Deck Machine"
  ],
  back: [
    "Bent-Over Barbell Row", "Dumbbell Row", "Seated Cable Row",
    "Lat Pulldown (Wide Grip)", "Lat Pulldown (Close Grip)", "Lat Pulldown (Reverse Grip)",
    "Pull-up / Chin-up", "T-Bar Row", "Deadlift", "Back Extension / Hyperextension"
  ],
  shoulders: [
    "Overhead Press (Military Press)", "Seated Dumbbell Press", "Dumbbell Lateral Raise",
    "Front Raise", "Rear Delt Reverse Fly (Dumbbell or Pec Deck)",
    "Face Pull", "Shrugs (Barbell or Dumbbell)"
  ],
  biceps: [
    "Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Concentration Curl", "Cable Curl"
  ],
  triceps: [
    "Triceps Pushdown", "Overhead Triceps Extension", "Skull Crusher", "Close-Grip Bench Press", "Triceps Kickback"
  ],
  forearms: [
    "Wrist Curl", "Reverse Wrist Curl", "Farmer's Carry"
  ],
  quadsGlutes: [
    "Barbell Back Squat", "Barbell Front Squat", "Goblet Squat", "Leg Press",
    "Leg Extension", "Walking Lunge", "Reverse Lunge", "Bulgarian Split Squat", "Barbell Hip Thrust"
  ],
  hamstringsGlutes: [
    "Romanian Deadlift (RDL)", "Stiff-Legged Deadlift", "Lying Leg Curl",
    "Seated Leg Curl", "Glute-Ham Raise", "Cable Pull-Through"
  ],
  calves: [
    "Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise"
  ],
  core: [
    "Crunch", "Cable Crunch", "Hanging Leg Raise", "Reverse Crunch", "Russian Twist", "Plank", "Side Plank", "Ab Wheel Rollout", "Pallof Press", "Dead Bug"
  ]
};

// YouTube video IDs for proper form demonstrations
const exerciseVideos = {
  // Chest
  "Bench Press (Flat)": "SCVCLChPQFY",
  "Bench Press (Incline)": "8iPEnn-ltC8",
  "Bench Press (Decline)": "2yfVhKuoHhE",
  "Dumbbell Press (Flat)": "6mT4XFUyCUg",
  "Dumbbell Press (Incline)": "8iPEnn-ltC8",
  "Dumbbell Press (Decline)": "JXrGRvDvhxs",
  "Push-ups": "IODxDxX7oi4",
  "Cable Crossover": "taI4XduLpTk",
  "Dips (Chest variation)": "2z8JmcrW-As",
  "Dumbbell Fly": "eozdVDA78K0",
  "Pec Deck Machine": "MCrvAtyF5PQ",

  // Back
  "Bent-Over Barbell Row": "BeyV5GJzUv8",
  "Dumbbell Row": "GDlccQhUMLw",
  "Seated Cable Row": "co0qaT6AZyY",
  "Lat Pulldown (Wide Grip)": "CAwf7n6Luuc",
  "Lat Pulldown (Close Grip)": "jZpV5u47eNc",
  "Lat Pulldown (Reverse Grip)": "RwnUzg_aDMw",
  "Pull-up / Chin-up": "eGo4IYlbE5g",
  "T-Bar Row": "nCGURjGYekg",
  "Deadlift": "ytGaGIn3SjE",
  "Back Extension / Hyperextension": "Ejrb0BJ5hGg",

  // Shoulders
  "Overhead Press (Military Press)": "2yjwXTZQDDI",
  "Seated Dumbbell Press": "qEwKCR5JCog",
  "Dumbbell Lateral Raise": "3VcKaXpzqRo",
  "Front Raise": "HgzfKz2QKBI",
  "Rear Delt Reverse Fly (Dumbbell or Pec Deck)": "k6tzKisR3NY",
  "Face Pull": "rep-qVOkqgk",
  "Shrugs (Barbell or Dumbbell)": "XjX8m2A8cOA",

  // Biceps
  "Barbell Curl": "kwG2ipFRgfo",
  "Dumbbell Curl": "sAq_ocpRh_I",
  "Hammer Curl": "zC3nLlEvin4",
  "Preacher Curl": "fIWP-FRFNU0",
  "Concentration Curl": "Jvj2wV0vOdY",
  "Cable Curl": "NFzTWp2qpiE",

  // Triceps
  "Triceps Pushdown": "2-LAMcpzODU",
  "Overhead Triceps Extension": "YbX7Wd8jQ-Q",
  "Skull Crusher": "d_KZxkY_0cM",
  "Close-Grip Bench Press": "nEF0bv2FW94",
  "Triceps Kickback": "6SS6K3lAwZ8",

  // Forearms
  "Wrist Curl": "16rMNMqw0GY",
  "Reverse Wrist Curl": "IlW6yJmJSJc",
  "Farmer's Carry": "rt17lmnaLSM",

  // Quads & Glutes
  "Barbell Back Squat": "ultWZbUMPL8",
  "Barbell Front Squat": "uYumuL_G_V0",
  "Goblet Squat": "MeIiIdhvXT4",
  "Leg Press": "IZxyjW7MPJQ",
  "Leg Extension": "YyvSfVjQeL0",
  "Walking Lunge": "L8fvypPrzzs",
  "Reverse Lunge": "xXvOoKQRcts",
  "Bulgarian Split Squat": "2C-uNgKwPLE",
  "Barbell Hip Thrust": "xDmFkJxPzeM",

  // Hamstrings & Glutes
  "Romanian Deadlift (RDL)": "JCXUYuzwNrM",
  "Stiff-Legged Deadlift": "1uDiW5--rAE",
  "Lying Leg Curl": "1Tq3QdYUuHs",
  "Seated Leg Curl": "ELOCsoDSmrg",
  "Glute-Ham Raise": "kJJKRLwJNNQ",
  "Cable Pull-Through": "5ZJmWeRxNPg",

  // Calves
  "Standing Calf Raise": "gwLzBJYoWlI",
  "Seated Calf Raise": "JbyjNymZS7Q",
  "Leg Press Calf Raise": "sK6RHs4OQwQ",

  // Core
  "Crunch": "Xyd_fa5zoEU",
  "Cable Crunch": "sKvG8fHruyI",
  "Hanging Leg Raise": "Pr1ieGZ5atk",
  "Reverse Crunch": "xFe0q4P_2c8",
  "Russian Twist": "wkD8rjkodUI",
  "Plank": "pSHjTRCQxIw",
  "Side Plank": "K2VljzCC16g",
  "Ab Wheel Rollout": "EaRlQYPTf6w",
  "Pallof Press": "AH_QZLm_0-s",
  "Dead Bug": "g_BYB0R-4Ws"
};

// Common mistake videos for each exercise
const mistakeVideos = {
  // Chest
  "Bench Press (Flat)": "BYKScL2sgCs",
  "Bench Press (Incline)": "DbFgADa2IqA",
  "Bench Press (Decline)": "https://youtu.be/LfyQBUKR8SE?si=rSQZD5q78rEyH0fN",
  "Dumbbell Press (Flat)": "VmB1G1K7v94",
  "Dumbbell Press (Incline)": "8iPEnn-ltC8",
  "Dumbbell Press (Decline)": "https://youtube.com/shorts/1OdTFeN90W4?si=Q1QeB7htGoSw2iUU",
  "Push-ups": "IODxDxX7oi4",
  "Cable Crossover": "taI4XduLpTk",
  "Dips (Chest variation)": "2z8JmcrW-As",
  "Dumbbell Fly": "eozdVDA78K0",
  "Pec Deck Machine": "MCrvAtyF5PQ",

  // Back
  "Bent-Over Barbell Row": "T3N-TO4reLQ",
  "Dumbbell Row": "roCP6wCXPqo",
  "Seated Cable Row": "xQNrFHEMhI4",
  "Lat Pulldown (Wide Grip)": "CAwf7n6Luuc",
  "Lat Pulldown (Close Grip)": "jZpV5u47eNc",
  "Lat Pulldown (Reverse Grip)": "RwnUzg_aDMw",
  "Pull-up / Chin-up": "eGo4IYlbE5g",
  "T-Bar Row": "nCGURjGYekg",
  "Deadlift": "1nRRlk6264I",
  "Back Extension / Hyperextension": "Ejrb0BJ5hGg",

  // Shoulders
  "Overhead Press (Military Press)": "F3QY5vMz_6I",
  "Seated Dumbbell Press": "qEwKCR5JCog",
  "Dumbbell Lateral Raise": "3VcKaXpzqRo",
  "Front Raise": "HgzfKz2QKBI",
  "Rear Delt Reverse Fly (Dumbbell or Pec Deck)": "k6tzKisR3NY",
  "Face Pull": "rep-qVOkqgk",
  "Shrugs (Barbell or Dumbbell)": "XjX8m2A8cOA",

  // Biceps
  "Barbell Curl": "kwG2ipFRgfo",
  "Dumbbell Curl": "sAq_ocpRh_I",
  "Hammer Curl": "zC3nLlEvin4",
  "Preacher Curl": "fIWP-FRFNU0",
  "Concentration Curl": "Jvj2wV0vOdY",
  "Cable Curl": "NFzTWp2qpiE",

  // Triceps
  "Triceps Pushdown": "2-LAMcpzODU",
  "Overhead Triceps Extension": "YbX7Wd8jQ-Q",
  "Skull Crusher": "d_KZxkY_0cM",
  "Close-Grip Bench Press": "nEF0bv2FW94",
  "Triceps Kickback": "6SS6K3lAwZ8",

  // Forearms
  "Wrist Curl": "16rMNMqw0GY",
  "Reverse Wrist Curl": "IlW6yJmJSJc",
  "Farmer's Carry": "rt17lmnaLSM",

  // Quads & Glutes
  "Barbell Back Squat": "QKKZ9AGYTi4",
  "Barbell Front Squat": "uYumuL_G_V0",
  "Goblet Squat": "MeIiIdhvXT4",
  "Leg Press": "IZxyjW7MPJQ",
  "Leg Extension": "YyvSfVjQeL0",
  "Walking Lunge": "L8fvypPrzzs",
  "Reverse Lunge": "xXvOoKQRcts",
  "Bulgarian Split Squat": "2C-uNgKwPLE",
  "Barbell Hip Thrust": "xDmFkJxPzeM",

  // Hamstrings & Glutes
  "Romanian Deadlift (RDL)": "JCXUYuzwNrM",
  "Stiff-Legged Deadlift": "1uDiW5--rAE",
  "Lying Leg Curl": "1Tq3QdYUuHs",
  "Seated Leg Curl": "ELOCsoDSmrg",
  "Glute-Ham Raise": "kJJKRLwJNNQ",
  "Cable Pull-Through": "5ZJmWeRxNPg",

  // Calves
  "Standing Calf Raise": "gwLzBJYoWlI",
  "Seated Calf Raise": "https://youtube.com/shorts/pHm6LFuGGbs?si=lAvcm-MS-KCzLdXj",
  "Leg Press Calf Raise": "https://youtube.com/shorts/Z1i96JHZCuE?si=L__ZBqTc10kO0en8",

  // Core
  "Crunch": "Xyd_fa5zoEU",
  "Cable Crunch": "sKvG8fHruyI",
  "Hanging Leg Raise": "Pr1ieGZ5atk",
  "Reverse Crunch": "xFe0q4P_2c8",
  "Russian Twist": "wkD8rjkodUI",
  "Plank": "pSHjTRCQxIw",
  "Side Plank": "K2VljzCC16g",
  "Ab Wheel Rollout": "EaRlQYPTf6w",
  "Pallof Press": "AH_QZLm_0-s",
  "Dead Bug": "g_BYB0R-4Ws"
};

// Full fitness videos with verified YouTube IDs from popular fitness channels
const fitnessVideos = {
  "Follow-Along Workouts (High Engagement)": [
    { title: "10 Min Abs Workout - Chloe Ting", duration: "10 min", equipment: "None", impact: "Medium", videoId: "https://youtu.be/lHCZY6ZN2aI?si=7jYjl9uBVVRmXQcf" },
    { title: "15 Min Full Body HIIT - Pamela Reif", duration: "15 min", equipment: "None", impact: "High", videoId: "gC_L9qAHVJ8" },
    { title: "20 Min Beginner Cardio Workout - FitnessBlender", duration: "20 min", equipment: "None", impact: "Low", videoId: "ml6cT4AZdqI" },
    { title: "30 Min Full Body Strength - Heather Robertson", duration: "30 min", equipment: "Dumbbells", impact: "Medium", videoId: "https://youtu.be/pbkrx340TBM?si=4RdrZQG5KjuZMsMd" },
    { title: "10 Min Standing Abs - MadFit", duration: "10 min", equipment: "None", impact: "Low", videoId: "2pLT-olgUJs" },
    { title: "20 Min Pilates Full Body - Move With Nicole", duration: "20 min", equipment: "Mat", impact: "Low", videoId: "https://youtu.be/-_6uhR46pvE?si=BCPBRkaD0yOlvgcM0E" },
    { title: "15 Min Dance Cardio - The Fitness Marshall", duration: "15 min", equipment: "None", impact: "High", videoId: "https://youtu.be/RFfbZV3bwys?si=e5rINW0s2eVES8bq" },
    { title: "25 Min Yoga Flow - Yoga With Adriene", duration: "25 min", equipment: "Mat", impact: "Low", videoId: "v7AYKMP6rOE" },
    { title: "12 Min Lower Body Burn - Blogilates", duration: "12 min", equipment: "None", impact: "Medium", videoId: "https://youtu.be/xEoCXW09-pk?si=5GTrV4LS_QQ0ebMQEp2bNEoeSOo" }
  ],
  "Educational & Myth-Busting (Builds Authority)": [
    { title: "How to Do a Perfect Squat - Jeff Nippard", videoId: "ultWZbUMPL8" },
    { title: "Gym Machine Guide for Beginners - ScottHermanFitness", videoId: "2tM1LFFxeKg" },
    { title: "Perfect Push-Up Form - Athlean-X", videoId: "IODxDxX7oi4" },
    { title: "Fat Loss Science Explained - Jeff Nippard", videoId: "https://youtu.be/d8V9ZaSq9Oc?si=E58VyEB6KmjNJQYQ" },
    { title: "Build Muscle Without Weights ", videoId: "https://youtube.com/shorts/5JzXaqEdsBc?si=L39G_AOpQSzoNKfu" },
    { title: "Nutrition Basics for Beginners - Natacha Océane", videoId: "https://youtu.be/fU3y1NeMyrE?si=mmdOxG1p7_Q2AV0T8fiJy5Hs" },
    { title: "How to Stay Motivated ", videoId: "https://youtube.com/shorts/I0Zbb7F5JVY?si=YgCoY_T22obGHI0Y" },
    { title: "Sleep and Recovery - Jeff Cavaliere", videoId: "https://youtu.be/0JeQlfQ5iCg?si=-wJXke1wcObr-6oj" },
    { title: "Hydration for Athletes - Thomas DeLauer", videoId: "https://youtu.be/UdqVagcUqD4?si=farT0HlAiVwfFonL" }
  ],
  "Nutrition & Lifestyle (Relatable Content)": [
    { title: "Meal Prep for the Week", videoId: "https://youtu.be/1N6hbRbyAeQ?si=oSGmyEFBMcq_HYiNOQmA4" },
    { title: "Full Day of Eating - Greg Doucette", videoId: "https://youtu.be/_-5Vve47yks?si=C8zq9rftSYrgeHJnR2Qh8" },
    { title: "Healthy Snack Ideas - Pick Up Limes", videoId: "https://youtu.be/S1OJ3U2T4PY?si=y7shyRaVlH9AagcL" },
    { title: "Morning Routine for Fitness - Matt D'Avella", videoId: "https://youtu.be/3PrCie6lvY8?si=5Lkv7lhrmk329lO9" },
    { title: "Staying Consistent Tips ", videoId: "https://youtu.be/f_ZTq8AnuNI?si=rSQ6t8zq3-bc7spr" },
    { title: "Weekly Workout Split Explained ", videoId: "https://youtu.be/n-ZU4hMQ5ZA?si=F5EViH1V2Tr1j4QK" },
    { title: "Best Fitness Apps Review - Stephanie Buttermore", videoId: "https://youtu.be/DD5AdBErOiQ?si=IF-nuim-6UNqEaO4" },
    { title: "Budget Home Gym Setup - Buff Dudes", videoId: "https://youtu.be/BhLPFyZLUY4?si=Z2bXH7w0nm27rwWq" },
    { title: "Gym Bag Essentials - Whitney Simmons", videoId: "https://youtu.be/WkJ4DO4x_XQ?si=cqKur_AZzjGoMf6I" }
  ]
};

function GlassCard({ children, style, ...props }) {
  return (
    <div style={{
      background: "rgba(26, 26, 26, 0.95)", borderRadius: "1.5rem",
      boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.1)",
      border: "1px solid rgba(16, 185, 129, 0.2)", padding: "1.5rem",
      backdropFilter: "blur(24px)",
      ...style
    }} {...props}>
      {children}
    </div>
  );
}


function ExerciseFormPage() {
  const [currentVideo, setCurrentVideo] = useState({
    title: "Shoulder Press – Perfect Form",
    url: "https://www.youtube.com/embed/2yjwXTZQDDI"
  });
  const [expanded, setExpanded] = useState({});
  const [videoWidth, setVideoWidth] = useState(640);

  const playVideo = (title, col) => {
    const dict = col === "mistake" ? mistakeVideos : exerciseVideos;
    const code = dict[title];
    setCurrentVideo({
      title,
      url: code ? `https://www.youtube.com/embed/${getYouTubeId(code)}` : ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = (sec) => setExpanded((prev) => ({ ...prev, [sec]: !prev[sec] }));

  return (
    <div style={{ padding: window.innerWidth < 768 ? "1rem 0.5rem 0 0.5rem" : "34px 40px 0 40px" }}>
      <h2 style={{ fontSize: "1.7rem", fontWeight: "bold", marginBottom: 20, color: "#10b981" }}>General Fitness Video Section</h2>
      <GlassCard style={{ marginBottom: 36 }}>
        <iframe
          width={videoWidth}
          height={videoWidth * 9 / 16}
          src={currentVideo.url}
          title={currentVideo.title}
          style={{
            borderRadius: 16,
            boxShadow: "0 2px 13px rgba(0,0,0,0.5)",
            border: "none",
            background: "#1a1a1a"
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <label style={{ marginTop: 7, fontSize: 13, opacity: .82, display: "block", color: "#a3a3a3" }}>Adjust video size</label>
        <input
          type="range"
          min="320"
          max="900"
          value={videoWidth}
          onChange={e => setVideoWidth(Number(e.target.value))}
          style={{ width: 240, accentColor: "#10b981" }}
        />
        <p style={{ fontSize: 16, fontWeight: 500, marginTop: 15, opacity: .9, color: "white" }}>{currentVideo.title}</p>
      </GlassCard>
      <div style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Exercise Form column */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <GlassCard>
            <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 9, color: "#10b981" }}>Exercise Form</h3>
            {Object.entries(exercises).map(([section, list]) => (
              <div key={section} style={{ marginBottom: 19 }}>
                <button
                  onClick={() => toggle("form-" + section)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                    fontWeight: "bold", fontSize: 17, background: "none", border: "none", color: "#fff", marginBottom: 7, cursor: "pointer"
                  }}>
                  <span style={{ textTransform: "capitalize" }}>
                    {section.replace("quadsGlutes", "Quads & Glutes").replace("hamstringsGlutes", "Hamstrings & Glutes")}
                  </span>
                  <span style={{ fontSize: 16, transition: "transform 0.3s", transform: expanded["form-" + section] ? "rotate(180deg)" : "none", color: "#10b981" }}>▼</span>
                </button>
                {expanded["form-" + section] && (
                  <div>
                    {list.map(v => (
                      <button
                        key={v}
                        onClick={() => playVideo(v, "form")}
                        style={{
                          display: "block", width: "100%",
                          background: "#1a1a1a", color: "#e5e5e5", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8,
                          padding: "9px 14px", marginBottom: 7, textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 500,
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.color = "#10b981" }}
                        onMouseOut={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.05)"; e.target.style.color = "#e5e5e5" }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </GlassCard>
        </div>
        {/* Common Mistakes column - identical structure */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <GlassCard>
            <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 9, color: "#ef4444" }}>Common Mistakes</h3>
            {Object.entries(exercises).map(([section, list]) => (
              <div key={section + "-mistake"} style={{ marginBottom: 19 }}>
                <button
                  onClick={() => toggle("mistake-" + section)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                    fontWeight: "bold", fontSize: 17, background: "none", border: "none", color: "#fff", marginBottom: 7, cursor: "pointer"
                  }}>
                  <span style={{ textTransform: "capitalize" }}>
                    {section.replace("quadsGlutes", "Quads & Glutes").replace("hamstringsGlutes", "Hamstrings & Glutes")}
                  </span>
                  <span style={{ fontSize: 16, transition: "transform 0.3s", transform: expanded["mistake-" + section] ? "rotate(180deg)" : "none", color: "#ef4444" }}>▼</span>
                </button>
                {expanded["mistake-" + section] && (
                  <div>
                    {list.map(v => (
                      <button
                        key={v + "-mistake"}
                        onClick={() => playVideo(v, "mistake")}
                        style={{
                          display: "block", width: "100%",
                          background: "#1a1a1a", color: "#e5e5e5", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8,
                          padding: "9px 14px", marginBottom: 7, textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 500,
                          transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444" }}
                        onMouseOut={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.05)"; e.target.style.color = "#e5e5e5" }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function FitnessVideosPage() {
  const [currentVideo, setCurrentVideo] = useState({
    title: fitnessVideos["Follow-Along Workouts (High Engagement)"][0].title,
    url: `https://www.youtube.com/embed/${getYouTubeId(fitnessVideos["Follow-Along Workouts (High Engagement)"][0].videoId)}`
  });
  const [expanded, setExpanded] = useState({});
  const [videoWidth, setVideoWidth] = useState(640);

  const toggle = section => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  const playVideo = item => {
    const videoId = getYouTubeId(item.videoId);
    setCurrentVideo({
      title: item.title,
      url: videoId ? `https://www.youtube.com/embed/${videoId}` : ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ padding: "34px 40px 0 40px" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: 22, color: "#10b981" }}>Fitness Videos</h2>
      <GlassCard style={{ marginBottom: 30, textAlign: "center" }}>
        <iframe
          style={{
            borderRadius: 18,
            boxShadow: "0 0 16px rgba(0,0,0,0.5)",
            border: "none",
            background: "#1a1a1a"
          }}
          width={videoWidth}
          height={videoWidth * 9 / 16}
          src={currentVideo.url}
          title={currentVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <label style={{ marginTop: 6, fontSize: 13, opacity: .82, display: "block", color: "#a3a3a3" }}>Adjust video size</label>
        <input
          type="range"
          min="320"
          max="900"
          value={videoWidth}
          onChange={e => setVideoWidth(Number(e.target.value))}
          style={{ width: 240, accentColor: "#10b981" }}
        />
        <p style={{ fontSize: 17, fontWeight: 500, marginTop: 15, opacity: .92, color: "white" }}>{currentVideo.title}</p>
      </GlassCard>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 32 }}>
        {Object.entries(fitnessVideos).map(([section, items]) => (
          <GlassCard key={section} style={{ marginBottom: 12 }}>
            <button
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                fontWeight: "bold", fontSize: 19, marginBottom: 12, background: "none", border: "none", color: "#fff"
              }}
              onClick={() => toggle(section)}
            >
              {section}
              <span style={{
                display: "inline-block", marginLeft: 8, fontSize: 18, transition: "transform 0.3s",
                transform: expanded[section] ? "rotate(180deg)" : "none", color: "#10b981"
              }}>▼</span>
            </button>
            {expanded[section] && (
              <div>
                {items.map((item, idx) => (
                  <button
                    key={item.title + idx}
                    onClick={() => playVideo(item)}
                    style={{
                      display: "block", width: "100%",
                      background: "#1a1a1a", color: "#e5e5e5", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8,
                      padding: "13px 15px", marginBottom: 12, textAlign: "left", cursor: "pointer", fontSize: 16, fontWeight: 500,
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.color = "#10b981" }}
                    onMouseOut={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.05)"; e.target.style.color = "#e5e5e5" }}
                  >
                    {item.title}
                    {item.duration && (
                      <div style={{ fontSize: 13, color: "#a3a3a3", marginTop: 3 }}>
                        {item.duration} · Equipment: {item.equipment} · Impact: {item.impact}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default function FitnessAppPages() {
  const [activePage, setActivePage] = useState("fitness");

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000000",
      color: "#fff",
      fontFamily: "Inter, Arial, sans-serif",
      paddingTop: "6rem",
      position: "relative"
    }}>

      {/* Home Button - top right */}
      <div style={{
        position: "fixed", top: 24, right: 40, zIndex: 20
      }}>
        <button
          style={{
            padding: "13px 27px",
            borderRadius: "9999px",
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "#fff",
            border: "none",
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 0 25px rgba(16, 185, 129, 0.6)",
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.08)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
          onClick={() => window.location.href = "/"}
        >
          Home
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 18, padding: "0 40px", flexWrap: "wrap" }}>
        <button
          style={{
            padding: "15px 33px",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: 17,
            marginBottom: 8,
            background:
              activePage === "fitness"
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "#1a1a1a",
            color: "#fff",
            border: activePage === "fitness" ? "none" : "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              activePage === "fitness"
                ? "0 10px 25px -5px rgba(16, 185, 129, 0.5)"
                : "none",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onClick={() => setActivePage("fitness")}
        >
          Fitness Videos
        </button>
        <button
          style={{
            padding: "15px 33px",
            borderRadius: "9999px",
            fontWeight: 700,
            fontSize: 17,
            marginBottom: 8,
            background:
              activePage === "exercise"
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "#1a1a1a",
            color: "#fff",
            border: activePage === "exercise" ? "none" : "1px solid rgba(255,255,255,0.1)",
            boxShadow:
              activePage === "exercise"
                ? "0 10px 25px -5px rgba(16, 185, 129, 0.5)"
                : "none",
            cursor: "pointer",
            transition: "all 0.3s"
          }}
          onClick={() => setActivePage("exercise")}
        >
          Exercises Form Videos
        </button>
      </div>
      {activePage === "fitness" ? <FitnessVideosPage /> : <ExerciseFormPage />}
    </div>
  );
}

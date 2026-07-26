import React, { useState } from "react";
import { PlayCircle, ShieldCheck, Flame, X, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { exerciseVideos, fitnessVideos, recipeVideos } from '../data/videoData';

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
    title: exerciseVideos[0]?.title || "Bench Press (Flat)",
    url: exerciseVideos[0]?.embedUrl || ""
  });
  const [expanded, setExpanded] = useState({});

  // Group exercises by subcategory
  const groupedExercises = exerciseVideos.reduce((acc, video) => {
    const section = video.subcategory || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(video);
    return acc;
  }, {});

  // Calculate responsive video width
  const getVideoWidth = () => {
    const viewportWidth = window.innerWidth;
    if (viewportWidth < 768) return Math.min(viewportWidth - 40, 600); // Mobile
    if (viewportWidth < 1024) return Math.min(viewportWidth - 100, 700); // Tablet
    return Math.min(viewportWidth - 200, 900); // Desktop
  };

  const [videoWidth, setVideoWidth] = useState(getVideoWidth());

  // Update video width on resize
  React.useEffect(() => {
    const handleResize = () => setVideoWidth(getVideoWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playVideo = (video) => {
    setCurrentVideo({
      title: video.title,
      url: video.embedUrl
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = (sec) => setExpanded((prev) => ({ ...prev, [sec]: !prev[sec] }));

  return (
    <div style={{ padding: window.innerWidth < 768 ? "1rem 0.5rem 0 0.5rem" : "clamp(1rem, 3vw, 2.125rem) clamp(1rem, 4vw, 2.5rem) 0" }}>
      <h2 style={{ fontSize: "clamp(1.25rem, 3vw, 1.7rem)", fontWeight: "bold", marginBottom: "clamp(1rem, 2vw, 1.25rem)", color: "#10b981" }}>Exercise Form Tutorials</h2>
      <GlassCard style={{ marginBottom: "clamp(1.5rem, 3vw, 2.25rem)", padding: "clamp(1rem, 2vw, 1.5rem)" }}>
        <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}>
          {currentVideo.url ? (
            <iframe
              width="100%"
              height={Math.min(videoWidth * 9 / 16, 506)}
              src={currentVideo.url}
              title={currentVideo.title}
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 13px rgba(0,0,0,0.5)",
                border: "none",
                background: "#1a1a1a",
                maxWidth: "100%"
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
             <div style={{ width: "100%", height: Math.min(videoWidth * 9 / 16, 506), background: "#1a1a1a", borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No video selected
             </div>
          )}
        </div>
        <label style={{ marginTop: "clamp(0.5rem, 1vw, 0.75rem)", fontSize: "clamp(0.75rem, 1.5vw, 0.8125rem)", opacity: .82, display: "block", color: "#a3a3a3" }}>Adjust video size</label>
        <input
          type="range"
          min={window.innerWidth < 768 ? "280" : "320"}
          max={window.innerWidth < 768 ? "600" : "900"}
          value={videoWidth}
          onChange={e => setVideoWidth(Number(e.target.value))}
          style={{ width: "min(240px, 80vw)", accentColor: "#10b981" }}
        />
        <p style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)", fontWeight: 500, marginTop: "clamp(0.75rem, 2vw, 1rem)", opacity: .9, color: "white" }}>{currentVideo.title}</p>
      </GlassCard>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30, alignItems: "flex-start" }}>
        {Object.entries(groupedExercises).map(([section, list]) => (
          <GlassCard key={section}>
            <button
              onClick={() => toggle("form-" + section)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                fontWeight: "bold", fontSize: 17, background: "none", border: "none", color: "#10b981", marginBottom: 7, cursor: "pointer"
              }}>
              <span style={{ textTransform: "capitalize" }}>{section}</span>
              <span style={{ fontSize: 16, transition: "transform 0.3s", transform: expanded["form-" + section] ? "rotate(180deg)" : "none", color: "#10b981" }}>▼</span>
            </button>
            {expanded["form-" + section] && (
              <div style={{ marginTop: 15 }}>
                {list.map(v => (
                  <button
                    key={v.id}
                    onClick={() => playVideo(v)}
                    style={{
                      display: "block", width: "100%",
                      background: "#1a1a1a", color: "#e5e5e5", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8,
                      padding: "9px 14px", marginBottom: 7, textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 500,
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => { e.target.style.borderColor = "#10b981"; e.target.style.color = "#10b981" }}
                    onMouseOut={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.05)"; e.target.style.color = "#e5e5e5" }}
                  >
                    {v.title}
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

function FitnessVideosPage() {
  const [currentVideo, setCurrentVideo] = useState({
    title: fitnessVideos[0]?.title || "",
    url: fitnessVideos[0]?.embedUrl || ""
  });
  const [expanded, setExpanded] = useState({});
  const [videoWidth, setVideoWidth] = useState(640);

  const toggle = section => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  
  const playVideo = (video) => {
    setCurrentVideo({
      title: video.title,
      url: video.embedUrl
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sections = {
    "General Fitness & Education": fitnessVideos,
    "High Protein Recipes": recipeVideos
  };

  return (
    <div style={{ padding: "34px 40px 0 40px" }}>
      <h2 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: 22, color: "#10b981" }}>Fitness & Nutrition Videos</h2>
      <GlassCard style={{ marginBottom: 30, textAlign: "center" }}>
        {currentVideo.url ? (
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
        ) : null}
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
        {Object.entries(sections).map(([section, items]) => (
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
                    key={item.id}
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
  const [activePage, setActivePage] = useState("exercise");

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
          Fitness & Nutrition
        </button>
      </div>
      {activePage === "fitness" ? <FitnessVideosPage /> : <ExerciseFormPage />}
    </div>
  );
}

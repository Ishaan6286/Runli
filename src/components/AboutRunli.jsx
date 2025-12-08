import React from "react";
import { Instagram } from "lucide-react";



export default function AboutRunli() {
  const instagramUrl = "https://instagram.com/runli";

  return (
    <>
      <div
        style={{
          width: "100vw",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 1.5rem)",
          position: "relative"
        }}
      >

        <div
          style={{
            width: "100%",
            maxWidth: "min(800px, 95vw)",
            padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)",
            borderRadius: "clamp(1rem, 2vw, 1.5rem)",
            background: "rgba(26, 26, 26, 0.95)",
            color: "#ffffff",
            boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.3)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(16, 185, 129, 0.1)",
            textAlign: "center"
          }}
        >
          <h2 style={{
            fontWeight: 900,
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
            marginBottom: "clamp(0.75rem, 2vw, 1rem)",
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.5px"
          }}>
            About Runli
          </h2>
          <p style={{
            fontWeight: 500,
            fontSize: "1.05rem",
            margin: "0 auto 1.5rem auto",
            maxWidth: 600,
            color: "#a3a3a3",
            lineHeight: "1.7",
            letterSpacing: "0.2px"
          }}>
            Runli is your all-in-one fitness companion. Track your meals, BMI, and workouts with a modern, motivating dashboard.
            Our goal is to make healthy living easy, personalized, and rewarding.
          </p>
          <p style={{
            fontWeight: 500,
            fontSize: "1.05rem",
            margin: "0 auto 2rem auto",
            maxWidth: 600,
            color: "#a3a3a3",
            lineHeight: "1.7",
            letterSpacing: "0.2px"
          }}>
            Whether you're a beginner or a pro, Runli helps you forge your path to better health with advanced tracking, inspiring design, and simple insights.
          </p>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.875rem 1.75rem",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "white",
              borderRadius: "0.75rem",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)",
              transition: "all 0.3s ease",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.5px"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6), 0 12px 15px -6px rgba(16, 185, 129, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)";
            }}
          >
            <Instagram size={24} />
            Follow us on Instagram
          </a>
        </div>
      </div>

      {/* Meet the Founder Section */}
      <div
        style={{
          width: "100vw",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 1.5rem)",
          position: "relative"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "min(1000px, 95vw)",
            padding: "clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem)",
            borderRadius: "clamp(1rem, 2vw, 1.5rem)",
            background: "rgba(26, 26, 26, 0.95)",
            color: "#ffffff",
            boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.3)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(16, 185, 129, 0.1)"
          }}
        >
          <h2 style={{
            fontWeight: 900,
            fontSize: "2.25rem",
            marginBottom: "2rem",
            background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.5px",
            textAlign: "center"
          }}>
            About the Founder
          </h2>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "2.5rem",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {/* Content */}
            <div style={{ flex: "1 1 100%", maxWidth: "800px" }}>
              <p style={{
                fontWeight: 500,
                fontSize: "1.05rem",
                color: "#d1d5db",
                lineHeight: "1.8",
                letterSpacing: "0.2px",
                marginBottom: "1rem"
              }}>
                Hi, I'm <span style={{ color: "#10b981", fontWeight: 700 }}>Ishaan Chawla</span> — a 21-year-old engineering student from Raebareli, UP, currently studying CSE (AI/ML) at Ramaiah Institute of Technology, Bangalore. Like many students, I struggled with tracking my workouts, understanding what to eat, and staying consistent. Every app felt either too complicated or too expensive.
              </p>
              <p style={{
                fontWeight: 500,
                fontSize: "1.05rem",
                color: "#d1d5db",
                lineHeight: "1.8",
                letterSpacing: "0.2px",
                marginBottom: "1rem"
              }}>
                So I built <span style={{ color: "#10b981", fontWeight: 700 }}>Runli</span> — a simple, free fitness companion that helps you track nutrition, calculate important metrics, and stay organised in your fitness journey. No fluff, no confusion — just the essentials you actually need.
              </p>
              <p style={{
                fontWeight: 500,
                fontSize: "1.05rem",
                color: "#d1d5db",
                lineHeight: "1.8",
                letterSpacing: "0.2px"
              }}>
                Runli is my way of combining my love for fitness with my passion for AI and building something that genuinely helps people stay healthy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Hero = () => {
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#000000",
      color: "white",
      position: "relative",
      overflow: "hidden",
      padding: "20px"
    }}>

      {/* Background Ambient Glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(600px, 90vw)",
        height: "min(600px, 90vw)",
        background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(0,0,0,0) 70%)",
        pointerEvents: "none",
        zIndex: 0
      }}></div>

      <div style={{
        textAlign: "center",
        zIndex: 10,
        maxWidth: "min(800px, 95vw)",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 1rem"
      }}>

        {/* Central Logo with Glow */}
        <div style={{
          position: "relative",
          marginBottom: "clamp(1rem, 4vw, 2rem)",
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: "#10b981",
            filter: "blur(40px)",
            opacity: 0.4,
            borderRadius: "50%",
            zIndex: -1
          }}></div>
          <img
            src={logo}
            alt="Runli Logo"
            style={{
              width: "clamp(200px, 60vw, 360px)",
              maxWidth: "100%",
              height: "auto",
              filter: "drop-shadow(0 0 30px rgba(16,185,129,0.4))"
            }}
          />
        </div>

        <h1 style={{
          fontSize: "clamp(2rem, 8vw, 4.5rem)",
          fontWeight: "900",
          color: "#10b981",
          marginBottom: "clamp(0.75rem, 3vw, 1.5rem)",
          letterSpacing: "-0.02em",
          textShadow: "0 0 40px rgba(16,185,129,0.3)"
        }}>
          Runli Fitness
        </h1>

        <p style={{
          fontSize: "clamp(0.9rem, 2.5vw, 1.25rem)",
          color: "#9ca3af",
          marginBottom: "clamp(2rem, 5vw, 3.5rem)",
          lineHeight: "1.6",
          maxWidth: "min(600px, 90vw)",
          padding: "0 1rem"
        }}>
          Your personal companion for tracking nutrition, calculating metrics, and managing your gym life. Simple, effective, and free.
        </p>

        {/* Feature Quick Links */}
        <div style={{
          display: "flex",
          gap: "clamp(0.75rem, 2vw, 1.5rem)",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "clamp(1.5rem, 4vw, 2.5rem)",
          marginTop: "clamp(0.25rem, 1vw, 0.5rem)",
          width: "100%",
          padding: "0 0.5rem"
        }}>
          {user && (
            <Link to="/dashboard" style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#10b981", textDecoration: "none", fontWeight: "600",
              padding: "clamp(0.6rem, 2vw, 0.8rem) clamp(1.2rem, 3vw, 2rem)",
              borderRadius: "999px",
              transition: "all 0.2s",
              fontSize: "clamp(0.85rem, 2vw, 1rem)"
            }}
              onMouseOver={e => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Go to Dashboard →
            </Link>
          )}

          <Link to="/gym-mode" style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "transparent",
            border: "1px solid #10b981",
            color: "#10b981", textDecoration: "none", fontWeight: "600",
            padding: "clamp(0.6rem, 2vw, 0.8rem) clamp(1.2rem, 3vw, 2rem)",
            borderRadius: "999px",
            transition: "all 0.2s",
            fontSize: "clamp(0.85rem, 2vw, 1rem)"
          }}
            onMouseOver={e => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Dumbbell size={20} /> Gym Mode
          </Link>

          <Link to="/habits" style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "transparent",
            border: "1px solid #3b82f6", // Blue specific for clarity
            color: "#3b82f6", textDecoration: "none", fontWeight: "600",
            padding: "clamp(0.6rem, 2vw, 0.8rem) clamp(1.2rem, 3vw, 2rem)",
            borderRadius: "999px",
            transition: "all 0.2s",
            fontSize: "clamp(0.85rem, 2vw, 1rem)"
          }}
            onMouseOver={e => {
              e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Target size={20} /> Habit Tracker
          </Link>
        </div>

        {/* Main CTA Buttons - Conditional based on login status */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", width: "100%" }}>
          <Link to={user ? "/userinfo" : "/login"} style={{
            padding: "clamp(0.8rem, 2.5vw, 1rem) clamp(2rem, 5vw, 3.5rem)",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#000",
            textDecoration: "none",
            borderRadius: "999px",
            fontWeight: "800",
            fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)",
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
            transition: "all 0.3s ease",
            border: "1px solid rgba(255,255,255,0.1)",
            textAlign: "center",
            maxWidth: "min(400px, 90vw)"
          }}
            onMouseOver={e => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 0 40px rgba(16, 185, 129, 0.6)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(16, 185, 129, 0.4)";
            }}
          >
            {user ? "Generate a New Plan" : "Start my journey"}
          </Link>

          {user && (
            <Link to="/plan" style={{
              padding: "clamp(0.7rem, 2vw, 0.9rem) clamp(1.8rem, 4vw, 3rem)",
              background: "transparent",
              color: "#10b981",
              textDecoration: "none",
              borderRadius: "999px",
              fontWeight: "700",
              fontSize: "clamp(0.9rem, 2vw, 1rem)",
              border: "2px solid #10b981",
              transition: "all 0.3s ease",
              textAlign: "center",
              maxWidth: "min(350px, 85vw)"
            }}
              onMouseOver={e => {
                e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              View Plan Page
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};

export default Hero;

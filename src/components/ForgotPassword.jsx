import React, { useState } from "react";
import bg from "../assets/lbg.jpg";
import logo from "../assets/logo.png";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#000000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative"
      }}
    >
      {/* LOGO TOP LEFT */}


      <div
        style={{
          background: "rgba(26, 26, 26, 0.95)",
          borderRadius: "2rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 100px rgba(59, 130, 246, 0.15)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          padding: "3rem 2rem",
          maxWidth: 420,
          width: "90vw",
          color: "#f1f5f9",
          position: "relative"
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: "2.5rem",
            background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.5rem",
            letterSpacing: "-0.5px",
            textAlign: "center",
          }}
        >
          Reset Password
        </div>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "2rem", fontSize: "0.95rem" }}>
          {submitted ? "Check your inbox" : "We'll send you a reset link"}
        </p>

        {submitted ? (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            textAlign: "center",
            marginBottom: "2rem"
          }}>
            <div style={{
              fontSize: "3rem",
              marginBottom: "1rem",
              filter: "drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3))"
            }}>
              ✉️
            </div>
            <div style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Email Sent Successfully!
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: "1.6" }}>
              Please check your email for a password reset link. It may take a few minutes to arrive.
            </div>
          </div>
        ) : (
          <>
            <p style={{
              color: "#cbd5e1",
              marginBottom: "1.5rem",
              textAlign: "center",
              fontSize: "0.95rem",
              lineHeight: "1.6",
            }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            {/* Error Message */}
            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#ef4444",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                fontSize: "0.9rem",
                textAlign: "center"
              }}>
                {error}
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Email address"
              style={{
                width: "100%",
                boxSizing: "border-box",
                fontSize: "1rem",
                padding: "0.875rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                background: "rgba(15, 23, 42, 0.5)",
                marginBottom: "1.5rem",
                color: "#f1f5f9",
                fontWeight: 500,
                outline: "none",
                transition: "all 0.3s ease",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(96, 165, 250, 0.5)";
                e.target.style.boxShadow = "0 0 0 3px rgba(96, 165, 250, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(148, 163, 184, 0.2)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              style={{
                width: "100%",
                fontSize: "1.05rem",
                padding: "0.875rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                fontWeight: 700,
                color: "white",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)",
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.3s ease",
              }}
              onClick={handleSubmit}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.3)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.2)";
              }}
            >
              Send Reset Link
            </button>
          </>
        )}

        <div style={{
          textAlign: "center",
          marginTop: "1.5rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid rgba(148, 163, 184, 0.1)"
        }}>
          <a href="/login" style={{
            color: "#60a5fa",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
            transition: "color 0.3s",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
            onMouseOver={(e) => e.target.style.color = "#93c5fd"}
            onMouseOut={(e) => e.target.style.color = "#60a5fa"}>
            ← Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

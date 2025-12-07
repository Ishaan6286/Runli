import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import bg from "../assets/lbg.jpg";
import logo from "../assets/logo.png";

import { loginUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser(email, password);
      login(data.user, data.token);
      navigate("/userinfo");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5001/api/auth/google";
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
        position: "relative",
      }}
    >
      {/* LOGO - Top Left */}


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
          position: "relative",
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
          Welcome Back
        </div>
        <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Sign in to continue your fitness journey
        </p>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            padding: "0.875rem",
            fontWeight: 600,
            background: "rgba(255, 255, 255, 0.95)",
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            cursor: "pointer",
            gap: "0.75rem",
            transition: "all 0.3s ease",
            marginBottom: "2rem",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0" }}>
          <div style={{ flex: 1, borderTop: "1px solid rgba(148, 163, 184, 0.2)" }} />
          <div style={{ padding: "0 1rem", fontWeight: 600, color: "#64748b", fontSize: "0.875rem" }}>OR</div>
          <div style={{ flex: 1, borderTop: "1px solid rgba(148, 163, 184, 0.2)" }} />
        </div>

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
            marginBottom: "1rem",
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

        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: "1rem",
              padding: "0.875rem 3rem 0.875rem 1rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              background: "rgba(15, 23, 42, 0.5)",
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
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#60a5fa"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#94a3b8"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          style={{
            width: "100%",
            fontSize: "1.05rem",
            padding: "0.875rem",
            borderRadius: "0.75rem",
            background: loading ? "#6b7280" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            fontWeight: 700,
            color: "white",
            border: "none",
            boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "1rem",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleLogin}
          disabled={loading}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.3)";
            }
          }}
          onMouseOut={(e) => {
            if (!loading) {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.2)";
            }
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div style={{
          textAlign: "center",
          marginTop: "1.25rem",
          fontWeight: 500,
          fontSize: "0.9rem",
          color: "#94a3b8"
        }}>
          <a href="/forgot-password" style={{ color: "#60a5fa", textDecoration: "none", transition: "color 0.3s" }}
            onMouseOver={(e) => e.target.style.color = "#93c5fd"}
            onMouseOut={(e) => e.target.style.color = "#60a5fa"}>
            Forgot password?
          </a>
        </div>
        <div style={{
          textAlign: "center",
          marginTop: "1rem",
          fontWeight: 500,
          fontSize: "0.9rem",
          color: "#94a3b8"
        }}>
          Don't have an account?{" "}
          <a href="/signup" style={{ color: "#a78bfa", fontWeight: 600, textDecoration: "none", transition: "color 0.3s" }}
            onMouseOver={(e) => e.target.style.color = "#c4b5fd"}
            onMouseOut={(e) => e.target.style.color = "#a78bfa"}>
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

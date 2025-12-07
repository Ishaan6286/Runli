import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, Settings, User } from "lucide-react";
import UserProfileMenu from "./UserProfileMenu";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Determine if we are on the Landing Page
  const isLanding = location.pathname === "/";

  // If on Landing Page, render responsive navigation
  if (isLanding) {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      // Mobile: Show hamburger menu
      return (
        <>
          <div
            style={{
              position: "fixed",
              top: "20px",
              left: "20px", // Moved to LEFT
              zIndex: 10000000,
              pointerEvents: "auto",
            }}
          >
            {/* Hamburger Toggle Button */}
            <button
              onClick={() => setIsOpen(true)}
              style={{
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(4px)",
                borderRadius: "12px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                cursor: "pointer",
                color: "#10b981",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow: "0 0 15px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Menu size={28} />
            </button>
          </div>

          {/* Menu Backdrop & Sidebar */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setIsOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(4px)",
                  zIndex: 10000000,
                }}
              />

              {/* Sidebar Drawer */}
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: "280px",
                  background: "#0a0a0a",
                  borderLeft: "1px solid rgba(16, 185, 129, 0.2)",
                  zIndex: 10000001,
                  display: "flex",
                  flexDirection: "column",
                  padding: "2rem",
                  boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
                  animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
              >
                {/* Header / Close */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h2 style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    color: "#10b981",
                    background: "linear-gradient(90deg, #10b981, #059669)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    Runli
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#a3a3a3",
                      cursor: "pointer",
                      padding: "5px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={28} />
                  </button>
                </div>

                {/* Menu Links */}
                <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <Link
                    to={user ? "/dashboard" : "/login"}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#e5e5e5",
                      textDecoration: "none",
                      padding: "1rem",
                      borderRadius: "12px",
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      textAlign: "center",
                    }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/shopping"
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#e5e5e5",
                      textDecoration: "none",
                      padding: "1rem",
                      borderRadius: "12px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      textAlign: "center",
                    }}
                  >
                    Shopping
                  </Link>
                  <Link
                    to="/videos"
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: "#e5e5e5",
                      textDecoration: "none",
                      padding: "1rem",
                      borderRadius: "12px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      textAlign: "center",
                    }}
                  >
                    Video Dashboard
                  </Link>

                  {/* User Profile Menu in sidebar */}
                  {user && (
                    <>
                      <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "1rem 0" }} />
                      <Link
                        to="/userinfo"
                        state={{ editMode: true }}
                        onClick={() => setIsOpen(false)}
                        style={{
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#a3a3a3",
                          textDecoration: "none",
                          padding: "1rem",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <Settings size={20} />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          navigate("/");
                          setIsOpen(false);
                        }}
                        style={{
                          fontSize: "1rem",
                          fontWeight: "500",
                          color: "#ef4444",
                          background: "transparent",
                          border: "none",
                          padding: "1rem",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          textAlign: "left",
                          cursor: "pointer",
                          gap: "10px",
                          fontFamily: "inherit",
                        }}
                      >
                        <LogOut size={20} />
                        Sign Out
                      </button>
                    </>
                  )}
                </nav>

                {/* Animation styles */}
                <style>
                  {`
                    @keyframes slideInRight {
                      from { transform: translateX(100%); opacity: 0; }
                      to { transform: translateX(0); opacity: 1; }
                    }
                  `}
                </style>
              </div>
            </>
          )}
        </>
      );
    }

    // Desktop: Show horizontal buttons
    return (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "30px",
          zIndex: 10000000,
          pointerEvents: "auto",
          display: "flex",
          gap: "20px",
        }}
      >
        <Link
          to={user ? "/dashboard" : "/login"}
          style={{
            padding: "14px 32px",
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "white",
            borderRadius: "999px",
            fontWeight: "600",
            fontSize: "18px",
            textDecoration: "none",
            boxShadow: "0 0 25px rgba(16, 185, 129, 0.6)",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          Dashboard
        </Link>
        <Link
          to="/shopping"
          style={{
            padding: "14px 32px",
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "white",
            borderRadius: "999px",
            fontWeight: "600",
            fontSize: "18px",
            textDecoration: "none",
            boxShadow: "0 0 25px rgba(16, 185, 129, 0.6)",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          Shopping
        </Link>
        <Link
          to="/videos"
          style={{
            padding: "14px 32px",
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "white",
            borderRadius: "999px",
            fontWeight: "600",
            fontSize: "18px",
            textDecoration: "none",
            boxShadow: "0 0 25px rgba(16, 185, 129, 0.6)",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          Video Dashboard
        </Link>

        {/* User Profile Menu */}
        <UserProfileMenu />
      </div>
    );
  }

  // --- HAMBURGER MENU MODE (For all other pages) ---
  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "30px", // Moved to LEFT
          zIndex: 10000000,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: "1rem"
        }}
      >
        {/* Hamburger Toggle Button */}
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: "rgba(0,0,0,0.5)", // Added background for better visibility
            backdropFilter: "blur(4px)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            color: "#10b981",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.background = "rgba(0,0,0,0.8)";
            e.currentTarget.style.borderColor = "#10b981";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "rgba(0,0,0,0.5)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
        >
          <Menu size={32} />
        </button>
      </div>

      {/* Menu Backdrop & Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 10000000,
            }}
          />

          {/* Sidebar Drawer */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "300px",
              background: "#0a0a0a",
              borderRight: "1px solid rgba(16, 185, 129, 0.2)",
              zIndex: 10000001,
              display: "flex",
              flexDirection: "column",
              padding: "2rem",
              boxShadow: "10px 0 30px rgba(0,0,0,0.5)",
              animation: "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {/* Header / Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#10b981",
                background: "linear-gradient(90deg, #10b981, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px"
              }}>
                Runli
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#a3a3a3",
                  cursor: "pointer",
                  padding: "5px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#a3a3a3";
                }}
              >
                <X size={28} />
              </button>
            </div>

            {/* Menu Links */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { to: "/", label: "Home" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/shopping", label: "Shopping" },
                { to: "/videos", label: "Video Dashboard" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#e5e5e5",
                    textDecoration: "none",
                    padding: "1rem",
                    borderRadius: "12px",
                    transition: "all 0.2s",
                    background: location.pathname === link.to ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    border: location.pathname === link.to ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid transparent"
                  }}
                  onMouseOver={(e) => {
                    if (location.pathname !== link.to) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.transform = "translateX(5px)";
                      e.currentTarget.style.color = "#10b981";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (location.pathname !== link.to) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.color = "#e5e5e5";
                    }
                  }}
                >
                  {link.label}
                </Link>
              ))}

              {/* Separator */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "1rem 0" }} />

              {/* Profile Links added to Sidebar */}
              {user ? (
                <>
                  <Link
                    to="/userinfo"
                    state={{ editMode: true }}
                    onClick={() => setIsOpen(false)}
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "500",
                      color: "#a3a3a3",
                      textDecoration: "none",
                      padding: "1rem",
                      borderRadius: "12px",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#10b981";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#a3a3a3";
                    }}
                  >
                    <Settings size={20} />
                    Profile
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                      setIsOpen(false);
                    }}
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: "500",
                      color: "#ef4444",
                      background: "transparent",
                      border: "none",
                      padding: "1rem",
                      borderRadius: "12px",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      textAlign: "left",
                      cursor: "pointer",
                      gap: "10px",
                      fontFamily: "inherit"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                    onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <LogOut size={20} />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: "#10b981",
                    textDecoration: "none",
                    padding: "1rem",
                    borderRadius: "12px",
                    transition: "all 0.2s",
                    border: "1px solid #10b981",
                    textAlign: "center"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#10b981";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#10b981";
                  }}
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Styles for animation */}
            <style>
              {`
                @keyframes slideInLeft {
                  from { transform: translateX(-100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}
            </style>
          </div>
        </>
      )}
    </>
  );
};

export default Header;

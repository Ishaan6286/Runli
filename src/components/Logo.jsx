import React from "react";
import logo from "../assets/logo.png";

// Reusable Logo Component for top-left placement
export default function Logo({ position = "fixed", style = {} }) {
    return (
        <img
            src={logo}
            alt="Runli Logo"
            style={{
                position: position,
                top: 12,
                left: 12,
                zIndex: 20,
                width: 140,
                height: 140,
                objectFit: "contain",
                filter: "drop-shadow(0 8px 32px rgba(16, 185, 129, 0.5))",
                transition: "transform 0.3s ease",
                ...style
            }}
            onMouseOver={(e) => e.target.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.target.style.transform = "scale(1)"}
        />
    );
}

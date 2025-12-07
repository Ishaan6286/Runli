import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogIn, Settings, HelpCircle, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function UserProfileMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const menuItems = [
        {
            icon: LogIn,
            label: "Login",
            onClick: () => navigate("/login"),
            hidden: !!user
        },
        {
            icon: Settings,
            label: "Customize Profile",
            onClick: () => navigate("/userinfo", { state: { editMode: true } }),
            hidden: !user
        },
        {
            icon: HelpCircle,
            label: "Help",
            href: "mailto:1runli@gmail.com?subject=Help%20Request%20-%20Runli%20Fitness&body=Hi%20Runli%20Team,%0D%0A%0D%0AI%20need%20help%20with:%0D%0A%0D%0A"
        },
        {
            icon: MessageSquare,
            label: "Send Feedback",
            href: "mailto:1runli@gmail.com?subject=Feedback%20-%20Runli%20Fitness&body=Hi%20Runli%20Team,%0D%0A%0D%0AMy%20feedback:%0D%0A%0D%0A"
        },
        {
            icon: LogOut,
            label: "Sign Out",
            onClick: () => {
                logout();
                navigate("/");
            },
            hidden: !user
        }
    ];

    const itemStyle = {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        background: "transparent",
        border: "none",
        borderRadius: "0.5rem",
        color: "#ffffff",
        fontSize: "0.95rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "left",
        textDecoration: "none",
        fontFamily: "inherit"
    };

    return (
        <div style={{ position: "relative" }}>
            {/* Profile Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    border: "2px solid rgba(16, 185, 129, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 0 25px rgba(16, 185, 129, 0.6)",
                    position: "relative"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                    e.currentTarget.style.boxShadow = "0 0 35px rgba(16, 185, 129, 0.8)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 0 25px rgba(16, 185, 129, 0.6)";
                }}
            >
                {user && user.name ? (
                    <span style={{ color: "white", fontWeight: "bold", fontSize: "1.2rem" }}>
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                ) : (
                    <User size={24} color="white" />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9999998
                        }}
                    />

                    {/* Menu */}
                    <div
                        style={{
                            position: "absolute",
                            top: "60px",
                            right: "0",
                            background: "rgba(26, 26, 26, 0.98)",
                            borderRadius: "1rem",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.2)",
                            minWidth: "240px",
                            padding: "0.5rem",
                            zIndex: 9999999,
                            backdropFilter: "blur(10px)"
                        }}
                    >
                        {user && (
                            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "0.5rem" }}>
                                <div style={{ color: "white", fontWeight: "bold", fontSize: "1rem" }}>{user.name}</div>
                                <div style={{ color: "#a3a3a3", fontSize: "0.85rem" }}>{user.email}</div>
                            </div>
                        )}
                        {menuItems.filter(item => !item.hidden).map((item, index) => {
                            const Icon = item.icon;

                            if (item.href) {
                                return (
                                    <a
                                        key={index}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        style={itemStyle}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                            e.currentTarget.style.color = "#10b981";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                            e.currentTarget.style.color = "#ffffff";
                                        }}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </a>
                                );
                            }

                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        item.onClick();
                                        setIsOpen(false);
                                    }}
                                    style={itemStyle}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                        e.currentTarget.style.color = "#10b981";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "#ffffff";
                                    }}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

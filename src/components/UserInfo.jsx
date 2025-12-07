import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { getProfile, updateProfile } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function UserInfo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isEditMode = location.state?.editMode || false;

  const [data, setData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    targetWeight: "",
    frequency: "",
    target: "",
    months: "",
    dietPreference: ""
  });

  // Load existing profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getProfile();
        const profile = response.user;

        // Map backend fields to form fields
        if (profile) {
          setData({
            age: profile.age || "",
            gender: profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "",
            height: profile.height || "",
            weight: profile.weight || "",
            targetWeight: "", // Not in backend yet
            frequency: "", // Not in backend yet
            target: profile.goal ? mapGoalToTarget(profile.goal) : "",
            months: "", // Not in backend yet
            dietPreference: profile.dietPreference || ""
          });
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        // If profile doesn't exist yet, that's okay - user is filling it for first time
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Helper to map backend goal to frontend target
  const mapGoalToTarget = (goal) => {
    const mapping = {
      'lose_weight': 'Fat Loss',
      'maintain': 'General Fitness',
      'gain_muscle': 'Muscle Gain'
    };
    return mapping[goal] || '';
  };

  // Helper to map frontend target to backend goal
  const mapTargetToGoal = (target) => {
    const mapping = {
      'Fat Loss': 'lose_weight',
      'Muscle Gain': 'gain_muscle',
      'Toning': 'maintain',
      'General Fitness': 'maintain',
      'Athletic': 'gain_muscle'
    };
    return mapping[target] || 'maintain';
  };

  // Helper to map frontend frequency to backend activity level
  const mapFrequencyToActivityLevel = (frequency) => {
    const freq = parseInt(frequency);
    if (freq <= 2) return 'sedentary';
    if (freq === 3) return 'light';
    if (freq === 4) return 'moderate';
    if (freq === 5) return 'active';
    return 'very_active';
  };

  const handleChange = (e) => {
    setData(d => ({ ...d, [e.target.name]: e.target.value }));
    setError(""); // Clear error on input
    setSuccess("");
  };

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    for (const field in data) {
      if (!data[field]) {
        setError("Please fill all fields.");
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Save to backend
      await updateProfile({
        age: parseInt(data.age),
        gender: data.gender.toLowerCase(),
        height: parseFloat(data.height),
        weight: parseFloat(data.weight),
        activityLevel: mapFrequencyToActivityLevel(data.frequency),
        goal: mapTargetToGoal(data.target),
        dietPreference: data.dietPreference
      });

      // Also save to localStorage for backward compatibility and immediate access
      localStorage.setItem("runliUserInfo", JSON.stringify(data));

      if (isEditMode) {
        setSuccess("Profile updated successfully!");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        navigate("/plan");
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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
        padding: "4rem 0"
      }}
    >


      <div style={{
        background: "rgba(26, 26, 26, 0.95)",
        borderRadius: "2rem",
        boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.15)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(16, 185, 129, 0.1)",
        padding: "2.5rem 2rem",
        width: "90%",
        maxWidth: 480,
        color: "#ffffff",
        position: "relative"
      }}>
        <h1 style={{
          fontWeight: 900,
          fontSize: "2rem",
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textAlign: "center",
          marginBottom: "0.5rem",
          letterSpacing: "-0.5px"
        }}>
          <span role="img" aria-label="target" style={{ marginRight: "0.5rem" }}>
            {isEditMode ? '⚙️' : '🎯'}
          </span>
          {isEditMode ? "Customize Profile" : "Personal Plan Setup"}
        </h1>
        <p style={{
          marginBottom: "2rem",
          textAlign: "center",
          color: "#a3a3a3",
          fontSize: "1rem",
          fontWeight: 500
        }}>
          {isEditMode ? "Update your details to adjust your plan." : "Let's tailor your fitness journey!"}
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "0.75rem",
            padding: "0.875rem 1rem",
            marginBottom: "1.5rem",
            color: "#fca5a5",
            fontSize: "0.95rem",
            fontWeight: 500,
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "0.75rem",
            padding: "0.875rem 1rem",
            marginBottom: "1.5rem",
            color: "#6ee7b7",
            fontSize: "0.95rem",
            fontWeight: 500,
            textAlign: "center"
          }}>
            {success}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{
            textAlign: "center",
            padding: "3rem 0",
            color: "#a3a3a3"
          }}>
            <div style={{
              fontSize: "1.1rem",
              fontWeight: 500
            }}>
              Loading your profile...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            {/* All span/label and input/select are block and width 100% */}
            <label style={{ width: "100%", display: "block" }}>
              <span style={{
                fontWeight: 600,
                color: "#e5e5e5",
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.95rem"
              }}>Age</span>
              <input
                type="number" name="age" value={data.age} min={12} max={100} onChange={handleChange}
                placeholder="Your age"
                style={{
                  width: "100%",
                  height: 48,
                  fontSize: "1rem",
                  borderRadius: "0.75rem",
                  background: "#1a1a1a",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  padding: "0 1rem",
                  color: "white",
                  fontWeight: 600,
                  boxSizing: "border-box",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#10b981"}
                onBlur={(e) => e.target.style.borderColor = "rgba(16, 185, 129, 0.2)"}
              />
            </label>
            {[
              {
                label: "Gender", name: "gender", type: "select", options: [
                  { value: "", label: "Choose Gender" },
                  { value: "Female", label: "Female" },
                  { value: "Male", label: "Male" },
                  { value: "Other", label: "Other" }
                ]
              },
              {
                label: "Height (cm)", name: "height", type: "number", placeholder: "e.g. 176"
              },
              {
                label: "Weight (kg)", name: "weight", type: "number", placeholder: "Current weight"
              },
              {
                label: "Target Weight (kg)", name: "targetWeight", type: "number", placeholder: "Your goal weight"
              },
              {
                label: "Workout Frequency", name: "frequency", type: "select", options: [
                  { value: "", label: "Days per week" },
                  { value: "2", label: "2 days/week" },
                  { value: "3", label: "3 days/week" },
                  { value: "4", label: "4 days/week" },
                  { value: "5", label: "5 days/week" },
                  { value: "6", label: "6 days/week" },
                  { value: "7", label: "7 days/week" }
                ]
              },
              {
                label: "Target Physique", name: "target", type: "select", options: [
                  { value: "", label: "Choose a goal" },
                  { value: "Fat Loss", label: "Fat Loss" },
                  { value: "Muscle Gain", label: "Muscle Gain" },
                  { value: "Toning", label: "Toning" },
                  { value: "General Fitness", label: "General Fitness" },
                  { value: "Athletic", label: "Athletic" }
                ]
              },
              {
                label: "Duration (months)", name: "months", type: "number", placeholder: "e.g. 3, 6, or 12"
              },
              {
                label: "Diet Preference", name: "dietPreference", type: "select", options: [
                  { value: "", label: "Choose your diet" },
                  { value: "Vegetarian", label: "Vegetarian" },
                  { value: "Non-Vegetarian", label: "Non-Vegetarian" },
                  { value: "Eggetarian", label: "Eggetarian" }
                ]
              }
            ].map(field => (
              <label key={field.name} style={{ width: "100%", display: "block" }}>
                <span style={{
                  fontWeight: 600,
                  color: "#e5e5e5",
                  display: "block",
                  marginBottom: "0.5rem",
                  fontSize: "0.95rem"
                }}>{field.label}</span>
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={data[field.name]}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      height: 48,
                      fontSize: "1rem",
                      borderRadius: "0.75rem",
                      background: "#1a1a1a",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      padding: "0 1rem",
                      color: "white",
                      fontWeight: 600,
                      boxSizing: "border-box",
                      outline: "none",
                      cursor: "pointer"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#10b981"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(16, 185, 129, 0.2)"}
                  >
                    {field.options.map(opt => <option key={opt.value} value={opt.value} style={{ background: "#1a1a1a" }}>{opt.label}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={data[field.name]}
                    onChange={handleChange}
                    placeholder={field.placeholder || ""}
                    style={{
                      width: "100%",
                      height: 48,
                      fontSize: "1rem",
                      borderRadius: "0.75rem",
                      background: "#1a1a1a",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      padding: "0 1rem",
                      color: "white",
                      fontWeight: 600,
                      boxSizing: "border-box",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#10b981"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(16, 185, 129, 0.2)"}
                  />
                )}
              </label>
            ))}
            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: "1rem",
                width: "100%",
                height: 56,
                fontSize: "1.25rem",
                fontWeight: 800,
                borderRadius: "9999px",
                background: saving ? "#6b7280" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)",
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.3s ease",
                opacity: saving ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!saving) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6), 0 12px 15px -6px rgba(16, 185, 129, 0.5)";
                }
              }}
              onMouseOut={(e) => {
                if (!saving) {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.4)";
                }
              }}
            >
              {saving ? "Saving..." : (isEditMode ? "Save Changes" : "Generate My Plan")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

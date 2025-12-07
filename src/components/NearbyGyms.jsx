import React, { useState } from "react";
import { MapPin, Star, DollarSign, Navigation } from "lucide-react";

export default function NearbyGyms() {
    const [gyms, setGyms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationGranted, setLocationGranted] = useState(false);

    const findNearbyGyms = () => {
        setLoading(true);
        setError("");

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocationGranted(true);

                // Using Google Places API via a proxy or direct call
                // For demo purposes, I'll use mock data. In production, you'd call Google Places API
                fetchNearbyGyms(latitude, longitude);
            },
            (err) => {
                setError("Unable to retrieve your location. Please enable location permissions.");
                setLoading(false);
            }
        );
    };

    const fetchNearbyGyms = async (lat, lng) => {
        try {
            const { getNearbyGyms } = await import('../services/api');
            const data = await getNearbyGyms(lat, lng);

            if (data.isMockData) {
                console.log('Using mock gym data - add Google Maps API key to use real data');
            }

            setGyms(data.gyms || []);
            setLoading(false);

            if (!data.gyms || data.gyms.length === 0) {
                setError('No gyms found nearby. Try a different location.');
            }
        } catch (err) {
            console.error('Error fetching gyms:', err);
            setError("Failed to fetch nearby gyms. Please try again.");
            setLoading(false);
        }
    };

    const handleGymClick = (gym) => {
        // Open Google Maps with the gym's location
        if (gym.place_id && !gym.place_id.startsWith('mock_')) {
            // Use place_id for real gyms
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.name)}&query_place_id=${gym.place_id}`, '_blank');
        } else if (gym.location) {
            // Use coordinates for mock data
            window.open(`https://www.google.com/maps/search/?api=1&query=${gym.location.lat},${gym.location.lng}`, '_blank');
        } else {
            // Fallback to name search
            const searchQuery = encodeURIComponent(gym.name + " " + gym.address);
            window.open(`https://www.google.com/maps/search/?api=1&query=${searchQuery}`, '_blank');
        }
    };

    return (
        <div style={{
            width: "100vw",
            background: "#000000",
            padding: "4rem 1.5rem",
            position: "relative"
        }}>
            <div style={{
                maxWidth: "1200px",
                margin: "0 auto"
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h2 style={{
                        fontSize: "2.5rem",
                        fontWeight: 900,
                        background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: "1rem",
                        letterSpacing: "-0.5px"
                    }}>
                        Best Gyms Near You 🏋️
                    </h2>
                    <p style={{
                        color: "#a3a3a3",
                        fontSize: "1.1rem",
                        marginBottom: "2rem"
                    }}>
                        Find the perfect gym in your area with ratings, fees, and distance
                    </p>

                    {!locationGranted && (
                        <button
                            onClick={findNearbyGyms}
                            disabled={loading}
                            style={{
                                padding: "1rem 2.5rem",
                                background: loading ? "#525252" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                color: "white",
                                fontWeight: 800,
                                fontSize: "1.1rem",
                                borderRadius: "9999px",
                                border: "none",
                                boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)",
                                cursor: loading ? "not-allowed" : "pointer",
                                transition: "all 0.3s ease",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem"
                            }}
                            onMouseOver={(e) => {
                                if (!loading) {
                                    e.target.style.transform = "translateY(-2px)";
                                    e.target.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6)";
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!loading) {
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5)";
                                }
                            }}
                        >
                            <Navigation size={20} />
                            {loading ? "Finding Gyms..." : "Find Gyms Near Me"}
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "1rem",
                        padding: "1rem",
                        color: "#ef4444",
                        textAlign: "center",
                        marginBottom: "2rem"
                    }}>
                        {error}
                    </div>
                )}

                {/* Gyms Grid */}
                {gyms.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                        gap: "1.5rem"
                    }}>
                        {gyms.map((gym, index) => (
                            <div
                                key={gym.place_id || gym.id || index}
                                onClick={() => handleGymClick(gym)}
                                style={{
                                    background: "rgba(26, 26, 26, 0.95)",
                                    borderRadius: "1.5rem",
                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                    padding: "1.5rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.1)"
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.borderColor = "#10b981";
                                    e.currentTarget.style.boxShadow = "0 0 100px 0 rgba(16, 185, 129, 0.2)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.2)";
                                    e.currentTarget.style.boxShadow = "0 0 75px 0 rgba(16, 185, 129, 0.1)";
                                }}
                            >
                                {/* Gym Name */}
                                <h3 style={{
                                    fontSize: "1.5rem",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    marginBottom: "1rem"
                                }}>
                                    {gym.name}
                                </h3>

                                {/* Address */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "1rem",
                                    color: "#a3a3a3",
                                    fontSize: "0.9rem"
                                }}>
                                    <MapPin size={16} style={{ color: "#10b981" }} />
                                    {gym.address}
                                </div>

                                {/* Stats Grid */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    gap: "1rem",
                                    marginTop: "1rem"
                                }}>
                                    {/* Distance */}
                                    <div style={{
                                        background: "#1a1a1a",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem",
                                        textAlign: "center"
                                    }}>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "#a3a3a3",
                                            marginBottom: "0.25rem"
                                        }}>
                                            Distance
                                        </div>
                                        <div style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color: "#10b981"
                                        }}>
                                            {gym.distance}
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div style={{
                                        background: "#1a1a1a",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem",
                                        textAlign: "center"
                                    }}>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "#a3a3a3",
                                            marginBottom: "0.25rem"
                                        }}>
                                            Rating
                                        </div>
                                        <div style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 700,
                                            color: "#fbbf24",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.25rem"
                                        }}>
                                            <Star size={16} fill="#fbbf24" />
                                            {gym.rating}
                                        </div>
                                    </div>

                                    {/* Fees */}
                                    <div style={{
                                        background: "#1a1a1a",
                                        borderRadius: "0.75rem",
                                        padding: "0.75rem",
                                        textAlign: "center"
                                    }}>
                                        <div style={{
                                            fontSize: "0.75rem",
                                            color: "#a3a3a3",
                                            marginBottom: "0.25rem"
                                        }}>
                                            Fees
                                        </div>
                                        <div style={{
                                            fontSize: "0.9rem",
                                            fontWeight: 700,
                                            color: "#ffffff"
                                        }}>
                                            {gym.fees}
                                        </div>
                                    </div>
                                </div>

                                {/* Reviews */}
                                <div style={{
                                    marginTop: "1rem",
                                    fontSize: "0.85rem",
                                    color: "#a3a3a3",
                                    textAlign: "center"
                                }}>
                                    {gym.reviews} reviews
                                </div>

                                {/* Click hint */}
                                <div style={{
                                    marginTop: "1rem",
                                    padding: "0.5rem",
                                    background: "rgba(16, 185, 129, 0.1)",
                                    borderRadius: "0.5rem",
                                    textAlign: "center",
                                    fontSize: "0.85rem",
                                    color: "#10b981",
                                    fontWeight: 600
                                }}>
                                    Click to view on Google Maps
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

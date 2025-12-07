import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, ExternalLink, ArrowRight } from "lucide-react";
import product1 from "../assets/product1.png";
import product2 from "../assets/product2.png";
import product3 from "../assets/product3.png";
import product4 from "../assets/product4.png";

const featuredProducts = [
    {
        id: 1,
        name: "Optimum Nutrition Gold Standard Whey",
        price: "₹2,899",
        image: product1,
        rating: 4.5,
        affiliate: "https://www.amazon.in/s?k=optimum+nutrition+whey+protein"
    },
    {
        id: 3,
        name: "Optimum Nutrition Micronized Creatine",
        price: "₹399",
        image: product2,
        rating: 4.7,
        affiliate: "https://www.amazon.in/s?k=optimum+nutrition+creatine"
    },
    {
        id: 12,
        name: "Boldfit Gym Bag with Shoe Compartment",
        price: "₹449",
        image: product3,
        rating: 4.3,
        affiliate: "https://www.amazon.in/s?k=boldfit+gym+bag"
    },
    {
        id: 18,
        name: "Boldfit Gym Shaker Bottle 700ml",
        price: "₹199",
        image: product4,
        rating: 4.4,
        affiliate: "https://www.amazon.in/s?k=boldfit+shaker"
    }
];

export default function ShoppingPreview() {
    const navigate = useNavigate();

    return (
        <div style={{
            width: "100vw",
            background: "#000000",
            padding: "4rem 1.5rem",
            position: "relative",
            borderTop: "1px solid rgba(16, 185, 129, 0.1)"
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
                        letterSpacing: "-0.5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem"
                    }}>
                        <ShoppingCart size={32} style={{ color: "#10b981" }} />
                        Fitness Store
                    </h2>
                    <p style={{
                        color: "#a3a3a3",
                        fontSize: "1.1rem",
                        marginBottom: "2rem"
                    }}>
                        Premium supplements & gym accessories curated for you
                    </p>
                </div>

                {/* Products Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "1.5rem",
                    marginBottom: "3rem"
                }}>
                    {featuredProducts.map((product) => (
                        <div
                            key={product.id}
                            style={{
                                background: "rgba(26, 26, 26, 0.95)",
                                borderRadius: "1.5rem",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                boxShadow: "0 0 75px 0 rgba(16, 185, 129, 0.1)"
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = "translateY(-8px)";
                                e.currentTarget.style.borderColor = "#10b981";
                                e.currentTarget.style.boxShadow = "0 0 100px 0 rgba(16, 185, 129, 0.2)";
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.2)";
                                e.currentTarget.style.boxShadow = "0 0 75px 0 rgba(16, 185, 129, 0.1)";
                            }}
                        >
                            {/* Product Image */}
                            <div style={{
                                width: "100%",
                                height: "180px",
                                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden"
                            }}>
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover"
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />
                            </div>

                            {/* Product Info */}
                            <div style={{ padding: "1.25rem" }}>
                                <h3 style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    marginBottom: "0.5rem",
                                    minHeight: "3rem",
                                    lineHeight: "1.4"
                                }}>
                                    {product.name}
                                </h3>

                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "1rem"
                                }}>
                                    <div style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 800,
                                        color: "#10b981"
                                    }}>
                                        {product.price}
                                    </div>
                                    <div style={{
                                        color: "#fbbf24",
                                        fontSize: "0.9rem",
                                        fontWeight: 600
                                    }}>
                                        ⭐ {product.rating}
                                    </div>
                                </div>

                                <a
                                    href={product.affiliate}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem",
                                        width: "100%",
                                        padding: "0.6rem",
                                        background: "rgba(16, 185, 129, 0.1)",
                                        color: "#10b981",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        borderRadius: "9999px",
                                        textDecoration: "none",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        transition: "all 0.3s ease"
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = "#10b981";
                                        e.target.style.color = "white";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = "rgba(16, 185, 129, 0.1)";
                                        e.target.style.color = "#10b981";
                                    }}
                                >
                                    Buy Now <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All Button */}
                <div style={{ textAlign: "center" }}>
                    <button
                        onClick={() => navigate("/shopping")}
                        style={{
                            padding: "1rem 2.5rem",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "white",
                            fontWeight: 800,
                            fontSize: "1.1rem",
                            borderRadius: "9999px",
                            border: "none",
                            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem"
                        }}
                        onMouseOver={(e) => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 20px 35px -5px rgba(16, 185, 129, 0.6)";
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 10px 25px -5px rgba(16, 185, 129, 0.5)";
                        }}
                    >
                        View All Products <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}

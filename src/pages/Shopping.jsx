import React, { useState, useEffect } from "react";
import { ShoppingCart, ExternalLink, Filter, ArrowUpDown } from "lucide-react";

import { getProducts } from "../services/api";

const categories = ["All", "Protein Powder", "Creatine", "Pre-Workout", "Protein Bars", "Muesli", "Oats", "Gym Bags", "Hand Grippers", "Straps", "Shakers"];

export default function Shopping() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState("none");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await getProducts();
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products
        .filter(p => selectedCategory === "All" || p.category === selectedCategory)
        .sort((a, b) => {
            if (sortOrder === "lowToHigh") return a.price - b.price;
            if (sortOrder === "highToLow") return b.price - a.price;
            return 0;
        });

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#10b981",
                fontSize: "1.5rem"
            }}>
                Loading Store...
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "#000000",
            padding: "2rem",
            paddingTop: "6rem",
            position: "relative"
        }}>


            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1 style={{
                        fontSize: "2.5rem",
                        fontWeight: 900,
                        background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: "0.5rem",
                        letterSpacing: "-0.5px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem"
                    }}>
                        <ShoppingCart size={40} style={{ color: "#10b981" }} />
                        Fitness Store
                    </h1>
                    <p style={{
                        color: "#a3a3a3",
                        fontSize: "1.1rem",
                        marginBottom: "2rem"
                    }}>
                        Premium supplements & gym accessories at the best prices
                    </p>
                </div>

                {/* Controls Section */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    marginBottom: "3rem",
                    alignItems: "center"
                }}>
                    {/* Category Filter */}
                    <div style={{
                        display: "flex",
                        gap: "0.75rem",
                        overflowX: "auto",
                        padding: "0.5rem",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        width: "100%"
                    }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: "0.6rem 1.2rem",
                                    borderRadius: "9999px",
                                    border: selectedCategory === cat ? "2px solid #10b981" : "1px solid rgba(16, 185, 129, 0.3)",
                                    background: selectedCategory === cat ? "rgba(16, 185, 129, 0.1)" : "rgba(26, 26, 26, 0.95)",
                                    color: selectedCategory === cat ? "#10b981" : "#a3a3a3",
                                    fontWeight: selectedCategory === cat ? 700 : 500,
                                    fontSize: "0.9rem",
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Sort Control */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        background: "rgba(26, 26, 26, 0.95)",
                        padding: "0.5rem 1rem",
                        borderRadius: "1rem",
                        border: "1px solid rgba(16, 185, 129, 0.2)"
                    }}>
                        <span style={{ color: "#a3a3a3", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Filter size={16} /> Sort by Price:
                        </span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            style={{
                                background: "transparent",
                                color: "#10b981",
                                border: "none",
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                outline: "none"
                            }}
                        >
                            <option value="none">Featured</option>
                            <option value="lowToHigh">Low to High</option>
                            <option value="highToLow">High to Low</option>
                        </select>
                    </div>
                </div>

                {/* Products Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "2rem"
                }}>
                    {filteredProducts.map(product => (
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
                                e.currentTarget.style.boxShadow = "0 0 100px 0 rgba(16, 185, 129, 0.3)";
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
                                height: "220px",
                                background: `url(${product.image})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                position: "relative"
                            }}>
                                {product.originalPrice && (
                                    <div style={{
                                        position: "absolute",
                                        top: "1rem",
                                        right: "1rem",
                                        background: "#ef4444",
                                        color: "white",
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "9999px",
                                        fontSize: "0.75rem",
                                        fontWeight: 700
                                    }}>
                                        SALE
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div style={{ padding: "1.5rem" }}>
                                {/* Category */}
                                <div style={{
                                    fontSize: "0.75rem",
                                    color: "#10b981",
                                    fontWeight: 600,
                                    marginBottom: "0.5rem",
                                    textTransform: "uppercase"
                                }}>
                                    {product.category}
                                </div>

                                {/* Name */}
                                <h3 style={{
                                    fontSize: "1rem",
                                    fontWeight: 700,
                                    color: "#ffffff",
                                    marginBottom: "0.75rem",
                                    minHeight: "3rem",
                                    lineHeight: "1.5"
                                }}>
                                    {product.name}
                                </h3>

                                {/* Rating */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    marginBottom: "1rem"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                        color: "#fbbf24",
                                        fontSize: "0.9rem",
                                        fontWeight: 600
                                    }}>
                                        ⭐ {product.rating}
                                    </div>
                                    <div style={{
                                        color: "#a3a3a3",
                                        fontSize: "0.8rem"
                                    }}>
                                        ({product.reviews.toLocaleString()} reviews)
                                    </div>
                                </div>

                                {/* Price */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    marginBottom: "1rem"
                                }}>
                                    <div style={{
                                        fontSize: "1.5rem",
                                        fontWeight: 800,
                                        color: "#10b981"
                                    }}>
                                        {product.displayPrice}
                                    </div>
                                    {product.originalPrice && (
                                        <div style={{
                                            fontSize: "1rem",
                                            color: "#a3a3a3",
                                            textDecoration: "line-through"
                                        }}>
                                            {product.originalPrice}
                                        </div>
                                    )}
                                </div>

                                {/* Buy Button */}
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
                                        padding: "0.75rem",
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        fontWeight: 700,
                                        fontSize: "0.95rem",
                                        borderRadius: "9999px",
                                        textDecoration: "none",
                                        transition: "all 0.3s ease",
                                        boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = "scale(1.05)";
                                        e.target.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.5)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = "scale(1)";
                                        e.target.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.3)";
                                    }}
                                >
                                    Buy Now
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No products message */}
                {filteredProducts.length === 0 && (
                    <div style={{
                        textAlign: "center",
                        padding: "4rem",
                        color: "#a3a3a3",
                        fontSize: "1.2rem"
                    }}>
                        No products found in this category
                    </div>
                )}
            </div>
        </div>
    );
}

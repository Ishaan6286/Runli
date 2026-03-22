import React, { useState, useEffect } from "react";
import { ShoppingCart, ExternalLink, Filter, Plus, Minus, X, CheckCircle, TrendingUp, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfile, getProducts } from "../services/api"; // Added getProfile

const categories = ["All", "Protein Powder", "Creatine", "Pre-Workout", "Protein Bars", "Gym Bags", "Straps", "Shakers"];

const mockProducts = [
    { id: 1, name: "Gold Standard 100% Whey", category: "Protein Powder", price: 65, displayPrice: "$65.00", originalPrice: "$75.00", rating: 4.8, reviews: 15420, image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400", fitFor: ["Muscle Gain", "Weight Loss"] },
    { id: 2, name: "Creatine Monohydrate", category: "Creatine", price: 25, displayPrice: "$25.00", rating: 4.9, reviews: 8900, image: "https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&q=80&w=400", fitFor: ["Muscle Gain"] },
    { id: 3, name: "C4 Original Pre-Workout", category: "Pre-Workout", price: 30, displayPrice: "$30.00", originalPrice: "$35.00", rating: 4.7, reviews: 12100, image: "https://images.unsplash.com/photo-1594882645126-14020914d58d?auto=format&fit=crop&q=80&w=400", fitFor: ["Running", "Muscle Gain"] },
    { id: 4, name: "Quest Protein Bars (12 Pack)", category: "Protein Bars", price: 28, displayPrice: "$28.00", rating: 4.6, reviews: 5400, image: "https://images.unsplash.com/photo-1622484211148-54b0eb03f380?auto=format&fit=crop&q=80&w=400", fitFor: ["Weight Loss"] },
    { id: 5, name: "Premium Gym Duffle Bag", category: "Gym Bags", price: 45, displayPrice: "$45.00", originalPrice: "$55.00", rating: 4.8, reviews: 2100, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400", fitFor: ["General"] },
    { id: 6, name: "Heavy Duty Lifting Straps", category: "Straps", price: 15, displayPrice: "$15.00", rating: 4.9, reviews: 3400, image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=400", fitFor: ["Muscle Gain"] },
    { id: 7, name: "Vegan Plant Protein", category: "Protein Powder", price: 55, displayPrice: "$55.00", rating: 4.5, reviews: 1200, image: "https://images.unsplash.com/photo-1623326176374-eab79883505c?auto=format&fit=crop&q=80&w=400", fitFor: ["Weight Loss", "General"] },
    { id: 8, name: "Stainless Steel Shaker", category: "Shakers", price: 20, displayPrice: "$20.00", rating: 4.7, reviews: 4500, image: "https://images.unsplash.com/photo-1616658055663-71822c153dbb?auto=format&fit=crop&q=80&w=400", fitFor: ["General"] }
];

export default function Shopping() {
    const [products, setProducts] = useState(mockProducts);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortOrder, setSortOrder] = useState("none");
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [userGoal, setUserGoal] = useState("Muscle Gain"); // Default
    const [checkoutFlow, setCheckoutFlow] = useState("inactive"); // inactive, active, success

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Try to load user profile to get their goal
                try {
                    const profileData = await getProfile();
                    if (profileData && profileData.goal) {
                        setUserGoal(profileData.goal);
                    }
                } catch (e) {
                    // Fail silently, use default goal if not logged in or backend unavailable
                    console.log("Using default goal for personalization");
                }

                // Try to fetch real products, fallback to mock if backend not working
                try {
                    const apiProducts = await getProducts();
                    if (apiProducts && apiProducts.length > 0) {
                        setProducts(apiProducts);
                    }
                } catch (e) {
                    console.log("Using mock products due to API failure");
                }
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();

        // Load cart from local storage
        const savedCart = localStorage.getItem("runli_cart");
        if (savedCart) setCart(JSON.parse(savedCart));
    }, []);

    // Save cart to local storage
    useEffect(() => {
        localStorage.setItem("runli_cart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

    const handleCheckout = () => {
        setCheckoutFlow("active");
        setTimeout(() => {
            setCheckoutFlow("success");
            setCart([]);
        }, 2000); // Simulate processing
    };

    // Filter and sort products
    const filteredProducts = products
        .filter(p => selectedCategory === "All" || p.category === selectedCategory)
        .sort((a, b) => {
            if (sortOrder === "lowToHigh") return a.price - b.price;
            if (sortOrder === "highToLow") return b.price - a.price;
            return 0;
        });

    if (loading) {
        return (
            <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-500)", fontSize: "1.25rem" }}>
                Loading Store...
            </div>
        );
    }

    return (
        <div className="page-wrapper" style={{ padding: "clamp(1rem, 3vw, 2rem)", paddingTop: "clamp(1.25rem, 4vw, 2rem)" }}>

            <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "100px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <div>
                        <h1 style={{
                            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                            fontWeight: 800,
                            color: "var(--primary-400)",
                            margin: 0,
                            letterSpacing: "-0.02em",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem"
                        }}>
                            <ShoppingCart size={32} />
                            Store
                        </h1>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem", marginTop: "0.25rem" }}>
                            Premium supplements & gear
                        </p>
                    </div>

                    <button
                        className="btn-icon"
                        onClick={() => setIsCartOpen(true)}
                        style={{
                            width: 56, height: 56,
                            background: "var(--bg-raised)",
                            color: "var(--primary-400)",
                            border: "1px solid var(--primary-500)",
                            position: "relative"
                        }}
                    >
                        <ShoppingBag size={28} />
                        {cartItemCount > 0 && (
                            <div style={{
                                position: "absolute",
                                top: -5, right: -5,
                                background: "var(--red-500)",
                                color: "white",
                                width: 24, height: 24,
                                borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.75rem", fontWeight: "bold",
                                border: "2px solid var(--bg-surface)"
                            }}>
                                {cartItemCount}
                            </div>
                        )}
                    </button>
                </div>

                {/* Personalization Section */}
                {selectedCategory === "All" && (
                    <div className="card" style={{ marginBottom: "2rem", border: "1px solid rgba(16, 185, 129, 0.3)", background: "var(--primary-dim)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--primary-400)", marginBottom: "1rem" }}>
                            <TrendingUp size={20} />
                            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Recommended for {userGoal}</h2>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                            {products.filter(p => p.fitFor?.includes(userGoal) || p.fitFor?.includes("General")).slice(0, 3).map(p => (
                                <div key={`rec-${p.id}`} className="card" style={{ padding: "0.75rem", minWidth: 240, display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <img src={p.image} alt={p.name} style={{ width: 64, height: 64, borderRadius: "0.5rem", objectFit: "cover" }} />
                                    <div>
                                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{p.name}</div>
                                        <div style={{ color: "var(--primary-400)", fontWeight: 700 }}>{p.displayPrice}</div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: "0.5rem", marginLeft: "auto", borderRadius: "0.5rem" }}
                                        onClick={() => addToCart(p)}
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Controls Section */}
                <div className="card" style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                        {/* Category Filter */}
                        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", flex: 1 }}>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`btn ${selectedCategory === cat ? "btn-primary" : "btn-ghost"}`}
                                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", borderRadius: "99px", flexShrink: 0 }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Sort Control */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Filter size={14} /> Sort:
                            </span>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="input"
                                style={{ padding: "0.4rem 0.75rem", fontSize: "0.8125rem", minWidth: "140px" }}
                            >
                                <option value="none">Featured</option>
                                <option value="lowToHigh">Price: Low to High</option>
                                <option value="highToLow">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "1.5rem"
                }}>
                    {filteredProducts.map(product => (
                        <div key={product.id} className="card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                            {/* Product Image */}
                            <div style={{
                                width: "100%",
                                height: "200px",
                                background: `url(${product.image})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                position: "relative"
                            }}>
                                {product.originalPrice && (
                                    <div style={{
                                        position: "absolute", top: "1rem", right: "1rem",
                                        background: "var(--red-500)", color: "white",
                                        padding: "0.25rem 0.75rem", borderRadius: "99px",
                                        fontSize: "0.75rem", fontWeight: 700,
                                        boxShadow: "var(--shadow-md)"
                                    }}>
                                        SALE
                                    </div>
                                )}
                            </div>

                            {/* Product Info */}
                            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
                                {/* Category */}
                                <div style={{ fontSize: "0.75rem", color: "var(--primary-500)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                    {product.category}
                                </div>

                                {/* Name */}
                                <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem", minHeight: "3rem" }}>
                                    {product.name}
                                </h3>

                                {/* Rating */}
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                                    <div style={{ color: "var(--amber-400)", fontSize: "0.875rem", fontWeight: 700 }}>
                                        ★ {product.rating}
                                    </div>
                                    <div style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                                        ({product.reviews.toLocaleString()} reviews)
                                    </div>
                                </div>

                                {/* Price & Buy */}
                                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-400)" }}>
                                            {product.displayPrice}
                                        </div>
                                        {product.originalPrice && (
                                            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                                                {product.originalPrice}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => addToCart(product)}
                                        className="btn btn-primary"
                                        style={{ padding: "0.6rem 1rem", borderRadius: "1rem", display: "flex", gap: "0.5rem" }}
                                    >
                                        <ShoppingBag size={18} /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* No products message */}
                {filteredProducts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)", fontSize: "1.1rem" }}>
                        No products found in this category
                    </div>
                )}
            </div>

            {/* Shopping Cart Drawer */}
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            style={{ position: "fixed", inset: 0, background: "var(--bg-overlay)", backdropFilter: "blur(4px)", zIndex: 1000 }}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            style={{
                                position: "fixed", top: 0, right: 0, bottom: 0,
                                width: "100%", maxWidth: "420px",
                                background: "var(--bg-raised)",
                                borderLeft: "1px solid var(--border-subtle)",
                                zIndex: 1001,
                                display: "flex", flexDirection: "column",
                                padding: "1.5rem",
                                boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                                    <ShoppingCart size={24} color="var(--primary-400)" />
                                    Your Cart
                                </h2>
                                <button className="btn-icon" onClick={() => setIsCartOpen(false)} style={{ background: "transparent" }}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {cart.length === 0 ? (
                                    <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "2rem" }}>
                                        <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: "1rem", margin: "0 auto" }} />
                                        Your cart is empty
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} style={{ display: "flex", gap: "1rem", background: "var(--bg-surface)", padding: "0.75rem", borderRadius: "1rem", border: "1px solid var(--border-subtle)" }}>
                                            <img src={item.image} alt={item.name} style={{ width: 64, height: 64, borderRadius: "0.5rem", objectFit: "cover" }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ color: "var(--primary-400)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                                                    ${(item.price * item.qty).toFixed(2)}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", background: "var(--bg-raised)", borderRadius: "2rem" }}>
                                                        <button onClick={() => updateQuantity(item.id, -1)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", padding: "0.25rem 0.5rem", cursor: "pointer" }}>
                                                            <Minus size={14} />
                                                        </button>
                                                        <span style={{ fontSize: "0.9rem", width: "1.5rem", textAlign: "center", fontWeight: 600 }}>{item.qty}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", padding: "0.25rem 0.5rem", cursor: "pointer" }}>
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Checkout Section */}
                            {cart.length > 0 && (
                                <div style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--border-subtle)", marginTop: "1rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
                                        <span>Subtotal</span>
                                        <span>${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", color: "var(--text-secondary)" }}>
                                        <span>Shipping</span>
                                        <span>$5.00</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>
                                        <span>Total</span>
                                        <span style={{ color: "var(--primary-400)" }}>${(cartTotal + 5).toFixed(2)}</span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="btn btn-primary"
                                        style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mock Checkout Flow Overlay */}
            <AnimatePresence>
                {checkoutFlow !== "inactive" && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: "fixed", inset: 0, background: "var(--bg-overlay)", backdropFilter: "blur(10px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="card"
                            style={{ textAlign: "center", padding: "3rem", maxWidth: 400, width: "90%" }}
                        >
                            {checkoutFlow === "active" ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid var(--primary-dim)", borderTopColor: "var(--primary-500)", animation: "spin 1s linear infinite" }} />
                                    <h2 style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>Processing Payment...</h2>
                                    <p style={{ color: "var(--text-muted)" }}>Secure checkout in progress</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
                                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--primary-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-500)" }}>
                                        <CheckCircle size={48} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: "1.75rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Order Confirmed!</h2>
                                        <p style={{ color: "var(--text-secondary)" }}>Your order is on its way. Expect delivery soon.</p>
                                    </div>
                                    <button className="btn btn-primary" onClick={() => { setCheckoutFlow("inactive"); setIsCartOpen(false); }} style={{ width: "100%" }}>
                                        Continue Shopping
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

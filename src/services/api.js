const API_URL = import.meta.env.VITE_API_URL || "/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && token !== "null" && token !== "undefined" && { Authorization: `Bearer ${token}` })
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const signupUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Signup failed");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Profile API methods
export const getProfile = async () => {
  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch profile");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_URL}/user/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update profile");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Diet Plan API methods
export const createDietPlan = async (planData) => {
  try {
    const response = await fetch(`${API_URL}/diet`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(planData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create diet plan");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const getDietPlan = async () => {
  try {
    const response = await fetch(`${API_URL}/diet`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch diet plan");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Food Log API methods
export const logFood = async (date, food) => {
  try {
    const response = await fetch(`${API_URL}/food`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ date, food }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to log food");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const getFoodLog = async (date) => {
  try {
    const response = await fetch(`${API_URL}/food/${date}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch food log");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Progress API methods
export const getProgress = async (date) => {
  try {
    const response = await fetch(`${API_URL}/progress/${date}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch progress");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const updateProgress = async (date, progressData) => {
  try {
    const response = await fetch(`${API_URL}/progress/${date}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(progressData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update progress");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const getProgressRange = async (startDate, endDate) => {
  try {
    const response = await fetch(`${API_URL}/progress/range/${startDate}/${endDate}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch progress range");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Product API methods
export const getProducts = async () => {
  try {
    const response = await fetch(`${API_URL}/products`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch products");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Gym API methods
export const getNearbyGyms = async (latitude, longitude) => {
  try {
    const response = await fetch(`${API_URL}/gyms/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch nearby gyms");
    }

    return data;
  } catch (error) {
    throw error;
  }
};
// AI API methods
export const getInsight = async () => {
  try {
    const response = await fetch(`${API_URL}/ai/insight`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch insight");
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// --- Subscription/Razorpay ---
export const fetchSubscriptionStatus = async () => {
  const response = await fetch(`${API_URL}/subscription/status`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const createCheckoutSession = async (planTier) => {
  const response = await fetch(`${API_URL}/subscription/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ planTier }),
  });
  return handleResponse(response);
};

export const cancelSubscription = async () => {
  const response = await fetch(`${API_URL}/subscription/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const activateTrial = async () => {
  const response = await fetch(`${API_URL}/subscription/trial`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const verifySubscriptionPayment = async (verificationData) => {
  const response = await fetch(`${API_URL}/subscription/verify`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(verificationData),
  });
  return handleResponse(response);
};

// Prediction API
export const getPredictionData = async (days = 90) => {
  try {
    const response = await fetch(`${API_URL}/prediction/forecast?days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch prediction data');
    return data;
  } catch (error) {
    throw error;
  }
};

// Vision / Food Image Recognition API
export const analyzeFood = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/vision/analyze`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Vision analysis failed');
    return data;
  } catch {
    // Graceful client-side fallback when server is unreachable
    const { analyzeImageFile } = await import('../utils/foodVisionEngine.js');
    return analyzeImageFile(imageFile);
  }
};

// ─────────────────────────────────────────────
// Fitness Score API
// ─────────────────────────────────────────────

/** Fetch today's fitness score (returns cached if fresh, else recalculates). */
export const getFitnessScore = async () => {
  const response = await fetch(`${API_URL}/score/current`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/** Force-recalculate today's score (call after logging workout/nutrition). */
export const recalculateFitnessScore = async () => {
  const response = await fetch(`${API_URL}/score/calculate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/** Fetch score history for trend chart. days defaults to 30. */
export const getFitnessScoreHistory = async (days = 30) => {
  const response = await fetch(`${API_URL}/score/history?days=${days}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// ─────────────────────────────────────────────
// Twin API
// ─────────────────────────────────────────────

export const getTwin = async () => {
  const response = await fetch(`${API_URL}/twin`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const learnTwin = async () => {
  const response = await fetch(`${API_URL}/twin/learn`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// ─────────────────────────────────────────────
// Exercise History API (Gym)
// ─────────────────────────────────────────────

export const saveExerciseHistory = async (historyData) => {
  const response = await fetch(`${API_URL}/gyms/history`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(historyData),
  });
  return handleResponse(response);
};

export const getExerciseHistory = async () => {
  const response = await fetch(`${API_URL}/gyms/history`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

// --- AI NUTRITION ENGINE ---

export const generateAIDietPlan = async (data) => {
    const res = await fetch(`${API_URL}/ai/generate-diet`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to generate AI diet plan");
    return res.json();
};

export const swapAIDietMeal = async (data) => {
    const res = await fetch(`${API_URL}/ai/swap-food`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to swap food item");
    return res.json();
};

// --- AI COACH RAG ENGINE ---

export const sendCoachMessage = async (message, history = []) => {
    // Check if device is completely offline before trying
    if (!navigator.onLine) {
        throw new Error("You are currently offline. Please connect to the internet to chat with the AI Coach.");
    }
    
    try {
        const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ message, history })
        });
        
        return await handleResponse(response);
    } catch (error) {
        // Fallback for timeout or other network errors specifically
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error("Network error. The AI Coach requires an internet connection.");
        }
        throw error;
    }
};

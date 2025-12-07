const API_URL = "http://localhost:5001/api";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` })
  };
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

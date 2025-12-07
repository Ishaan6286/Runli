import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import BmiCalculator from "./components/BmiCalculator";
import FoodLog from "./components/FoodLog";
import AboutRunli from "./components/AboutRunli";
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import UserInfo from "./components/UserInfo";
import Dashboard from "./pages/Dashboard";
import PlanPage from "./pages/PlanPage";
import VideoDashboard from "./pages/VideoDashboard";
import DietPlan from "./pages/DietPlan";
import NearbyGyms from "./components/NearbyGyms";
import GymMode from "./pages/GymMode";
import Shopping from "./pages/Shopping";
import ShoppingPreview from "./components/ShoppingPreview";
import AuthCallback from "./pages/AuthCallback";
import Chatbot from "./components/Chatbot";
import HabitTracker from "./pages/HabitTracker";
import { ToastProvider } from "./context/ToastContext";

const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  // Header logic from original: likely hidden on dashboard/login/signup?
  // But Header.jsx itself has logic to hide buttons. 
  // Let's assume Header is always rendered but handles its own visibility props/logic or just floats on top.
  // Actually, checking Header.jsx again, it just renders the container. 
  // Let's mimic the modern Layout but with Header.

  return (
    <div className="app-container">
      <Header />
      <main>
        {children}
      </main>
      <Chatbot />
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            <Route
              path="/"
              element={
                <div style={{ paddingBottom: "100px" }}>
                  <Hero />
                  <section id="features">
                    <BmiCalculator />
                  </section>
                  <FoodLog />
                  <NearbyGyms />
                  <ShoppingPreview />
                  <AboutRunli />
                </div>

              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/userinfo" element={<UserInfo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/videos" element={<VideoDashboard />} />
            <Route path="/diet-plan" element={<DietPlan />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/gym-mode" element={<GymMode />} />
            <Route path="/habits" element={<HabitTracker />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </LayoutWrapper>
      </Router>
    </ToastProvider>
  );
}

export default App;

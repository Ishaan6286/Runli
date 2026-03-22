import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppBackground from "./components/layout/AppBackground";
import BottomNav from "./components/layout/BottomNav";

// ── New OS tab pages ──────────────────────────────────
import Today    from "./pages/Today";
import Progress from "./pages/Progress";
import Plan     from "./pages/Plan";
import Gym      from "./pages/Gym";
import Profile  from "./pages/Profile";

// ── Wellness page ─────────────────────────────────────
import Wellness from "./pages/Wellness";

// ── Auth + onboarding ─────────────────────────────────
import Hero           from "./components/Hero";
import Login          from "./components/Login";
import Signup         from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import UserInfo       from "./components/UserInfo";
import AuthCallback   from "./pages/AuthCallback";

// ── Legacy pages (still reachable via old URLs) ───────
import Dashboard     from "./pages/Dashboard";
import DietPlan      from "./pages/DietPlan";
import GymMode       from "./pages/GymMode";
import HabitTracker  from "./pages/HabitTracker";
import PlanPage      from "./pages/PlanPage";
import VideoDashboard from "./pages/VideoDashboard";
import Shopping      from "./pages/Shopping";
import Eat           from "./pages/Eat";
import Analytics     from "./pages/Analytics";
import AdminAnalytics from "./pages/AdminAnalytics";
import Upgrade       from "./pages/Upgrade";
import { ProUpgradeModal } from "./components/ProGate.jsx";

import Chatbot from "./components/Chatbot";
import { ToastProvider } from "./context/ToastContext";
import { PersonalizationProvider } from "./context/PersonalizationContext"; // <-- Added PersonalizationProvider

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing + auth */}
        <Route path="/"                element={<Hero />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/userinfo"        element={<UserInfo />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />

        {/* ── Primary OS routes ── */}
        <Route path="/today"    element={<Today />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/plan"     element={<Plan />} />
        <Route path="/gym"      element={<Gym />} />
        <Route path="/profile"  element={<Profile />} />
        <Route path="/wellness" element={<Wellness />} />

        {/* ── Legacy redirects ── */}
        <Route path="/dashboard"  element={<Today />} />
        <Route path="/diet-plan"  element={<DietPlan />} />
        <Route path="/gym-mode"   element={<GymMode />} />
        <Route path="/habits"     element={<HabitTracker />} />
        <Route path="/videos"     element={<VideoDashboard />} />
        <Route path="/shopping"   element={<Shopping />} />
        <Route path="/me"         element={<Profile />} />
        <Route path="/eat"        element={<Eat />} />
        <Route path="/train"      element={<GymMode />} />
        <Route path="/analytics"        element={<Analytics />} />
        <Route path="/admin/analytics"  element={<AdminAnalytics />} />
        <Route path="/upgrade"          element={<Upgrade />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ToastProvider>
      <PersonalizationProvider>
        <Router>
          <AppBackground />
          <AnimatedRoutes />
          <BottomNav />
          <Chatbot />
          <ProUpgradeModal />
        </Router>
      </PersonalizationProvider>
    </ToastProvider>
  );
}

export default App;

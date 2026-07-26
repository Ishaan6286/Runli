import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppBackground from "./components/layout/AppBackground";
import BottomNav from "./components/layout/BottomNav";
import { useAuth } from "./context/AuthContext";

// ── New OS tab pages ──────────────────────────────────
import Today    from "./pages/Today";
import Progress from "./pages/Progress";
import Plan     from "./pages/Plan";
import Gym      from "./pages/Gym";
import Profile  from "./pages/MePage";

// ── Wellness page ─────────────────────────────────────
import Wellness from "./pages/Wellness";
import AICoach from "./pages/AICoach";

// ── Auth + onboarding ─────────────────────────────────
import Hero           from "./components/Hero";
import Login          from "./components/Login";
import Signup         from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";
import UserInfo       from "./components/UserInfo";
import AuthCallback   from "./pages/AuthCallback";

// ── Legacy pages ───────
import Dashboard     from "./pages/Dashboard";
import DietPlan      from "./pages/DietPlan";
import GymMode       from "./pages/GymMode";
import HabitTracker  from "./pages/HabitTracker";
import PlanPage      from "./pages/PlanPage";
import VideoDashboard from "./pages/VideoDashboard";
import Eat           from "./pages/Eat";
import Analytics     from "./pages/Analytics";
import AdminAnalytics from "./pages/AdminAnalytics";
import Upgrade       from "./pages/Upgrade";
import WorkoutEditor    from "./pages/WorkoutEditor";
import NotificationSettings from "./pages/NotificationSettings";
import NotificationCenter from "./pages/NotificationCenter";
import WorkoutScheduleSettings from "./pages/WorkoutScheduleSettings";
import ExploreVideos from "./pages/ExploreVideos";
import { ProUpgradeModal } from "./components/ProGate.jsx";
import AchievementToast from "./components/AchievementToast";

import BmiCalculator from "./components/BmiCalculator";
import { ToastProvider } from "./context/ToastContext";
import { PersonalizationProvider } from "./context/PersonalizationContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Route guard requiring authentication
const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Marketing Landing & Auth routes */}
        <Route path="/"                element={<Hero />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/callback"   element={<AuthCallback />} />
        <Route path="/bmi"             element={<BmiCalculator />} />

        {/* ── Primary Protected OS routes ── */}
        <Route path="/today"    element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/plan"     element={<ProtectedRoute><Plan /></ProtectedRoute>} />
        <Route path="/gym"      element={<ProtectedRoute><Gym /></ProtectedRoute>} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wellness" element={<ProtectedRoute><Wellness /></ProtectedRoute>} />
        <Route path="/coach"    element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
        <Route path="/userinfo" element={<ProtectedRoute><UserInfo /></ProtectedRoute>} />

        {/* ── Protected Secondary & Legacy routes ── */}
        <Route path="/dashboard"        element={<ProtectedRoute><Today /></ProtectedRoute>} />
        <Route path="/diet-plan"        element={<ProtectedRoute><DietPlan /></ProtectedRoute>} />
        <Route path="/gym-mode"         element={<ProtectedRoute><GymMode /></ProtectedRoute>} />
        <Route path="/habits"           element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
        <Route path="/videos"           element={<ProtectedRoute><VideoDashboard /></ProtectedRoute>} />
        <Route path="/me"               element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/eat"              element={<ProtectedRoute><Eat /></ProtectedRoute>} />
        <Route path="/train"            element={<ProtectedRoute><GymMode /></ProtectedRoute>} />
        <Route path="/analytics"        element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/admin/analytics"  element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/upgrade"          element={<ProtectedRoute><Upgrade /></ProtectedRoute>} />
        <Route path="/workout-editor"   element={<ProtectedRoute><WorkoutEditor /></ProtectedRoute>} />
        <Route path="/explore"          element={<ProtectedRoute><ExploreVideos /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
        <Route path="/settings/schedule"      element={<ProtectedRoute><WorkoutScheduleSettings /></ProtectedRoute>} />
        <Route path="/notifications"    element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
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
          <ErrorBoundary>
            <AnimatedRoutes />
          </ErrorBoundary>
          <BottomNav />
          <ProUpgradeModal />
          <AchievementToast />
        </Router>
      </PersonalizationProvider>
    </ToastProvider>
  );
}

export default App;

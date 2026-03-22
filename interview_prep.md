# Runli - Technical Interview Preparation Document

## 1. Project Overview
**Name:** Runli
**Description:** A comprehensive fitness and lifestyle companion application designed to help users track habits, monitor nutrition, and improve their overall wellness through AI-driven insights.
**Type:** Full-Stack Web Application (MERN Stack) with Progressive Web App (PWA) capabilities.

## 2. Technology Stack

### Frontend
- **Framework:** React.js (v19) with Vite (for fast build and HMR).
- **Styling:** Tailwind CSS (for utility-first styling), Framer Motion (for smooth animations).
- **State Management:** React Context API (inferred from `src/context`).
- **Routing:** React Router DOM (v7).
- **Data Visualization:** Recharts (for progress charts and analytics).
- **HTTP Client:** Axios.

### Backend
- **Runtime:** Node.js.
- **Framework:** Express.js.
- **Authentication:** Passport.js (Google OAuth 2.0Strategy), JWT (JSON Web Tokens), bcryptjs (password hashing).
- **AI Integration:** Google Generative AI SDK (Gemini API).

### Database
- **Database:** MongoDB (NoSQL).
- **ODM:** Mongoose (for schema modeling).

### Tools & DevOps
- **Version Control:** Git.
- **Linting:** ESLint.
- **PWA:** `vite-plugin-pwa` (offline capabilities, installable app).

## 3. Key Features & Technical Details

### A. Authentication & User Management
- **Secure Login:** Implements standard Email/Password login with `bcrypt` encryption and Google OAuth via Passport.js.
- **Session Management:** Uses JWT for stateless authentication or Express Sessions for session-based auth (check implementation details).
- **Profile:** Stores user BMI, weight, and fitness goals.

### B. Habit & Health Tracking
- **Habit System:** Users can CRUD (Create, Read, Update, Delete) habits.
- **Tracking Logic:** Habits are logged in `HabitLog` collection to track streaks and daily completion.
- **Food Logging:** Features a `FoodLog` system to track daily caloric intake and macros.
- **BMI Calculator:** Interactive React component for real-time BMI calculation.

### C. AI Integration (Chatbot)
- **Role:** Acts as a personalized fitness coach.
- **Tech:** Google Gemini API (`@google/generative-ai`).
- **Function:** Processes natural language queries about workouts, diet, and health tips.

### D. Location Services
- **Nearby Gyms:** Integrates with mapping services (likely implemented in `NearbyGyms.jsx`) to find local fitness centers.

### E. E-Commerce (Shopping)
- **Product Store:** Includes a secure product listing (`Product` model) for fitness gear/supplements.

## 4. Architecture
- **Client-Server Architecture:** Decoupled Frontend and Backend.
- **RESTful API:** The backend exposes REST endpoints (`/routes`) consumed by the React frontend.
- **Component-Based:** Frontend is modularized into reusable components (Header, Toast, specific feature components).

## 5. Potential Technical Challenges & Talking Points

-   **State Management:** Handling global user state (auth status) and data across multiple components using Context API to avoid prop drilling.
-   **AI Latency:** Managing the asynchronous nature of AI API calls and showing generic loading states to improve User Experience (UX).
-   **Responsive Design:** Using Tailwind's responsive prefixes (`md:`, `lg:`) to ensure the app works seamlessly on Mobile and Desktop.
-   **Data security:** Hashing passwords before storage and protecting API routes with middleware.

## 6. Future Improvements (For "What would you do next?" questions)
-   **Real-time Features:** Adding WebSockets (Socket.io) for live coaching or community chat.
-   **Advanced Analytics:** Machine Learning models to predict user burnout or suggest habit adjustments.
-   **Mobile App:** converting the PWA to a Native React Native app.

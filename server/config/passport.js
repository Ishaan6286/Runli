import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5001/api/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;

            // Check if user already exists — if so, ensure onboarding is marked complete
            // so existing users are never sent back to the onboarding wizard.
            let user = await User.findOne({ email });

            if (user) {
                // If this is an existing user who somehow doesn't have onboardingCompleted
                // set (e.g. legacy account), fix it silently so the frontend routes to /today.
                if (!user.onboardingCompleted) {
                    user = await User.findByIdAndUpdate(
                        user._id,
                        { $set: { onboardingCompleted: true } },
                        { new: true }
                    );
                }
                return done(null, user);
            }

            // New user — create account. onboardingCompleted defaults to false,
            // so the frontend will correctly route them to /userinfo.
            user = await User.create({
                name: profile.displayName,
                email,
                password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
            });

            return done(null, user);
        } catch (err) {
            console.error("Google Auth Error:", err);
            return done(err, null);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;

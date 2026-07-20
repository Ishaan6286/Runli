import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import ExerciseHistory from '../models/ExerciseHistory.js';

const router = express.Router();

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(1); // Return distance in km with 1 decimal
}

// POST /api/gyms/nearby
router.post('/nearby', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
            // Return mock data if API key is not configured
            console.log('Google Maps API key not configured, returning mock data');
            return res.json(getMockGyms(latitude, longitude));
        }

        // Call Google Places API (Legacy) - Nearby Search
        const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

        const response = await axios.get(url, {
            params: {
                location: `${latitude},${longitude}`,
                radius: 5000, // 5km radius
                type: 'gym',
                key: apiKey
            }
        });

        if (!response.data.results || response.data.results.length === 0) {
            return res.json({ gyms: [], message: 'No gyms found nearby' });
        }

        // Format the response
        const gyms = response.data.results.map(place => {
            const distance = calculateDistance(
                latitude,
                longitude,
                place.geometry.location.lat,
                place.geometry.location.lng
            );

            // Estimate fees based on price level (if available)
            let fees = 'Contact for pricing';
            if (place.price_level !== undefined) {
                const priceMap = {
                    0: 'Free',
                    1: '₹1,500-2,000/month',
                    2: '₹2,000-3,000/month',
                    3: '₹3,000-4,500/month',
                    4: '₹4,500+/month'
                };
                fees = priceMap[place.price_level] || fees;
            }

            return {
                name: place.name || 'Unnamed Gym',
                address: place.vicinity || 'Address not available',
                rating: place.rating || 0,
                distance: `${distance} km`,
                distanceValue: parseFloat(distance), // For sorting
                reviews: place.user_ratings_total || 0,
                fees: fees,
                place_id: place.place_id,
                location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                }
            };
        });

        // Sort by distance
        gyms.sort((a, b) => a.distanceValue - b.distanceValue);

        // Remove distanceValue from response
        const cleanedGyms = gyms.map(({ distanceValue, ...gym }) => gym);

        res.json({ gyms: cleanedGyms });

    } catch (error) {
        console.error('Google Places API Error:', error.response?.data || error.message);

        // If API fails, return mock data as fallback
        if (req.body.latitude && req.body.longitude) {
            return res.json(getMockGyms(req.body.latitude, req.body.longitude));
        }

        res.status(500).json({
            message: 'Failed to fetch nearby gyms',
            error: error.message
        });
    }
});

// Mock data function for when API key is not available
function getMockGyms(lat, lng) {
    return {
        gyms: [
            {
                name: "Gold's Gym",
                distance: "0.8 km",
                rating: 4.5,
                fees: "₹2,500/month",
                address: "Sector 18, Near Metro Station",
                reviews: 342,
                place_id: "mock_1",
                location: { lat: lat + 0.005, lng: lng + 0.005 }
            },
            {
                name: "Fitness First",
                distance: "1.2 km",
                rating: 4.3,
                fees: "₹3,000/month",
                address: "MG Road, City Center",
                reviews: 256,
                place_id: "mock_2",
                location: { lat: lat + 0.008, lng: lng + 0.008 }
            },
            {
                name: "Anytime Fitness",
                distance: "1.5 km",
                rating: 4.7,
                fees: "₹3,500/month",
                address: "Connaught Place",
                reviews: 489,
                place_id: "mock_3",
                location: { lat: lat + 0.012, lng: lng + 0.012 }
            },
            {
                name: "Cult.fit",
                distance: "2.1 km",
                rating: 4.4,
                fees: "₹2,800/month",
                address: "Nehru Place",
                reviews: 198,
                place_id: "mock_4",
                location: { lat: lat + 0.015, lng: lng + 0.015 }
            }
        ],
        isMockData: true
    };
}

// POST /api/gym/history
router.post('/history', authenticateToken, async (req, res) => {
    try {
        const { exerciseName, reps, formScore } = req.body;
        const newEntry = new ExerciseHistory({
            userId: req.user.userId,
            exerciseName,
            reps,
            formScore
        });
        await newEntry.save();

        // --- RAG INGESTION (Fire and forget) ---
        import('../services/ragService.js').then(({ ingestWorkout }) => {
            const dateStr = new Date().toISOString().slice(0, 10);
            ingestWorkout(req.user.userId, dateStr, newEntry._id, exerciseName, reps, formScore);
        }).catch(err => console.error("Failed to load ragService:", err));

        res.status(201).json({ message: 'History saved successfully', entry: newEntry });
    } catch (error) {
        console.error('Error saving exercise history:', error);
        res.status(500).json({ message: 'Error saving history' });
    }
});

// GET /api/gym/history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const history = await ExerciseHistory.find({ userId: req.user.userId }).sort({ date: -1 }).limit(100);
        res.json({ history });
    } catch (error) {
        console.error('Error fetching exercise history:', error);
        res.status(500).json({ message: 'Error fetching history' });
    }
});

export default router;

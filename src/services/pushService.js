// src/services/pushService.js
import { getAuthHeaders } from './api.js';

const API_URL = import.meta.env.VITE_API_URL || "/api";
const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Push Notifications are supported
 */
export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Subscribes the user to Push Notifications and sends the subscription to the server.
 */
export const subscribeUserToPush = async () => {
    if (!isPushSupported()) throw new Error('Push not supported');

    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check existing subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
            // Subscribe via pushManager
            const convertedVapidKey = urlBase64ToUint8Array(PUBLIC_KEY);
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });
        }

        // Send to backend
        const response = await fetch(`${API_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ subscription })
        });

        if (!response.ok) {
            throw new Error('Failed to send subscription to server');
        }

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe user:', error);
        throw error;
    }
};

/**
 * Unsubscribes the user and tells the backend.
 */
export const unsubscribeUserFromPush = async () => {
    if (!isPushSupported()) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            
            await fetch(`${API_URL}/notifications/unsubscribe`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        }
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
        throw error;
    }
};

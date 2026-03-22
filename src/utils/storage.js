/**
 * storage.js — Hybrid Storage Utility
 * Uses Capacitor Preferences on native devices (iOS/Android),
 * falls back to standard localStorage on Web/PWA.
 */
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Store a value in hybrid storage.
 * @param {string} key 
 * @param {any} value - will be JSON.stringified
 */
export async function setStorage(key, value) {
  try {
    const stringValue = JSON.stringify(value);
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: stringValue });
    } else {
      localStorage.setItem(key, stringValue);
    }
  } catch (error) {
    console.warn(`Error setting storage for key ${key}:`, error);
  }
}

/**
 * Retrieve a value from hybrid storage.
 * @param {string} key 
 * @returns {any} parsed JSON value or null
 */
export async function getStorage(key) {
  try {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    }
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (error) {
    console.warn(`Error getting storage for key ${key}:`, error);
    return null;
  }
}

/**
 * Remove a value from hybrid storage.
 * @param {string} key 
 */
export async function removeStorage(key) {
  try {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn(`Error removing storage for key ${key}:`, error);
  }
}

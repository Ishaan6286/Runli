/**
 * storage.js — Web Storage Utility
 * Uses standard localStorage for the PWA web app.
 */

/**
 * Store a value in web storage.
 * @param {string} key 
 * @param {any} value - will be JSON.stringified
 */
export async function setStorage(key, value) {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (error) {
    console.warn(`Error setting storage for key ${key}:`, error);
  }
}

/**
 * Retrieve a value from web storage.
 * @param {string} key 
 * @returns {any} parsed JSON value or null
 */
export async function getStorage(key) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (error) {
    console.warn(`Error getting storage for key ${key}:`, error);
    return null;
  }
}

/**
 * Remove a value from web storage.
 * @param {string} key 
 */
export async function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing storage for key ${key}:`, error);
  }
}

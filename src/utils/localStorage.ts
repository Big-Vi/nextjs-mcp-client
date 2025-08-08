/**
 * Utility functions for safe localStorage operations in Next.js
 * Handles SSR/client-side rendering differences
 */

/**
 * Safely get an item from localStorage
 * Returns null if localStorage is not available or key doesn't exist
 */
export function getLocalStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Safely set an item in localStorage
 * Returns true if successful, false otherwise
 */
export function setLocalStorageItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * Returns true if successful, false otherwise
 */
export function removeLocalStorageItem(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

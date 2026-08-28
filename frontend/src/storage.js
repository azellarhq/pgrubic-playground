// Storage operations

/*
 * Reads a value from localStorage.
 * @param {string} key - The key of the value to read.
 * @returns {string|null} - The value associated with the key, or null if not found or an error occurred.
 */
function readStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/*
 * Writes a value to localStorage.
 * @param {string} key - The key of the value to write.
 * @param {string} value - The value to write.
 * @returns {boolean} - True if the value was written successfully, false otherwise.
 */
function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/*
 * Removes a value from localStorage.
 * @param {string} key - The key of the value to remove.
 */
function removeStoredValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage is optional; the calling action must still succeed.
  }
}

export { readStoredValue, writeStoredValue, removeStoredValue };

/**
 * Password Hashing Module
 * Uses Web Crypto API for Cloudflare Workers compatibility
 *
 * Security features:
 * - PBKDF2 with SHA-256 for key derivation
 * - Random salt per password
 * - Configurable iterations (default 100,000)
 * - Timing-safe comparison
 */

const ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const ITERATIONS = 100000;
const KEY_LENGTH = 256; // bits
const SALT_LENGTH = 16; // bytes

/**
 * Generate a cryptographically secure random salt
 * @returns {Uint8Array} - Random salt bytes
 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Convert Uint8Array to hex string
 * @param {Uint8Array} bytes - Bytes to convert
 * @returns {string} - Hex string
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 * @param {string} hex - Hex string to convert
 * @returns {Uint8Array} - Bytes
 */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Derive a key from password and salt using PBKDF2
 * @param {string} password - Plain text password
 * @param {Uint8Array} salt - Salt bytes
 * @returns {Promise<ArrayBuffer>} - Derived key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    ALGORITHM,
    false,
    ['deriveBits']
  );

  return crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM
    },
    passwordKey,
    KEY_LENGTH
  );
}

/**
 * Hash a password with a random salt
 * Returns format: salt:hash (both in hex)
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password in format "salt:hash"
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const salt = generateSalt();
  const derivedKey = await deriveKey(password, salt);
  const hash = new Uint8Array(derivedKey);

  return `${bytesToHex(salt)}:${bytesToHex(hash)}`;
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 *
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash in format "salt:hash"
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  // Handle plain text passwords during migration period
  // TODO: Remove this fallback after all passwords are hashed
  if (!storedHash.includes(':')) {
    // This is a plain text password (legacy)
    // Use timing-safe comparison for plain text
    return timingSafeEqual(password, storedHash);
  }

  try {
    const [saltHex, hashHex] = storedHash.split(':');
    if (!saltHex || !hashHex) {
      return false;
    }

    const salt = hexToBytes(saltHex);
    const storedHashBytes = hexToBytes(hashHex);

    const derivedKey = await deriveKey(password, salt);
    const computedHash = new Uint8Array(derivedKey);

    // Timing-safe comparison
    return timingSafeEqual(
      bytesToHex(computedHash),
      bytesToHex(storedHashBytes)
    );
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings are equal
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Ensure constant-time comparison regardless of string length
  const maxLength = Math.max(a.length, b.length);
  let result = a.length === b.length ? 0 : 1;

  for (let i = 0; i < maxLength; i++) {
    const charA = a.charCodeAt(i) || 0;
    const charB = b.charCodeAt(i) || 0;
    result |= charA ^ charB;
  }

  return result === 0;
}

/**
 * Check if a stored password is already hashed
 * @param {string} storedPassword - Stored password string
 * @returns {boolean} - True if password is hashed (contains salt:hash format)
 */
export function isPasswordHashed(storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') {
    return false;
  }

  // Hashed passwords have format: salt(32 hex chars):hash(64 hex chars)
  const parts = storedPassword.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [salt, hash] = parts;
  // Salt is 16 bytes = 32 hex chars, hash is 32 bytes = 64 hex chars
  return salt.length === 32 && hash.length === 64 && /^[a-f0-9]+$/.test(salt) && /^[a-f0-9]+$/.test(hash);
}

// Export for testing
export { timingSafeEqual, bytesToHex, hexToBytes };

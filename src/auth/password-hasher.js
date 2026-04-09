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
const ITERATIONS = 600000; // v16.0.0 (L1): NIST SP 800-63B recommends 600,000+
const LEGACY_ITERATIONS = 100000; // Pre-v16.0.0 hash format
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
 * @param {number} iterations - PBKDF2 iteration count
 * @returns {Promise<ArrayBuffer>} - Derived key
 */
async function deriveKey(password, salt, iterations = ITERATIONS) {
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
      iterations: iterations,
      hash: HASH_ALGORITHM
    },
    passwordKey,
    KEY_LENGTH
  );
}

/**
 * Hash a password with a random salt
 * v16.0.0: Format "iterations:salt:hash" (e.g., "600000:abcd...:ef01...")
 * Legacy format "salt:hash" assumed 100,000 iterations
 *
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password in format "iterations:salt:hash"
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const salt = generateSalt();
  const derivedKey = await deriveKey(password, salt, ITERATIONS);
  const hash = new Uint8Array(derivedKey);

  return `${ITERATIONS}:${bytesToHex(salt)}:${bytesToHex(hash)}`;
}

/**
 * Verify a password against a stored hash
 * Uses timing-safe comparison to prevent timing attacks
 *
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash in format "salt:hash"
 * @returns {Promise<boolean>} - True if password matches
 */
/**
 * Parse stored hash into components.
 * Supports v16.0.0 format "iterations:salt:hash" and legacy "salt:hash".
 * @param {string} storedHash
 * @returns {{ iterations: number, saltHex: string, hashHex: string, needsRehash: boolean } | null}
 */
function parseStoredHash(storedHash) {
  const parts = storedHash.split(':');

  if (parts.length === 3) {
    // v16.0.0 format: iterations:salt:hash
    const iterations = parseInt(parts[0], 10);
    if (isNaN(iterations) || iterations < 1000) return null;
    return {
      iterations,
      saltHex: parts[1],
      hashHex: parts[2],
      needsRehash: iterations < ITERATIONS
    };
  }

  if (parts.length === 2) {
    // Legacy format: salt:hash (assumed 100,000 iterations)
    return {
      iterations: LEGACY_ITERATIONS,
      saltHex: parts[0],
      hashHex: parts[1],
      needsRehash: true
    };
  }

  return null;
}

export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  if (!storedHash.includes(':')) {
    console.warn('SECURITY_ALERT: Invalid password hash format — possible plaintext or corruption');
    return false;
  }

  try {
    const parsed = parseStoredHash(storedHash);
    if (!parsed) return false;

    const salt = hexToBytes(parsed.saltHex);
    const storedHashBytes = hexToBytes(parsed.hashHex);

    const derivedKey = await deriveKey(password, salt, parsed.iterations);
    const computedHash = new Uint8Array(derivedKey);

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
 * Check if a stored hash needs rehashing (uses fewer iterations than current)
 * @param {string} storedHash
 * @returns {boolean}
 */
export function needsRehash(storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const parsed = parseStoredHash(storedHash);
  return parsed?.needsRehash ?? false;
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

  const parts = storedPassword.split(':');

  // v16.0.0 format: iterations:salt:hash
  if (parts.length === 3) {
    const [iter, salt, hash] = parts;
    return /^\d+$/.test(iter) && salt.length === 32 && hash.length === 64 &&
      /^[a-f0-9]+$/.test(salt) && /^[a-f0-9]+$/.test(hash);
  }

  // Legacy format: salt:hash
  if (parts.length === 2) {
    const [salt, hash] = parts;
    return salt.length === 32 && hash.length === 64 &&
      /^[a-f0-9]+$/.test(salt) && /^[a-f0-9]+$/.test(hash);
  }

  return false;
}

// Export for testing
export { timingSafeEqual, bytesToHex, hexToBytes };

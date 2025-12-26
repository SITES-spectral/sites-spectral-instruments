#!/usr/bin/env node
/**
 * Password Hashing Utility
 *
 * Use this script to generate hashed passwords for Cloudflare secrets.
 * The output can be used to replace plain text passwords in your secrets.
 *
 * Usage:
 *   node scripts/hash-password.js <password>
 *   node scripts/hash-password.js --interactive
 *
 * Example:
 *   node scripts/hash-password.js "my-secure-password"
 *
 * Output format (salt:hash in hex):
 *   a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4:0123456789abcdef...
 *
 * To update Cloudflare secrets:
 *   1. Generate hashed password using this script
 *   2. Update your wrangler.toml or use `wrangler secret put`
 *   3. The authentication system supports both plain and hashed passwords
 *      during migration
 */

// Polyfill crypto for Node.js
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import { hashPassword, verifyPassword, isPasswordHashed } from '../src/auth/password-hasher.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Password Hashing Utility for SITES Spectral

Usage:
  node scripts/hash-password.js <password>
  node scripts/hash-password.js --verify <password> <hash>
  node scripts/hash-password.js --check <stored-value>

Examples:
  # Hash a password
  node scripts/hash-password.js "my-secure-password"

  # Verify a password against a hash
  node scripts/hash-password.js --verify "my-password" "salt:hash"

  # Check if a stored value is hashed or plain text
  node scripts/hash-password.js --check "some-stored-value"

Output:
  The hashed password in format: salt:hash (both in hex)
  This can be used in Cloudflare secrets to replace plain text passwords.
`);
    process.exit(0);
  }

  if (args[0] === '--verify') {
    if (args.length < 3) {
      console.error('Usage: --verify <password> <hash>');
      process.exit(1);
    }
    const password = args[1];
    const hash = args[2];
    const isValid = await verifyPassword(password, hash);
    console.log(`Password verification: ${isValid ? 'VALID' : 'INVALID'}`);
    process.exit(isValid ? 0 : 1);
  }

  if (args[0] === '--check') {
    if (args.length < 2) {
      console.error('Usage: --check <stored-value>');
      process.exit(1);
    }
    const storedValue = args[1];
    const isHashed = isPasswordHashed(storedValue);
    console.log(`Stored value is: ${isHashed ? 'HASHED' : 'PLAIN TEXT'}`);
    if (!isHashed) {
      console.log('Consider hashing this password for improved security.');
    }
    process.exit(0);
  }

  // Hash the password
  const password = args[0];
  if (!password) {
    console.error('Error: Password cannot be empty');
    process.exit(1);
  }

  console.log('Hashing password...\n');

  try {
    const hashedPassword = await hashPassword(password);

    console.log('Hashed Password:');
    console.log('================');
    console.log(hashedPassword);
    console.log('');
    console.log('To use in Cloudflare secrets:');
    console.log('1. Copy the hashed value above');
    console.log('2. Update your credentials file or use: wrangler secret put CREDENTIAL_NAME');
    console.log('3. The system supports both plain and hashed passwords during migration');
    console.log('');

    // Verify the hash works
    const verified = await verifyPassword(password, hashedPassword);
    console.log(`Verification test: ${verified ? 'PASSED' : 'FAILED'}`);

    if (!verified) {
      console.error('ERROR: Hash verification failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error hashing password:', error.message);
    process.exit(1);
  }
}

main();

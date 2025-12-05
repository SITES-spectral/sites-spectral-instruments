/**
 * Application Commands (Write Operations)
 *
 * CQRS Command handlers for state-changing operations.
 *
 * @module application/commands
 */

// Station commands
export { CreateStation } from './CreateStation.js';
export { UpdateStation } from './UpdateStation.js';
export { DeleteStation } from './DeleteStation.js';

// Platform commands
export { CreatePlatform } from './CreatePlatform.js';
export { UpdatePlatform } from './UpdatePlatform.js';
export { DeletePlatform } from './DeletePlatform.js';

// Instrument commands
export { CreateInstrument } from './CreateInstrument.js';
export { UpdateInstrument } from './UpdateInstrument.js';
export { DeleteInstrument } from './DeleteInstrument.js';

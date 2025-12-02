// Instruments Handler Module - Backward Compatibility Layer
// v7.0.0 - Modular architecture
//
// This file maintains backward compatibility by re-exporting from the
// modular instruments/ directory. New code should import directly from:
// - ./instruments/index.js (main handler)
// - ./instruments/get.js (read operations)
// - ./instruments/mutate.js (write operations)
// - ./instruments/subresources.js (sub-resource handlers)
// - ./instruments/utils.js (utility functions)

export { handleInstruments } from './instruments/index.js';

// Re-export utilities for backward compatibility
export {
  getInstrumentTypeCode,
  extractBrandAcronym,
  getNextInstrumentNumber,
  getInstrumentForUser,
  roundCoordinate
} from './instruments/utils.js';

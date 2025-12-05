/**
 * Instrument Domain Module
 *
 * Exports instrument entity, repository interface, type registry, factory, and related types.
 *
 * @module domain/instrument
 */

export { Instrument, INSTRUMENT_STATUSES, MEASUREMENT_STATUSES } from './Instrument.js';
export { InstrumentRepository } from './InstrumentRepository.js';
export { InstrumentTypeRegistry, instrumentTypeRegistry } from './InstrumentTypeRegistry.js';
export { InstrumentFactory, instrumentFactory } from './InstrumentFactory.js';

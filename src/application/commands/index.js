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

// AOI commands
export { CreateAOI } from './CreateAOI.js';
export { UpdateAOI } from './UpdateAOI.js';
export { DeleteAOI } from './DeleteAOI.js';
export { ImportGeoJSON } from './ImportGeoJSON.js';
export { ImportKML } from './ImportKML.js';

// Campaign commands
export { CreateCampaign } from './CreateCampaign.js';
export { UpdateCampaign } from './UpdateCampaign.js';
export { DeleteCampaign } from './DeleteCampaign.js';
export { StartCampaign } from './StartCampaign.js';
export { CompleteCampaign } from './CompleteCampaign.js';

// Product commands
export { CreateProduct } from './CreateProduct.js';
export { UpdateProduct } from './UpdateProduct.js';
export { DeleteProduct } from './DeleteProduct.js';
export { SetProductQualityScore } from './SetProductQualityScore.js';
export { PromoteProductQuality } from './PromoteProductQuality.js';

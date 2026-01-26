/**
 * HTTP Controllers (V11 Architecture)
 *
 * Controllers that map HTTP requests to application use cases.
 * All controllers follow SOLID principles and Hexagonal Architecture.
 *
 * @module infrastructure/http/controllers
 */

// Core entity controllers
export { StationController } from './StationController.js';
export { PlatformController } from './PlatformController.js';
export { InstrumentController } from './InstrumentController.js';

// Admin controller
export { AdminController } from './AdminController.js';

// V11 Domain controllers
export { AOIController } from './AOIController.js';
export { CampaignController } from './CampaignController.js';
export { ProductController } from './ProductController.js';
export { MaintenanceController } from './MaintenanceController.js';
export { CalibrationController } from './CalibrationController.js';
export { ROIController } from './ROIController.js';
export { UserController } from './UserController.js';
export { AnalyticsController } from './AnalyticsController.js';
export { ExportController } from './ExportController.js';

// V15 UAV Domain controller
export { UAVController } from './UAVController.js';

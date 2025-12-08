/**
 * Get Calibration Timeline Query
 *
 * Retrieves the calibration history timeline for an instrument.
 * Shows historical calibrations in chronological order.
 *
 * @module application/queries/GetCalibrationTimeline
 */

import { CalibrationRecord } from '../../domain/index.js';

export class GetCalibrationTimeline {
  constructor({ calibrationRepository, instrumentRepository }) {
    this.calibrationRepository = calibrationRepository;
    this.instrumentRepository = instrumentRepository;
  }

  async execute({ instrumentId, channelId, startDate, endDate }) {
    if (!instrumentId) {
      throw new Error('Instrument ID is required');
    }

    // Validate instrument exists and is calibratable
    const instrument = await this.instrumentRepository.findById(instrumentId);
    if (!instrument) {
      throw new Error(`Instrument with ID ${instrumentId} not found`);
    }

    if (!CalibrationRecord.isCalibratableInstrument(instrument.instrumentType)) {
      throw new Error(
        `Calibration timeline is only available for multispectral and hyperspectral sensors. ` +
        `Instrument type '${instrument.instrumentType}' is not calibratable.`
      );
    }

    const timeline = await this.calibrationRepository.findTimeline(
      instrumentId,
      { channelId, startDate, endDate }
    );

    // Group by channel for multi-channel instruments
    const groupedByChannel = this.groupByChannel(timeline);

    return {
      instrumentId,
      instrumentType: instrument.instrumentType,
      timeline,
      byChannel: groupedByChannel,
      summary: this.calculateSummary(timeline)
    };
  }

  groupByChannel(records) {
    const grouped = {};

    for (const record of records) {
      const channelKey = record.channelId || 'all_channels';

      if (!grouped[channelKey]) {
        grouped[channelKey] = [];
      }
      grouped[channelKey].push(record);
    }

    return grouped;
  }

  calculateSummary(records) {
    const valid = records.filter(r => r.status === 'valid');
    const expired = records.filter(r => r.status === 'expired');
    const superseded = records.filter(r => r.status === 'superseded');

    const byType = {};
    for (const record of records) {
      byType[record.type] = (byType[record.type] || 0) + 1;
    }

    // Find most recent calibration date
    const sortedByDate = [...records].sort(
      (a, b) => new Date(b.calibrationDate) - new Date(a.calibrationDate)
    );
    const mostRecent = sortedByDate[0];

    return {
      totalRecords: records.length,
      validRecords: valid.length,
      expiredRecords: expired.length,
      supersededRecords: superseded.length,
      byType,
      mostRecentCalibration: mostRecent?.calibrationDate || null,
      nextExpiryDate: this.findNextExpiry(valid)
    };
  }

  findNextExpiry(validRecords) {
    const withExpiry = validRecords.filter(r => r.validUntil);
    if (withExpiry.length === 0) return null;

    const sorted = withExpiry.sort(
      (a, b) => new Date(a.validUntil) - new Date(b.validUntil)
    );
    return sorted[0].validUntil;
  }
}

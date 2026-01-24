/**
 * UAV Pilot Entity
 * Represents a certified UAV pilot with authorization to fly at SITES stations
 *
 * Architecture Credit: This subdomain-based architecture design is based on
 * architectural knowledge shared by Flights for Biodiversity Sweden AB
 * (https://github.com/flightsforbiodiversity)
 *
 * @module domain/uav/Pilot
 * @version 15.0.0
 */

/**
 * Valid pilot certificate types (Swedish Transport Agency)
 */
export const CERTIFICATE_TYPES = ['A1/A3', 'A2', 'STS-01', 'STS-02', 'national'];

/**
 * Valid pilot status values
 */
export const PILOT_STATUSES = ['active', 'inactive', 'suspended', 'pending_verification'];

/**
 * Pilot Entity
 */
export class Pilot {
  /**
   * @param {Object} props - Pilot properties
   * @param {number} [props.id] - Database ID
   * @param {number} [props.user_id] - Linked user account ID
   * @param {string} props.full_name - Pilot's full name
   * @param {string} props.email - Pilot's email address
   * @param {string} [props.phone] - Contact phone number
   * @param {string} [props.organization] - Pilot's organization
   * @param {string} [props.pilot_certificate_number] - Certificate number
   * @param {string} [props.certificate_type] - Certificate type
   * @param {string} [props.certificate_issued_date] - When certificate was issued
   * @param {string} [props.certificate_expiry_date] - When certificate expires
   * @param {string} [props.insurance_provider] - Insurance company
   * @param {string} [props.insurance_policy_number] - Policy number
   * @param {string} [props.insurance_expiry_date] - Insurance expiry date
   * @param {number} [props.flight_hours_total] - Total flight hours
   * @param {number} [props.flight_hours_sites_spectral] - Hours at SITES stations
   * @param {string} [props.last_flight_date] - Date of last flight
   * @param {string[]} [props.authorized_stations] - Station IDs pilot can fly at
   * @param {string} [props.status] - Pilot status
   * @param {string} [props.notes] - Additional notes
   */
  constructor(props) {
    this.id = props.id;
    this.user_id = props.user_id;
    this.full_name = props.full_name;
    this.email = props.email;
    this.phone = props.phone;
    this.organization = props.organization;

    // Certification
    this.pilot_certificate_number = props.pilot_certificate_number;
    this.certificate_type = props.certificate_type;
    this.certificate_issued_date = props.certificate_issued_date;
    this.certificate_expiry_date = props.certificate_expiry_date;

    // Insurance
    this.insurance_provider = props.insurance_provider;
    this.insurance_policy_number = props.insurance_policy_number;
    this.insurance_expiry_date = props.insurance_expiry_date;

    // Flight experience
    this.flight_hours_total = props.flight_hours_total || 0;
    this.flight_hours_sites_spectral = props.flight_hours_sites_spectral || 0;
    this.last_flight_date = props.last_flight_date;

    // Authorization
    this.authorized_stations = Array.isArray(props.authorized_stations)
      ? props.authorized_stations
      : JSON.parse(props.authorized_stations || '[]');

    // Status
    this.status = props.status || 'pending_verification';
    this.notes = props.notes;

    // Timestamps
    this.created_at = props.created_at;
    this.updated_at = props.updated_at;

    this.#validate();
  }

  /**
   * Validate pilot data
   * @private
   */
  #validate() {
    if (!this.full_name || this.full_name.trim().length === 0) {
      throw new Error('Pilot full name is required');
    }

    if (!this.email || !this.email.includes('@')) {
      throw new Error('Valid email is required');
    }

    if (this.certificate_type && !CERTIFICATE_TYPES.includes(this.certificate_type)) {
      throw new Error(`Invalid certificate type. Must be one of: ${CERTIFICATE_TYPES.join(', ')}`);
    }

    if (!PILOT_STATUSES.includes(this.status)) {
      throw new Error(`Invalid status. Must be one of: ${PILOT_STATUSES.join(', ')}`);
    }
  }

  /**
   * Check if pilot has a valid certificate
   * @returns {boolean}
   */
  hasCertificate() {
    return !!this.pilot_certificate_number && !!this.certificate_type;
  }

  /**
   * Check if certificate is expired
   * @returns {boolean}
   */
  isCertificateExpired() {
    if (!this.certificate_expiry_date) {
      return false; // No expiry set
    }
    return new Date(this.certificate_expiry_date) < new Date();
  }

  /**
   * Check if insurance is valid
   * @returns {boolean}
   */
  hasValidInsurance() {
    if (!this.insurance_policy_number || !this.insurance_expiry_date) {
      return false;
    }
    return new Date(this.insurance_expiry_date) >= new Date();
  }

  /**
   * Check if pilot is authorized to fly at a station
   * @param {number} stationId - Station ID
   * @returns {boolean}
   */
  isAuthorizedForStation(stationId) {
    return this.authorized_stations.includes(stationId);
  }

  /**
   * Check if pilot can currently fly
   * @returns {boolean}
   */
  canFly() {
    return (
      this.status === 'active' &&
      this.hasCertificate() &&
      !this.isCertificateExpired() &&
      this.hasValidInsurance()
    );
  }

  /**
   * Get days until certificate expires
   * @returns {number|null}
   */
  getDaysUntilCertificateExpiry() {
    if (!this.certificate_expiry_date) {
      return null;
    }
    const expiry = new Date(this.certificate_expiry_date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days until insurance expires
   * @returns {number|null}
   */
  getDaysUntilInsuranceExpiry() {
    if (!this.insurance_expiry_date) {
      return null;
    }
    const expiry = new Date(this.insurance_expiry_date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Add flight hours
   * @param {number} hours - Hours to add
   */
  addFlightHours(hours) {
    this.flight_hours_total += hours;
    this.flight_hours_sites_spectral += hours;
    this.last_flight_date = new Date().toISOString().split('T')[0];
  }

  /**
   * Convert to database record format
   * @returns {Object}
   */
  toRecord() {
    return {
      id: this.id,
      user_id: this.user_id,
      full_name: this.full_name,
      email: this.email,
      phone: this.phone,
      organization: this.organization,
      pilot_certificate_number: this.pilot_certificate_number,
      certificate_type: this.certificate_type,
      certificate_issued_date: this.certificate_issued_date,
      certificate_expiry_date: this.certificate_expiry_date,
      insurance_provider: this.insurance_provider,
      insurance_policy_number: this.insurance_policy_number,
      insurance_expiry_date: this.insurance_expiry_date,
      flight_hours_total: this.flight_hours_total,
      flight_hours_sites_spectral: this.flight_hours_sites_spectral,
      last_flight_date: this.last_flight_date,
      authorized_stations: JSON.stringify(this.authorized_stations),
      status: this.status,
      notes: this.notes
    };
  }

  /**
   * Convert to JSON (for API responses)
   * @returns {Object}
   */
  toJSON() {
    return {
      ...this.toRecord(),
      authorized_stations: this.authorized_stations,
      can_fly: this.canFly(),
      certificate_valid: !this.isCertificateExpired(),
      insurance_valid: this.hasValidInsurance(),
      days_until_certificate_expiry: this.getDaysUntilCertificateExpiry(),
      days_until_insurance_expiry: this.getDaysUntilInsuranceExpiry()
    };
  }

  /**
   * Create Pilot from database record
   * @param {Object} record - Database record
   * @returns {Pilot}
   */
  static fromRecord(record) {
    return new Pilot(record);
  }
}

export default Pilot;

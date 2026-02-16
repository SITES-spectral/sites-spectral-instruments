# Feature Matrix

> **Version**: 15.6.11
> **Last Updated**: 2026-02-16
> **Status**: Production Ready

## Production Information

| Property | Value |
|----------|-------|
| Public Portal | https://sitesspectral.work |
| Admin Portal | https://admin.sitesspectral.work |
| Station Portals | https://{station}.sitesspectral.work |
| Worker URL | https://sites-spectral-instruments.jose-beltran.workers.dev |
| Current Version | 15.6.11 |
| Last Deployed | 2026-02-16 |
| Environment | Cloudflare Workers + D1 Database + CF Access |
| Test Coverage | 1268 tests across 52 files |

---

## v15.6.x Security Features

| Feature | Version | Status | Documentation |
|---------|---------|--------|---------------|
| CF Access Session Persistence | v15.6.11 | Active | [Session Persistence](./security/SESSION_PERSISTENCE.md) |
| Centralized API Validation | v15.6.6 | Active | - |
| Sort Field Whitelists | v15.6.9 | Active | - |
| Magic Link Audit Trail | v15.6.8 | Active | - |
| IP Pinning for Magic Links | v15.6.8 | Active | - |
| Pilot Status Audit Trail | v15.6.8 | Active | - |
| UAV Authorization Service | v15.6.7 | Active | - |
| Email Service (MailChannels) | v15.6.6 | Active | - |
| Request Body Validation | v15.6.6 | Active | - |

---

## v15.0.0 Portal Features

| Feature | Version | Status | Documentation |
|---------|---------|--------|---------------|
| Subdomain Portal Architecture | v15.0.0 | Active | [Subdomain Architecture](./architecture/SUBDOMAIN_ARCHITECTURE.md) |
| Cloudflare Access JWT Auth | v15.0.0 | Active | [CF Access Integration](./security/CLOUDFLARE_ACCESS_INTEGRATION.md) |
| Magic Link System | v15.0.0 | Active | [Magic Link System](./MAGIC_LINK_SYSTEM.md) |
| UAV Pilot Management | v15.0.0 | Active | [UAV Pilot System](./UAV_PILOT_SYSTEM.md) |
| UAV Mission Planning | v15.0.0 | Active | - |
| Flight Log System | v15.0.0 | Active | - |
| New Roles (uav-pilot, station-internal) | v15.0.0 | Active | - |
| Public API Endpoints | v15.0.0 | Active | [API Reference](./API_REFERENCE.md) |

---

## v14.x Features

| Feature | Version | Status | Documentation |
|---------|---------|--------|---------------|
| Duplicate Platform Prevention Dialog | v14.0.3 | Active | [Platform Prevention](./PLATFORM_DUPLICATE_PREVENTION.md) |
| httpOnly Cookie Authentication | v14.0.0 | Active | [Authentication v14](./security/AUTHENTICATION_v14.md) |
| Centralized Auth Verification | v14.0.0 | Active | - |
| Complete Role Redirect Logic | v14.0.1 | Active | - |
| 5-Role Support | v14.0.1 | Active | - |

---

## v13.x Features

| Feature | Version | Status |
|---------|---------|--------|
| Config-Driven Instrument Types | v13.26.0 | Active |
| YAML-to-JS Build Generation | v13.26.0 | Active |
| 10 Instrument Types in YAML | v13.26.0 | Active |
| 6 Categories in YAML | v13.26.0 | Active |
| Production Ready Codebase | v13.0.0 | Active |
| 653 Test Coverage | v13.0.0 | Active |
| Promise Error Handling | v13.0.0 | Active |
| API Version Cleanup | v13.0.0 | Active |

---

## v12.x Features

| Feature | Version | Status |
|---------|---------|--------|
| CORS Origin Whitelist | v12.0.7 | Active |
| PBKDF2 Password Hashing | v12.0.7 | Active |
| httpOnly JWT Cookies | v12.0.7 | Active |
| Modal Focus Trap (WCAG) | v12.0.7 | Active |
| **Normalized Mount Type Codes** | v12.0.0 | BREAKING |

---

## v11.x Features

| Feature | Version | Status |
|---------|---------|--------|
| Station Users Read-Only | v11.0.0-alpha.31 | Active |
| Domain Authorization | v11.0.0-alpha.30 | Active |
| Station-Specific Admin | v11.0.0-alpha.30 | Active |
| Authorization Tests (57 tests) | v11.0.0-alpha.31 | Active |
| V11 Integration Tests | v11.0.0-alpha.7 | Active |
| Vocabulary Mapping | v11.0.0-alpha.6 | Active |
| Darwin Core Alignment | v11.0.0-alpha.6 | Active |
| ICOS Station Types | v11.0.0-alpha.6 | Active |
| Maintenance Timeline | v11.0.0-alpha.5 | Active |
| Calibration Timeline | v11.0.0-alpha.5 | Active |
| V8 Calibration Workflow | v11.0.0-alpha.4 | Active |

---

## v10.x Features

| Feature | Version | Status |
|---------|---------|--------|
| ROI Drawing Tool | v10.0.0-alpha.17 | Active |
| Legacy ROI System | v10.0.0-alpha.17 | Active |
| Admin Panel | v10.0.0-alpha.16 | Active |
| Role Management | v10.0.0-alpha.16 | Active |
| Data Export | v10.0.0-alpha.15 | Active |
| Map Integration | v10.0.0-alpha.14 | Active |
| ROI Management | v10.0.0-alpha.13 | Active |
| Testing Infrastructure | v10.0.0-alpha.12 | Active |

---

## Security Features (v8.5.3-v12.0.7)

| Feature | Version | Status |
|---------|---------|--------|
| CORS Origin Whitelist | v12.0.7 | Active |
| PBKDF2 Password Hashing | v12.0.7 | Active |
| httpOnly JWT Cookies | v12.0.7 | Active |
| Modal Focus Trap (WCAG 2.4.3) | v12.0.7 | Active |
| JWT HMAC-SHA256 Signing | v8.5.4 | Active |
| XSS Prevention (Event Delegation) | v8.5.6 | Active |
| XSS Prevention (DOM Methods) | v8.5.6 | Active |
| CSRF Protection | v8.5.7 | Active |
| Input Sanitization Framework | v8.5.7 | Active |
| Debug Utilities | v8.5.6 | Active |
| Rate Limiting | v8.5.6 | Active |
| CASCADE Constraints | v8.5.5 | Active |

---

## Platform Type Support Matrix

| Platform | Fixed | UAV | Satellite | Mobile | USV | UUV |
|----------|-------|-----|-----------|--------|-----|-----|
| **Status** | Active | Active | Active | Coming | Coming | Coming |
| PHE (Phenocam) | Yes | - | - | - | - | - |
| MS (Multispectral) | Yes | Yes | Yes | Yes | - | - |
| RGB (Camera) | - | Yes | - | - | - | - |
| TIR (Thermal) | Yes | Yes | Yes | - | - | - |
| HYP (Hyperspectral) | Yes | Yes | Yes | Yes | - | - |
| LID (LiDAR) | - | Yes | Yes | - | - | - |
| PAR (PAR Sensor) | Yes | - | - | - | - | - |
| NDVI (NDVI Sensor) | Yes | - | - | - | - | - |
| PRI (PRI Sensor) | Yes | - | - | - | - | - |
| SAR (Radar) | - | - | Yes | - | - | - |

---

## Authentication Method Matrix

| Method | CF Access OTP | Password | Magic Link |
|--------|---------------|----------|------------|
| **Portal Support** | Admin, Station | All | Station |
| **Session Duration** | 24h (cookie) | 24h (cookie) | 24h (cookie) |
| **Multi-Use** | Yes | Yes | Configurable |
| **IP Pinning** | No | No | Optional |
| **Audit Trail** | Yes | Yes | Enhanced |

---

## Related Documentation

- [Version History](./VERSION_HISTORY.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Security Architecture](./security/SECURITY_ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)

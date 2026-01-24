# Architecture Decision Records (ADRs)

This directory contains the Architecture Decision Records for SITES Spectral Instruments.

## What are ADRs?

ADRs are short documents that describe architectural decisions made during the project. They help:
- Document the rationale behind decisions
- Provide context for future developers
- Track the evolution of the architecture
- Enable revisiting decisions with full context

## ADR Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| [[ADR-001-hexagonal-architecture\|ADR-001]] | Hexagonal Architecture Adoption | Accepted | 2025-11 |
| [[ADR-002-cqrs-pattern\|ADR-002]] | CQRS for Read/Write Separation | Accepted | 2025-11 |
| [[ADR-003-legacy-roi-system\|ADR-003]] | Legacy ROI System Preservation | Accepted | 2025-11 |
| [[ADR-004-domain-events\|ADR-004]] | Domain Events for Audit Trail | Accepted | 2025-12 |
| [[ADR-005-security-ports\|ADR-005]] | Security Ports Pattern | Accepted | 2025-12 |
| [[ADR-006-openapi-contract-first\|ADR-006]] | OpenAPI Contract-First Design | Accepted | 2025-12 |
| [[ADR-007-port-versioning\|ADR-007]] | Port Versioning Strategy | Accepted | 2025-12 |
| [[ADR-008-v15-audit-remediation\|ADR-008]] | v15.0.0 Audit Remediation Plan | Proposed | 2026-01 |

## ADR Template

Use [[template\|ADR Template]] for creating new ADRs.

## Status Values

- **Proposed**: Under discussion
- **Accepted**: Decision made and implemented
- **Deprecated**: Superseded by another ADR
- **Superseded**: Replaced by a newer decision

---

**Created**: 2025-12-27
**Version**: 13.6.0

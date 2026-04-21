# Testing Methodology & Quality Assurance: USC-PIS
**Date:** April 21, 2026
**Version:** 3.1.0 (Production Stabilization)

---

## 1. Testing Framework Overview

The final stabilization phase (April 21, 2026) focused on "Resilience Testing"—verifying that the system can self-diagnose infrastructure failures and manage complex communication channels.

### 1.1 Tiers of Verification
*   **Tier 1: Infrastructure Unit Tests.** Validation of the `HealthChecker` class and the 7 diagnostic pillars.
*   **Tier 2: Role Authorization Tests.** Verification of standardized uppercase role constants across all viewsets.
*   **Tier 3: Responsive Display Tests.** Verification of the Flexbox layout across mobile, tablet, and desktop breakpoints.

---

## 2. Infrastructure & Diagnostic Validation

### 2.1 7-Point Diagnostic Audit Verification
*   **Method**: Artificial Fault Injection.
*   **Test Case**: Temporarily invalidating Gmail API credentials in the environment.
*   **Success Condition**: The "Email Infrastructure" pillar MUST transition to **CRITICAL** status on the dashboard within one diagnostic cycle (6 hours or manual refresh).

### 2.2 Performance & Rate Limiting
*   **Method**: Stress Testing.
*   **Test Case**: Flooding the registration endpoint with 50 requests per second.
*   **Success Condition**: The `RateLimitMiddleware` MUST return `429 Too Many Requests` and the "Performance" diagnostic pillar MUST show a **WARNING** if latency spikes occur.

---

## 3. Communication & Access Validation

### 3.1 Staff Channel Multiplexing
*   **Test Case**: Enabling "In-App" notifications while disabling "Email" notifications for a specific Doctor.
*   **Success Condition**: System must deliver the In-App alert while the Celery worker logs a "Skipped: User Preference" for the email task.

### 3.2 Standardized RBAC Verification
*   **Test Case**: Sending role strings in various cases (`admin`, `Admin`, `ADMIN`) to protected endpoints.
*   **Success Condition**: Only standardized uppercase constants (`ADMIN`) MUST be accepted, ensuring a consistent security posture across the entire backend.

---

## 4. UI/UX & Layout Verification

### 4.1 Flexbox Breakpoint Audit
*   **Method**: Cross-Device Simulation.
*   **Test Case**: Resizing the browser from 1920px (Desktop) to 375px (Mobile).
*   **Success Condition**: 
    *   **Desktop**: Sidebar is persistent; Main content has no manual `marginLeft` but aligns correctly via flex containers.
    *   **Mobile**: Sidebar transitions to a temporary drawer; Content expands to 100% width automatically.
    *   **Sticky Header**: Navigation remains at the top of the viewport during long page scrolls.

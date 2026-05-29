# USC-PIS Reporting System: Technical Descriptor (May 29, 2026)

This document provides an objective technical overview of the reporting architecture and functional state of the **USC Patient Information System (USC-PIS)** for requirement validation.

## 1. Architectural Overview
The reporting system is built on a **Modular Visualization-First Architecture**. It utilizes a centralized dashboard (`Reports.jsx`) that orchestrates 8 independent analytical sub-components (widgets). 

*   **Frontend Implementation**: React (Vite) + Material UI (MUI). Charts are rendered using `react-chartjs-2` (Chart.js), supporting real-time reactivity to filter changes.
*   **Backend Implementation**: Django REST Framework. Data is aggregated via a specialized `ReportDataService` in the backend, which performs complex SQL queries and Python-based data processing (e.g., peak hour calculations, demographic ratios).
*   **Data Integrity**: Data is pulled from five primary streams: Medical Records, Dental Records, Consultation Logs, Patient Feedback, and Health Campaign engagement metrics.

## 2. The Analytical Suite (8 Core Reports)
The system currently provides the following analytical dimensions:

1.  **Patient Demographics**: A pie chart breakdown of the active patient population by College/Department and Campus (TC vs. DC).
2.  **Monthly Visit Trends**: A longitudinal line graph comparing Medical vs. Dental visit volumes over time.
3.  **Top Clinical Diagnoses**: A horizontal bar chart identifying the most frequent medical conditions seen in the clinic.
4.  **Operational Peak Hours**: A density bar chart visualizing traffic by the hour to assist in staff resource allocation.
5.  **Common Dental Procedures**: Frequency analysis of dental services performed (e.g., Prophylaxis, Extraction).
6.  **Patient Satisfaction Analysis**: A doughnut chart visualizing student feedback ratings (1-5 stars) and service sentiment.
7.  **Campaign Performance**: Engagement metrics for health information materials, tracking "Views" and "Total Reach."
8.  **Medical Records Workshop (Audit Log)**: A high-fidelity tabular view for granular auditing of consultations, including provider attribution and student-level specifics.

## 3. Functional Features & User Controls
*   **Global Synchronization**: A "Global Dashboard Analytics Filter" bar allows users to set a time range (7 days, 30 days, 6 months, or Custom Range). All 8 widgets automatically refresh their datasets and charts simultaneously.
*   **Drill-Down Modals**: Each widget features a "View Details" button that opens a full-screen workshop. These modals provide raw data tables, additional filtering (e.g., filter by campus or specific diagnosis), and advanced sorting.
*   **Multi-Format Export Engine**: The system supports three primary export formats:
    *   **PDF**: Generates a professional, institutionally branded document with the University of San Carlos header, following Form **ACA-HSD-04F** standards.
    *   **Excel (XLSX)**: Produces multi-sheet workbooks where the first sheet contains summary metrics and subsequent sheets contain raw visit logs.
    *   **CSV**: Provides flat-file data for external spreadsheet analysis.

## 4. Institutional Alignment (USC-Specific)
The system explicitly implements the **USC Academic Directory Mapping**. Through the `CampusList.jsx` utility, the system maps internal course IDs to their respective Schools (e.g., SAFAD, SAS, SOE) and Campuses (Talamban vs. Downtown), ensuring that demographics reports align with the University’s organizational structure.

## 5. Objective Implementation Status
*   **Completed & Verified**: Global filtering, ChartJS visualization, Data aggregation from all modules, Academic mapping (TC/DC), and Basic PDF/CSV/Excel export pipelines.
*   **Technical Limitations/Notes**: 
    *   Some specific "Custom Report Generation" buttons within new sub-modals currently trigger a "Coming Soon" notification while specialized backend templates are finalized.
    *   PDF generation uses a dual-engine fallback (xhtml2pdf + ReportLab) to ensure 100% stability.
    *   Reporting access is strictly restricted to clinical roles (DOCTOR, DENTIST, NURSE) and ADMIN via RBAC (Role-Based Access Control).

## 6. Integration with App Ecosystem
The reporting module is a "Consumer" module that depends on the following "Producers":
*   **Medical/Dental**: Supplies the core clinical data.
*   **Feedback**: Supplies the satisfaction metrics.
*   **Notifications/Campaigns**: Supplies the engagement data.
*   **Audit Logging**: The backend uses `django-simple-history` to ensure data persistence for historical trends even after edits or deletions.

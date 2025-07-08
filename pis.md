Modernizing the USC-DC Clinic's Patient Information System: A Design and Implementation Project

Undergraduate Thesis Proposal

Presented to the School of EngineeringUniversity of San Carlos, Cebu City, Philippines

In Partial Fulfillment of the Requirements for the Degree

Bachelor of Science in Computer Engineering

By

Engr. Elline FabianEngr. Kenneth Carl LabarosaRon Vanz PetilunaJanren RenegadoGalen Elijah Sabequil

Date: July 2024

Abstract

The modernization of the University of San Carlos (USC) Clinic’s Patient Information System (PIS) aims to replace the inefficient, paper-based system with a modern, secure, web-based platform. The existing system struggles with incomplete records, poor reporting capabilities, inadequate information dissemination, and inefficient feedback collection. This project adopts a user-centered design (UCD) to develop a responsive PIS that ensures comprehensive record-keeping, promotes health campaigns, gathers patient feedback, automates reporting, sends notifications, and facilitates medical certificate issuance. Key design principles include accessibility, scalability, and basic security measures.

Keywords: Patient Information System, University Clinic, Health Records, UCD, Django, React, PostgreSQL, Security, Scalability, Accessibility

Table of Contents

Introduction

Review of Related Literature

Statement of the Problem

Goals and Objectives

Significance of the Study

Scope and Limitations

Methodology

Conceptual Framework

System Analysis and Design

System Features and Architecture

Security Measures

User Interface and Database Design

Development Process

Testing and Validation

Deployment and Training

Justification for Student Usage

References

Appendices

Introduction

Problem Background

The University of San Carlos Clinic relies on a paper-based health information system, causing multiple inefficiencies:

Incomplete medical records

Long consultation wait times

Inventory mismanagement

Limited analytics capabilities

Slow certificate issuance

Ineffective dissemination of health materials

Cumbersome feedback collection

Review of Related Literature

Studies emphasize the importance of robust HIS in universities:

Incomplete records lead to diagnostic delays [3]

Manual inventory systems lead to errors and waste [8]

Long queues are common without automated scheduling [6]

PIS increases efficiency, engagement, and accuracy [1][4][12]

Emerging technologies include:

Cloud computing for cost-effective scalability

Mobile Health (mHealth) apps

AI for diagnostics and personalization

Statement of the Problem

The USC Clinic's reliance on manual and fragmented processes has led to:

Incomplete patient data

Ineffective data collection and reporting

Poor communication channels for health information

Inefficient feedback and certificate issuance systems

This project aims to address these problems through a web-based PIS.

Goals and Objectives

Goal: Implement a comprehensive PIS for improved clinic performance.

Objectives:

Capture complete medical and dental records

Disseminate health information effectively

Collect and analyze patient feedback

Generate detailed, exportable reports

Send timely notifications

Streamline medical certificate issuance

Significance of the Study

For Students:

Faster service and personalized care

Health campaign awareness

Easy access to records and updates

Engagement via feedback system

For Clinic:

Increased efficiency

Better decision-making with analytics

Reduced administrative overhead

Broader Impact:

Can serve as a template for other campuses

Support academic health data research

Scope and Limitations

Scope:

Students are the primary users

Features: Records, feedback, reports, certificates, notifications

Platform: Web-based, deployed via Heroku

Initial focus: USC Downtown Campus

Limitations:

No integration with student info systems

Basic security and authentication only

Inventory and appointment modules deferred

Standalone system

Methodology

Conceptual Framework

Based on UCD principles

Emphasis on secure centralized storage, modularity, feedback

System Analysis and Design

Interviews with clinic staff

Review of daily operations and forms

Gap analysis to identify inefficiencies

System Features and Architecture

Core Modules:

Health Records (medical, dental, lab uploads)

Campaign Pages (PubMats, banners)

Feedback Collection (digital forms, trends)

Reports (customizable, PDF/Excel export)

Notifications (in-app/email)

Certificate Issuance (template-based)

Tech Stack:

Frontend: React

Backend: Django

Database: PostgreSQL with pgcrypto

Hosting: Heroku

Layers:

UI: React components

API: Django REST Framework

Data: PostgreSQL with encryption

Security Measures

RBAC: Roles include Student, Nurse, Doctor, Dentist, Staff, Admin

Encrypted data columns (pgcrypto)

Django login and session handling

Admin can assign and adjust roles

User Interface and Database Design

Intuitive UI with accessibility support

Forms replicate clinic's paper formats

Clean navigation and high-contrast display

Backend schema mirrors clinical workflow

Development Process

Agile sprints with prototyping

Feedback loops from clinic

Version control: GitHub

CI/CD: Heroku Pipelines

Testing and Validation

Tests:

Unit, Integration, Performance

UAT with clinic staff and 1st year Tourism students

Bug fixing and iterations based on UAT

Deployment and Training

Pilot: 80% of BS Tourism 1st years + clinic staff

Full deployment post feedback

Support via user manual and documentation

Clinic team as long-term point of contact

Justification for Student Usage

Web access to records and health campaigns

Digital feedback improves services

Convenient, fast, and familiar interface

Empowers student responsibility in health

References

(Full list of academic references as per manuscript: WHO, JMIR, PLoS, BMC, etc.)

Appendices

A: Deliverables

D1: Research Manuscript (June 8, 2024)

D2: Project Software Components (Sept 16, 2024)

D3: Technical Documentation (Sept 23, 2024)

D4: Functional Prototype (Sept 30, 2024)

D5: Testing Phase (Oct 7, 2024)

D6: Retooling Phase (Oct 21, 2024)

B: Work Plan

(Milestone tracker and timeline chart)

C: Cost Estimates

2 Desktop PCs: PHP 80,000

Printing: PHP 500

Transportation: PHP 5,000

Misc & Contingency: PHP 13,000

Total: PHP 98,500

D: Diagrams

Conceptual Framework

Context Diagram

System Architecture

E: UI Mockups

Login, Register, Evaluation, Dashboard

Student and Admin record views

F: Counseling Logbook

Dates, topics, signatures of adviser meetings

G: Feature Checklist

Feature

Project Checking

Good to Have

Future Iteration

Health & Dental Records

✅





Feedback Collection

✅





Notifications

✅





Report Generation

✅





Inventory Management





✅

Appointment Scheduling





✅

File Upload

✅





RBAC + Basic Encryption

✅





Web-Based Platform

✅





H: MOA

Agreement signed by clinic coordinator and Group L, outlining purpose, scope, and roles.

End of Document


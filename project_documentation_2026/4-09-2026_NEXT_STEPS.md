# Next Steps - April 9, 2026

## Overview
With the implementation of advanced filtering and the polished USC Clinic Template, the system is now ready for its final **Pilot Testing** phase. The primary focus is now on verifying these administrative tools with real-world student data.

## Phase 1: Production Validation (Immediate)
- [ ] **Heroku Deployment**: Push the latest changes to production (`git push heroku main`).
- [ ] **Database Synchronization**: Run `heroku run python backend/manage.py migrate` and `heroku run python backend/manage.py seed_tours_template`.
- [ ] **Certificate Rendering Test**: Generate a certificate on the live site using the "USC Clinic Template" and verify the PDF renders perfectly in landscape mode with the student's full course name.
- [ ] **Filtering Accuracy Check**: Verify that the Academic Year and Semester filters correctly segment the existing 6 student records.

## Phase 2: Thesis Pilot Testing (Upcoming)
- [ ] **Tourism Management Dataset**: Import/register the 1st Year student data as per the thesis requirements.
- [ ] **Cohort Filtering**: Test the new filter bar by selecting "Tourism Management" and "1st Year" to verify the segmentation works for large groups.
- [ ] **Batch Certificate Generation**: Simulate a tour requirement by generating certificates for multiple students in the pilot cohort.

## Phase 3: Administrative Handover
- [ ] **User Guide Distribution**: Share the updated `USER_GUIDE.md` with clinic staff, specifically highlighting the "Advanced Patient Filtering" and "Purpose/Requirement" terminology.
- [ ] **Staff Training**: Demonstrate the collapsible filter bar and the new medical certificate creation workflow to the clinic team.

## Phase 4: Future Roadmap (Post-Thesis)
- [ ] **Inventory Management System**: Begin planning for medical supply and medication tracking.
- [ ] **In-App Notifications Enhancement**: Explore WebSocket integration for real-time alerts without page polling.
- [ ] **Help Center Implementation**: Create the dedicated `/help` page with interactive tutorials.

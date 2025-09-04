# USC-PIS Reports System Guide

## Overview

The USC-PIS Reports System provides comprehensive analytics and reporting capabilities for healthcare data. The system generates reports in multiple formats (PDF, Excel, CSV, JSON) and stores them securely in cloud storage for reliable access.

## System Architecture

### Components
- **Report Templates**: Predefined report configurations
- **Report Generation Service**: Background processing for report creation
- **Cloud Storage Integration**: Cloudinary for persistent file storage
- **Download System**: Streaming downloads from cloud storage
- **Analytics Dashboard**: Real-time reporting metrics

### Storage Configuration
- **Development**: Local SQLite database with optional local file storage
- **Production**: PostgreSQL database with Cloudinary cloud storage
- **File Handling**: Automatic detection and handling of both local and cloud storage

## Available Report Types

### 1. Patient Summary Report
- Total patient statistics
- Demographics breakdown (age, gender)
- New registrations tracking
- Active patient metrics

### 2. Visit Trends Report
- Medical and dental visit analytics
- Monthly trend analysis
- Peak usage patterns
- Hour-by-hour distribution

### 3. Treatment Outcomes Report
- Treatment effectiveness metrics
- Common diagnoses analysis
- Follow-up requirements
- Success rate calculations

### 4. Feedback Analysis Report
- Patient satisfaction metrics
- Rating distribution analysis
- Monthly satisfaction trends
- Response time statistics

### 5. Comprehensive Analytics Report
- System-wide performance metrics
- User activity analysis
- Health trend calculations
- Efficiency measurements

### 6. Medical Statistics Report
- Medical record analytics
- Patient health metrics
- Treatment statistics

### 7. Dental Statistics Report
- Dental visit analytics
- Treatment frequency
- Dental health trends

### 8. Campaign Performance Report
- Health campaign effectiveness
- User engagement metrics
- System adoption rates

## Web Interface Usage

### Accessing Reports
1. Navigate to `/reports` page (requires authentication)
2. Select desired report template
3. Configure date range and filters
4. Choose export format (PDF, Excel, CSV, JSON)
5. Click "Generate Report"

### Report Generation Process
1. **Request Submission**: Report parameters validated and queued
2. **Background Processing**: Threading system generates report data
3. **File Creation**: Export service creates formatted file
4. **Cloud Upload**: File automatically uploaded to Cloudinary
5. **Completion**: Report marked as completed and ready for download

### Downloading Reports
1. Go to "My Reports" tab
2. Find completed report in list
3. Click "Download" button
4. File streams directly from cloud storage
5. Download count automatically tracked

## API Endpoints

### Report Templates
- `GET /api/reports/templates/` - List available templates
- `POST /api/reports/templates/{id}/generate/` - Generate report from template

### Generated Reports
- `GET /api/reports/generated/` - List user's reports
- `GET /api/reports/generated/{id}/` - Get report details
- `GET /api/reports/generated/{id}/download/` - Download report file
- `GET /api/reports/generated/{id}/status/` - Check generation status

### Dashboard
- `GET /api/reports/generated/dashboard/` - Get reporting dashboard data

## Technical Implementation

### Report Generation Flow
```python
# 1. Create report record
report = GeneratedReport.objects.create(
    template=template,
    generated_by=user,
    title=title,
    export_format=format
)

# 2. Background generation
thread = threading.Thread(
    target=generate_report_task,
    args=(report.id, template.id, filters, dates, format)
)
thread.start()

# 3. Data collection and processing
service = ReportGenerationService()
report_data = service.generate_patient_summary_report(...)

# 4. File creation and upload
filename = f"report_{report.id}_{uuid}.{extension}"
report.file_path.save(filename, ContentFile(report_data))
```

### Cloud Storage Integration
```python
# Cloudinary configuration in settings.py
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': 'your_cloud_name',
    'API_KEY': 'your_api_key',
    'API_SECRET': 'your_api_secret'
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
```

### Download System
```python
# Automatic detection of storage type
try:
    # Try local file access
    file_path = report.file_path.path
    if os.path.exists(file_path):
        return serve_local_file(file_path)
except ValueError:
    # Use cloud storage URL
    file_url = report.file_path.url
    return stream_from_cloud(file_url)
```

## Performance Optimization

### Caching Strategy
- **Data Caching**: Report data cached for 15 minutes to 2 hours based on type
- **Query Optimization**: Database aggregation and indexing for fast data retrieval
- **Background Processing**: Threading prevents UI blocking during generation

### Database Optimization
- Indexed fields: `generated_by`, `status`, `template`, `created_at`, `expires_at`
- Optimized queries with `select_related` and `prefetch_related`
- Database-agnostic SQL for PostgreSQL and SQLite compatibility

### File Management
- Automatic file expiration (30 days default)
- File size tracking and storage usage monitoring
- Download count analytics

## Error Handling

### Common Issues and Solutions

#### 1. Report Generation Failures
- **Symptom**: Report status remains "GENERATING" or changes to "FAILED"
- **Causes**: Database connection issues, insufficient data, service errors
- **Solution**: Check error messages in report.error_message field

#### 2. Download Issues
- **Symptom**: "Cannot download reports" error
- **Causes**: Cloud storage access issues, expired files, network problems
- **Solution**: System automatically detects storage type and handles appropriately

#### 3. Performance Issues
- **Symptom**: Slow report generation or timeouts
- **Causes**: Large datasets, complex queries, server load
- **Solution**: Implement query optimization and consider pagination

### Error Recovery
```python
# Automatic error handling in generation process
try:
    report_data = service.generate_report(...)
    report.status = 'COMPLETED'
except Exception as e:
    report.status = 'FAILED'
    report.error_message = str(e)
    logger.error(f"Report generation failed: {e}")
```

## Security Features

### Access Control
- **Authentication Required**: All report endpoints require user authentication
- **Role-Based Access**: Reports filtered by user role and permissions
- **Data Isolation**: Users can only access their own reports (unless admin/staff)

### File Security
- **Secure URLs**: Cloudinary provides secure, time-limited access URLs
- **Access Logging**: Download attempts logged for audit trails
- **File Validation**: Extension validation prevents malicious uploads

## Monitoring and Analytics

### System Metrics
- Total reports generated per user/template
- Average generation times
- Download frequencies
- Error rates and types
- Storage usage statistics

### Dashboard Features
- Real-time generation status
- Popular report templates
- User activity tracking
- Format distribution analysis
- Storage usage monitoring

## Troubleshooting

### Development Environment
1. Ensure Cloudinary credentials are configured
2. Check database migrations are applied
3. Verify background task execution
4. Test with small datasets first

### Production Environment
1. Monitor Cloudinary storage limits
2. Check server memory and CPU usage
3. Verify database performance
4. Monitor error logs for patterns

### Common Fixes
```bash
# Reset failed reports
python manage.py shell -c "
from reports.models import GeneratedReport
GeneratedReport.objects.filter(status='GENERATING').update(status='FAILED')
"

# Clean up expired reports
python manage.py shell -c "
from reports.models import GeneratedReport
from django.utils import timezone
GeneratedReport.objects.filter(expires_at__lt=timezone.now()).delete()
"
```

## Recent Updates (September 2025)

### Report Download System Overhaul (September 4, 2025)
- **Issue**: 500 Internal Server Errors on production downloads due to Cloudinary authentication failures
- **Root Cause**: Cloudinary storage configured but experiencing 401 authentication errors on Heroku
- **Solution**: Implemented 4-tier fallback system:
  1. **Storage Backend Access**: Direct storage.open() method (Cloudinary/local)
  2. **Local Path Access**: Direct filesystem path access for local storage
  3. **Media Directory Fallback**: Direct media folder access when storage fails
  4. **On-the-Fly Regeneration**: Real-time report regeneration when all file access fails

### Format Support Enhancement (September 4, 2025)
- **Issue**: Most templates only supported PDF and HTML formats
- **Solution**: Updated all 7 report templates to support `['PDF', 'EXCEL', 'CSV', 'JSON']`
- **Enhancement**: Installed `openpyxl` and `xlsxwriter` for proper Excel generation
- **Result**: Professional Excel files with styling (5,309 bytes vs 250 bytes CSV fallback)

### Frontend Download Logic Fix (September 4, 2025)
- **Issue**: JSON downloads showing content in toast messages instead of downloading files
- **Root Cause**: Frontend logic treated all JSON responses as errors
- **Solution**: Enhanced error detection to distinguish between actual errors and JSON file content
- **Result**: All formats (PDF, Excel, CSV, JSON) now download correctly

### Production Reliability (September 4, 2025)
- **Cloudinary Integration**: Enhanced error handling for authentication issues
- **File Regeneration**: Automatic report regeneration when stored files are inaccessible
- **Dependencies**: Added Excel libraries to `requirements.txt` for production deployment
- **Logging**: Enhanced debugging for troubleshooting download issues

## Troubleshooting Production Issues

### Download Failures (500 Errors)
**Symptoms**: 
- Frontend shows "Request failed with status code 500" 
- User sees "Unable to access report file" error

**Debugging Steps**:
1. Check Heroku logs: `heroku logs --source app -n 100 | grep download`
2. Look for specific error patterns:
   - `Storage open failed`: Cloudinary authentication issue
   - `Local path read failed`: Storage backend configuration issue
   - `File not found in media directory`: File missing from local storage
   - `All download methods failed`: Complete storage failure

**Common Fixes**:
- **Cloudinary 401 errors**: Verify Heroku config vars for Cloudinary credentials
- **Missing files**: System automatically regenerates reports when files are inaccessible
- **Storage backend issues**: Fallback system handles local/cloud storage differences

### Format-Specific Issues
- **Excel downloads**: Ensure `openpyxl>=3.1.5` and `xlsxwriter>=3.2.5` in requirements.txt
- **JSON downloads**: Fixed frontend logic to distinguish errors from file content
- **PDF downloads**: ReportLab dependency working correctly

---

**Last Updated**: September 4, 2025  
**Status**: Download Issues Resolved  
**Storage**: 4-Tier Fallback System Active  
**Download System**: Production-Ready with Auto-Recovery  
**Version**: 3.0 (Enterprise-Grade Reliability)
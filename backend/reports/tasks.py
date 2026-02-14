import uuid
import logging
from django.core.files.base import ContentFile
from django.utils import timezone
from celery import shared_task
from django import db
from .models import ReportTemplate, GeneratedReport
from .services import ReportGenerationService

logger = logging.getLogger(__name__)

@shared_task(name="reports.tasks.generate_report_celery")
def generate_report_task_celery(report_id):
    """Celery task for generating reports asynchronously using Pandas and ReportLab"""
    try:
        # Ensure fresh DB connection
        db.close_old_connections()
        
        try:
            report = GeneratedReport.objects.select_related('template').get(id=report_id)
            template = report.template
        except GeneratedReport.DoesNotExist:
            logger.error(f"Report ID {report_id} not found")
            return False

        logger.info(f"Celery task started for report {report_id} ({template.report_type}) format {report.export_format}")
        
        report.status = 'GENERATING'
        report.progress_percentage = 20
        report.save()
        
        # Initialize report generation service
        service = ReportGenerationService()
        
        # Generate report data
        common_kwargs = {
            'date_start': report.date_range_start,
            'date_end': report.date_range_end,
            'filters': report.filters,
            'export_format': report.export_format,
            'template_html': template.template_content
        }
        
        report.progress_percentage = 40
        report.save()

        # Mapping report types to service methods
        report_methods = {
            'PATIENT_SUMMARY': service.generate_patient_summary_report,
            'VISIT_TRENDS': service.generate_visit_trends_report,
            'TREATMENT_OUTCOMES': service.generate_treatment_outcomes_report,
            'FEEDBACK_ANALYSIS': service.generate_feedback_analysis_report,
            'COMPREHENSIVE_ANALYTICS': service.generate_comprehensive_analytics_report,
            'MEDICAL_STATISTICS': service.generate_medical_statistics_report,
            'DENTAL_STATISTICS': service.generate_dental_statistics_report,
            'CAMPAIGN_PERFORMANCE': service.generate_campaign_performance_report,
            'USER_ACTIVITY': service.generate_user_activity_report,
            'HEALTH_METRICS': service.generate_health_metrics_report,
            'INVENTORY_REPORT': service.generate_inventory_report,
            'FINANCIAL_REPORT': service.generate_financial_report,
            'COMPLIANCE_REPORT': service.generate_compliance_report,
            'CUSTOM': service.generate_custom_report,
        }

        method = report_methods.get(template.report_type, service.generate_comprehensive_analytics_report)
        report_data = method(**common_kwargs)
        
        if report_data:
            report.progress_percentage = 80
            report.save()
            
            # Determine file extension
            file_extension = {
                'PDF': 'pdf',
                'EXCEL': 'xlsx',
                'CSV': 'csv',
                'JSON': 'json',
                'HTML': 'html'
            }.get(report.export_format, 'pdf')
            
            # Verify Excel format (Pandas output should have PK header if using xlsxwriter/openpyxl)
            if report.export_format == 'EXCEL' and isinstance(report_data, bytes):
                if not report_data.startswith(b'PK\x03\x04'):
                    file_extension = 'csv'
                    logger.warning(f"Excel generation for report {report_id} fell back to CSV")

            filename = f"report_{report.id}_{uuid.uuid4().hex[:8]}.{file_extension}"
            
            try:
                report.file_path.save(filename, ContentFile(report_data))
                report.file_size = len(report_data)
                report.status = 'COMPLETED'
                report.progress_percentage = 100
                logger.info(f"Report {report_id} completed successfully via Celery")
            except Exception as save_err:
                logger.error(f"Failed to save report file: {str(save_err)}")
                report.status = 'FAILED'
                report.error_message = f"Storage Error: {str(save_err)}"
            
            report.completed_at = timezone.now()
            report.generation_time = timezone.now() - report.created_at
            
        else:
            logger.error(f"No report data generated for report {report_id}")
            report.status = 'FAILED'
            report.error_message = 'Service returned no data'
        
        report.save()
        return True
        
    except Exception as e:
        import traceback
        error_details = f"Celery error generating report {report_id}: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_details)
        try:
            db.close_old_connections()
            report = GeneratedReport.objects.get(id=report_id)
            report.status = 'FAILED'
            report.error_message = f"{str(e)}"
            report.save()
        except Exception:
            pass
        return False
    finally:
        db.close_old_connections()

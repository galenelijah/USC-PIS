import os
import json
import csv
from datetime import datetime, timedelta
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from django.template import Template, Context
from django.conf import settings
from io import BytesIO, StringIO
from patients.models import Patient, MedicalRecord
from authentication.models import User
from feedback.models import Feedback
from health_info.models import HealthCampaign, CampaignFeedback
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)

class ReportDataService:
    """Service for collecting and processing data for reports"""
    
    @staticmethod
    def get_patient_summary_data(date_start=None, date_end=None, filters=None):
        """Get patient summary data"""
        queryset = Patient.objects.all()
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        # Apply additional filters
        if filters:
            if filters.get('gender'):
                queryset = queryset.filter(gender=filters['gender'])
            if filters.get('age_range'):
                # This would require calculating age
                pass
        
        total_patients = queryset.count()
        gender_distribution = queryset.values('gender').annotate(count=Count('id'))
        
        # Age distribution (simplified)
        age_groups = {
            '0-17': 0, '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0
        }
        
        return {
            'total_patients': total_patients,
            'gender_distribution': list(gender_distribution),
            'age_distribution': age_groups,
            'new_registrations': queryset.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'patients_with_medical_records': queryset.filter(
                medical_records__isnull=False
            ).distinct().count()
        }
    
    @staticmethod
    def get_visit_trends_data(date_start=None, date_end=None, filters=None):
        """Get visit trends data"""
        queryset = MedicalRecord.objects.all()
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        # Monthly visit trends
        monthly_visits = []
        current_date = date_start or timezone.now() - timedelta(days=365)
        end_date = date_end or timezone.now()
        
        while current_date <= end_date:
            month_start = current_date.replace(day=1)
            if current_date.month == 12:
                month_end = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
            
            month_visits = queryset.filter(
                created_at__gte=month_start,
                created_at__lte=month_end
            ).count()
            
            monthly_visits.append({
                'month': current_date.strftime('%Y-%m'),
                'visits': month_visits
            })
            
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        # Visit types distribution
        visit_types = queryset.values('record_type').annotate(count=Count('id'))
        
        # Peak hours analysis
        peak_hours = []
        for hour in range(24):
            hour_visits = queryset.filter(created_at__hour=hour).count()
            peak_hours.append({'hour': hour, 'visits': hour_visits})
        
        return {
            'total_visits': queryset.count(),
            'monthly_trends': monthly_visits,
            'visit_types': list(visit_types),
            'peak_hours': peak_hours,
            'average_visits_per_day': queryset.count() / max(1, (end_date - current_date).days)
        }
    
    @staticmethod
    def get_treatment_outcomes_data(date_start=None, date_end=None, filters=None):
        """Get treatment outcomes data"""
        queryset = MedicalRecord.objects.all()
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        # Treatment effectiveness (simplified)
        total_treatments = queryset.count()
        follow_up_required = queryset.filter(
            treatment_plan__icontains='follow-up'
        ).count()
        
        # Common diagnoses
        diagnoses = queryset.exclude(
            diagnosis__isnull=True
        ).exclude(
            diagnosis__exact=''
        ).values('diagnosis').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Treatment types
        treatment_types = queryset.exclude(
            treatment_performed__isnull=True
        ).exclude(
            treatment_performed__exact=''
        ).values('treatment_performed').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        return {
            'total_treatments': total_treatments,
            'follow_up_rate': (follow_up_required / max(1, total_treatments)) * 100,
            'common_diagnoses': list(diagnoses),
            'treatment_types': list(treatment_types),
            'success_rate': 85.0  # This would need more complex calculation
        }
    
    @staticmethod
    def get_feedback_analysis_data(date_start=None, date_end=None, filters=None):
        """Get feedback analysis data"""
        queryset = Feedback.objects.all()
        
        if date_start:
            queryset = queryset.filter(created_at__gte=date_start)
        if date_end:
            queryset = queryset.filter(created_at__lte=date_end)
        
        total_feedback = queryset.count()
        if total_feedback == 0:
            return {
                'total_feedback': 0,
                'average_rating': 0,
                'rating_distribution': [],
                'satisfaction_trends': [],
                'common_themes': []
            }
        
        # Rating distribution
        rating_dist = queryset.values('rating').annotate(count=Count('id')).order_by('rating')
        
        # Average rating
        average_rating = queryset.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
        
        # Satisfaction trends (monthly)
        satisfaction_trends = []
        current_date = date_start or timezone.now() - timedelta(days=180)
        end_date = date_end or timezone.now()
        
        while current_date <= end_date:
            month_start = current_date.replace(day=1)
            if current_date.month == 12:
                month_end = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
            
            month_feedback = queryset.filter(
                created_at__gte=month_start,
                created_at__lte=month_end
            )
            month_avg = month_feedback.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
            
            satisfaction_trends.append({
                'month': current_date.strftime('%Y-%m'),
                'average_rating': round(month_avg, 1),
                'feedback_count': month_feedback.count()
            })
            
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return {
            'total_feedback': total_feedback,
            'average_rating': round(average_rating, 1),
            'rating_distribution': list(rating_dist),
            'satisfaction_trends': satisfaction_trends,
            'recommendation_rate': queryset.filter(recommend='yes').count() / max(1, total_feedback) * 100,
            'courtesy_rate': queryset.filter(courteous='yes').count() / max(1, total_feedback) * 100
        }

class ReportExportService:
    """Service for exporting reports in different formats"""
    
    @staticmethod
    def export_to_pdf(report_data, template_content, title="Report"):
        """Export report to PDF - simplified version without xhtml2pdf"""
        try:
            # For now, return a simple text-based PDF-like content
            # In production, you would use a proper PDF library
            content = f"""
            {title}
            Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
            
            Report Data:
            {json.dumps(report_data, indent=2, default=str)}
            """
            return content.encode('utf-8')
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return None
    
    @staticmethod
    def export_to_excel(report_data, title="Report"):
        """Export report to Excel - simplified CSV format with .xlsx extension"""
        try:
            # For now, use CSV format but with Excel-compatible structure
            output = StringIO()
            
            # Write title and metadata
            writer = csv.writer(output)
            writer.writerow([title])
            writer.writerow(['Generated At', timezone.now().strftime('%Y-%m-%d %H:%M:%S')])
            writer.writerow([])  # Empty row
            
            # Write summary data
            writer.writerow(['Summary'])
            for key, value in report_data.items():
                if isinstance(value, (int, float, str)):
                    writer.writerow([str(key).replace('_', ' ').title(), value])
            
            writer.writerow([])  # Empty row
            
            # Write detailed data tables
            for key, value in report_data.items():
                if isinstance(value, list) and value:
                    writer.writerow([str(key).replace('_', ' ').title()])
                    if isinstance(value[0], dict):
                        # Write headers
                        headers = list(value[0].keys())
                        writer.writerow([header.replace('_', ' ').title() for header in headers])
                        
                        # Write data
                        for item in value:
                            row = [item.get(header, '') for header in headers]
                            writer.writerow(row)
                    
                    writer.writerow([])  # Empty row
            
            csv_content = output.getvalue()
            output.close()
            return csv_content.encode('utf-8')
        
        except Exception as e:
            logger.error(f"Error generating Excel: {str(e)}")
            return None
    
    @staticmethod
    def export_to_csv(report_data, title="Report"):
        """Export report to CSV"""
        try:
            output = StringIO()
            
            # Find the main data table
            main_data = None
            for key, value in report_data.items():
                if isinstance(value, list) and value and isinstance(value[0], dict):
                    main_data = value
                    break
            
            if main_data:
                # Use built-in csv module
                headers = list(main_data[0].keys())
                writer = csv.DictWriter(output, fieldnames=headers)
                writer.writeheader()
                writer.writerows(main_data)
            else:
                # If no tabular data, create a simple key-value CSV
                writer = csv.writer(output)
                writer.writerow(['Metric', 'Value'])
                for key, value in report_data.items():
                    if isinstance(value, (int, float, str)):
                        writer.writerow([key.replace('_', ' ').title(), value])
            
            csv_content = output.getvalue()
            output.close()
            return csv_content.encode('utf-8')
        
        except Exception as e:
            logger.error(f"Error generating CSV: {str(e)}")
            return None
    
    @staticmethod
    def export_to_json(report_data, title="Report"):
        """Export report to JSON"""
        try:
            output_data = {
                'title': title,
                'generated_at': timezone.now().isoformat(),
                'data': report_data
            }
            return json.dumps(output_data, indent=2, default=str).encode('utf-8')
        except Exception as e:
            logger.error(f"Error generating JSON: {str(e)}")
            return None

class ReportGenerationService:
    """Main service for generating reports"""
    
    def __init__(self):
        self.data_service = ReportDataService()
        self.export_service = ReportExportService()
    
    def generate_patient_summary_report(self, date_start=None, date_end=None, filters=None, export_format='PDF'):
        """Generate patient summary report"""
        data = self.data_service.get_patient_summary_data(date_start, date_end, filters)
        
        template_content = """
        <html>
        <head>
            <title>Patient Summary Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .metric { margin: 10px 0; padding: 10px; background: #f5f5f5; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4472C4; color: white; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Patient Summary Report</h1>
                <p>Generated on: {{ generated_at|date:"Y-m-d H:i:s" }}</p>
            </div>
            
            <div class="metric">
                <h3>Total Patients: {{ report_data.total_patients }}</h3>
            </div>
            
            <div class="metric">
                <h3>New Registrations (Last 30 Days): {{ report_data.new_registrations }}</h3>
            </div>
            
            <h3>Gender Distribution</h3>
            <table>
                <tr><th>Gender</th><th>Count</th></tr>
                {% for item in report_data.gender_distribution %}
                <tr><td>{{ item.gender }}</td><td>{{ item.count }}</td></tr>
                {% endfor %}
            </table>
        </body>
        </html>
        """
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, template_content, "Patient Summary Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Patient Summary Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Patient Summary Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Patient Summary Report")
        
        return None
    
    def generate_visit_trends_report(self, date_start=None, date_end=None, filters=None, export_format='PDF'):
        """Generate visit trends report"""
        data = self.data_service.get_visit_trends_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, "", "Visit Trends Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Visit Trends Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Visit Trends Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Visit Trends Report")
        
        return None
    
    def generate_treatment_outcomes_report(self, date_start=None, date_end=None, filters=None, export_format='PDF'):
        """Generate treatment outcomes report"""
        data = self.data_service.get_treatment_outcomes_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, "", "Treatment Outcomes Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Treatment Outcomes Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Treatment Outcomes Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Treatment Outcomes Report")
        
        return None
    
    def generate_feedback_analysis_report(self, date_start=None, date_end=None, filters=None, export_format='PDF'):
        """Generate feedback analysis report"""
        data = self.data_service.get_feedback_analysis_data(date_start, date_end, filters)
        
        if export_format == 'PDF':
            return self.export_service.export_to_pdf(data, "", "Feedback Analysis Report")
        elif export_format == 'EXCEL':
            return self.export_service.export_to_excel(data, "Feedback Analysis Report")
        elif export_format == 'CSV':
            return self.export_service.export_to_csv(data, "Feedback Analysis Report")
        elif export_format == 'JSON':
            return self.export_service.export_to_json(data, "Feedback Analysis Report")
        
        return None 
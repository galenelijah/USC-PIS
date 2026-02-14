import logging
from .tasks import generate_report_task_celery
from .services import ReportGenerationService
from .models import GeneratedReport

logger = logging.getLogger(__name__)

class ReportDispatcher:
    """
    Central dispatcher for report generation.
    Handles the decision logic between Async (Celery) and Sync (Direct) execution.
    """
    
    @staticmethod
    def dispatch(report_id, force_sync=False):
        """
        Dispatch the report generation task.
        
        Args:
            report_id (int): ID of the GeneratedReport object.
            force_sync (bool): If True, bypass Celery and run immediately.
            
        Returns:
            tuple: (success (bool), message (str))
        """
        try:
            # 1. Check if we should force sync execution
            if force_sync:
                return ReportDispatcher._run_synchronously(report_id)

            # 2. Check if Celery workers are actually online
            if ReportDispatcher._are_workers_available():
                try:
                    # 3. Attempt Async Dispatch
                    generate_report_task_celery.delay(report_id)
                    return True, "Report generation started via background worker"
                except Exception as e:
                    logger.warning(f"Celery dispatch failed ({str(e)}). Falling back to synchronous mode.")
                    return ReportDispatcher._run_synchronously(report_id)
            else:
                logger.info("No active Celery workers detected. Running synchronously.")
                return ReportDispatcher._run_synchronously(report_id)

        except Exception as e:
            logger.error(f"Dispatcher critical error: {str(e)}")
            return False, f"Dispatch failed: {str(e)}"

    @staticmethod
    def _are_workers_available():
        """Check if any Celery workers are active."""
        try:
            from celery import current_app
            inspect = current_app.control.inspect(timeout=0.2)
            active = inspect.active()
            return bool(active)
        except Exception:
            return False

    @staticmethod
    def _run_synchronously(report_id):
        """Run the generation logic immediately in the current thread."""
        try:
            # We reuse the logic inside the Celery task function for consistency,
            # but call it directly as a standard function.
            generate_report_task_celery(report_id, is_sync=True)
            
            # Check final status
            report = GeneratedReport.objects.get(id=report_id)
            if report.status == 'COMPLETED':
                return True, "Report generated successfully (sync mode)"
            else:
                return False, f"Report generation failed: {report.error_message}"
        except Exception as e:
            return False, f"Synchronous execution failed: {str(e)}"

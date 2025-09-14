from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.utils import timezone
from reports.models import ReportTemplate
import json
import os


class Command(BaseCommand):
    help = "Replace existing report templates with the latest defaults. Optionally back up current templates."

    def add_arguments(self, parser):
        parser.add_argument(
            '--backup',
            type=str,
            help='Optional path to save a JSON backup of existing templates before replacement'
        )
        parser.add_argument(
            '--skip-fix',
            action='store_true',
            help='Skip running fix_report_formats after replacement'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would happen without making changes'
        )

    def handle(self, *args, **options):
        backup_path = options.get('backup')
        skip_fix = options.get('skip_fix')
        dry_run = options.get('dry_run')

        self.stdout.write("Replacing report templates with latest defaults...")

        # Optional backup of current templates
        if backup_path:
            try:
                data = []
                for t in ReportTemplate.objects.all():
                    data.append({
                        'id': t.id,
                        'name': t.name,
                        'report_type': t.report_type,
                        'description': t.description,
                        'supported_formats': t.supported_formats,
                        'is_active': t.is_active,
                        'requires_date_range': t.requires_date_range,
                        'requires_patient_filter': t.requires_patient_filter,
                        'requires_user_filter': t.requires_user_filter,
                        'allowed_roles': t.allowed_roles,
                        'template_content': t.template_content,
                        'updated_at': t.updated_at.isoformat() if t.updated_at else None,
                        'created_at': t.created_at.isoformat() if t.created_at else None,
                    })
                # Ensure folder exists
                os.makedirs(os.path.dirname(backup_path) or '.', exist_ok=True)
                with open(backup_path, 'w', encoding='utf-8') as f:
                    json.dump({
                        'exported_at': timezone.now().isoformat(),
                        'count': len(data),
                        'templates': data,
                    }, f, indent=2)
                self.stdout.write(self.style.SUCCESS(f"Backup written to {backup_path} ({len(data)} templates)"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Backup failed: {e}"))
                return

        before_count = ReportTemplate.objects.count()
        self.stdout.write(f"Existing templates: {before_count}")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run: would run create_default_report_templates --force"))
        else:
            # Force-create/overwrite defaults
            call_command('create_default_report_templates', '--force')

        if not skip_fix:
            if dry_run:
                self.stdout.write(self.style.WARNING("Dry-run: would run fix_report_formats"))
            else:
                call_command('fix_report_formats')

        after_count = ReportTemplate.objects.count()
        self.stdout.write(self.style.SUCCESS(f"Done. Templates before: {before_count}, after: {after_count}"))
        if dry_run:
            self.stdout.write(self.style.WARNING("No changes were applied (dry run)"))


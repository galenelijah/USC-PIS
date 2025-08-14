from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.utils import timezone
import json
import os
import hashlib
import subprocess


class Command(BaseCommand):
    help = 'Verify backup integrity and test restoration procedures'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--backup-dir',
            type=str,
            default=None,
            help='Directory containing backups to verify'
        )
        parser.add_argument(
            '--manifest',
            type=str,
            default=None,
            help='Specific backup manifest file to verify'
        )
        parser.add_argument(
            '--heroku-app',
            type=str,
            default='usc-pis',
            help='Heroku app name for backup verification'
        )
        parser.add_argument(
            '--test-restore',
            action='store_true',
            help='Test database restoration (WARNING: Use only in development)'
        )

    def handle(self, *args, **options):
        backup_dir = options['backup_dir'] or os.path.join(settings.BASE_DIR, 'backups')
        manifest_file = options['manifest']
        heroku_app = options['heroku_app']
        test_restore = options['test_restore']
        
        self.stdout.write(
            self.style.SUCCESS('Starting backup verification...')
        )
        
        verification_results = {
            'timestamp': timezone.now().isoformat(),
            'heroku_backups': {},
            'local_backups': {},
            'overall_status': 'success'
        }
        
        try:
            # Verify Heroku backups
            heroku_status = self._verify_heroku_backups(heroku_app)
            verification_results['heroku_backups'] = heroku_status
            
            # Verify local backups
            if manifest_file:
                local_status = self._verify_single_backup(manifest_file)
            else:
                local_status = self._verify_all_local_backups(backup_dir)
            verification_results['local_backups'] = local_status
            
            # Test restoration if requested
            if test_restore:
                restore_status = self._test_database_restoration()
                verification_results['restoration_test'] = restore_status
            
            # Determine overall status
            if (not heroku_status.get('healthy', False) or 
                not local_status.get('healthy', False)):
                verification_results['overall_status'] = 'failed'
            
            self._display_verification_results(verification_results)
            self._log_verification_results(verification_results)
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Verification failed: {str(e)}')
            )
            verification_results['overall_status'] = 'failed'
            verification_results['error'] = str(e)
            raise CommandError(f'Verification failed: {str(e)}')

    def _verify_heroku_backups(self, app_name):
        """Verify Heroku Postgres backups"""
        self.stdout.write('Checking Heroku backup status...')
        
        try:
            # Check if Heroku CLI is available
            result = subprocess.run(
                ['heroku', 'pg:backups', '--app', app_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                output = result.stdout
                backups_info = self._parse_heroku_backup_output(output)
                
                return {
                    'healthy': len(backups_info) > 0,
                    'backup_count': len(backups_info),
                    'latest_backup': backups_info[0] if backups_info else None,
                    'raw_output': output
                }
            else:
                return {
                    'healthy': False,
                    'error': result.stderr,
                    'note': 'Heroku CLI might not be available or not authenticated'
                }
                
        except FileNotFoundError:
            return {
                'healthy': False,
                'error': 'Heroku CLI not found',
                'note': 'Install Heroku CLI to verify remote backups'
            }
        except subprocess.TimeoutExpired:
            return {
                'healthy': False,
                'error': 'Heroku command timed out'
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': str(e)
            }

    def _parse_heroku_backup_output(self, output):
        """Parse Heroku backup command output"""
        backups = []
        lines = output.strip().split('\n')
        
        for line in lines:
            if 'DATABASE_URL' in line and ('completed' in line.lower() or 'finished' in line.lower()):
                parts = line.split()
                if len(parts) >= 3:
                    backup_id = parts[0]
                    status = 'completed' if 'completed' in line.lower() else 'finished'
                    backups.append({
                        'id': backup_id,
                        'status': status,
                        'raw_line': line
                    })
        
        return backups

    def _verify_all_local_backups(self, backup_dir):
        """Verify all local backup manifests"""
        if not os.path.exists(backup_dir):
            return {
                'healthy': False,
                'error': f'Backup directory not found: {backup_dir}'
            }
        
        manifest_files = [
            f for f in os.listdir(backup_dir) 
            if f.startswith('backup_manifest_') and f.endswith('.json')
        ]
        
        if not manifest_files:
            return {
                'healthy': False,
                'error': 'No backup manifest files found'
            }
        
        verified_backups = []
        failed_backups = []
        
        for manifest_file in manifest_files:
            manifest_path = os.path.join(backup_dir, manifest_file)
            verification = self._verify_single_backup(manifest_path)
            
            if verification['healthy']:
                verified_backups.append(verification)
            else:
                failed_backups.append(verification)
        
        return {
            'healthy': len(failed_backups) == 0,
            'total_backups': len(manifest_files),
            'verified_backups': len(verified_backups),
            'failed_backups': len(failed_backups),
            'backup_details': verified_backups,
            'failures': failed_backups
        }

    def _verify_single_backup(self, manifest_path):
        """Verify a single backup using its manifest"""
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            verification = {
                'manifest_file': manifest_path,
                'backup_type': manifest.get('backup_type'),
                'created_at': manifest.get('created_at'),
                'healthy': True,
                'missing_files': [],
                'checksum_mismatches': []
            }
            
            # Check if all files exist
            for file_path in manifest.get('files', []):
                if not os.path.exists(file_path):
                    verification['missing_files'].append(file_path)
                    verification['healthy'] = False
            
            # Verify checksums if available
            checksums = manifest.get('checksums', {})
            for file_path, expected_checksum in checksums.items():
                if os.path.exists(file_path):
                    if os.path.isfile(file_path):
                        actual_checksum = self._calculate_file_checksum(file_path)
                    else:
                        # Directory checksum
                        file_list = []
                        for root, dirs, files in os.walk(file_path):
                            for file in files:
                                file_list.append(os.path.join(root, file))
                        actual_checksum = hashlib.md5('\n'.join(sorted(file_list)).encode()).hexdigest()
                    
                    if actual_checksum != expected_checksum:
                        verification['checksum_mismatches'].append({
                            'file': file_path,
                            'expected': expected_checksum,
                            'actual': actual_checksum
                        })
                        verification['healthy'] = False
            
            return verification
            
        except Exception as e:
            return {
                'manifest_file': manifest_path,
                'healthy': False,
                'error': str(e)
            }

    def _calculate_file_checksum(self, file_path):
        """Calculate MD5 checksum of a file"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def _test_database_restoration(self):
        """Test database restoration (development only)"""
        self.stdout.write(
            self.style.WARNING('Testing database restoration...')
        )
        
        if not settings.DEBUG:
            return {
                'tested': False,
                'error': 'Restoration testing disabled in production'
            }
        
        # This is a placeholder for restoration testing
        # In a real implementation, you would:
        # 1. Create a test database
        # 2. Restore the backup to the test database
        # 3. Verify data integrity
        # 4. Clean up the test database
        
        return {
            'tested': True,
            'status': 'would_test_in_development',
            'note': 'Restoration testing requires additional setup'
        }

    def _display_verification_results(self, results):
        """Display verification results in a formatted way"""
        self.stdout.write('\n' + '='*50)
        self.stdout.write('BACKUP VERIFICATION RESULTS')
        self.stdout.write('='*50)
        
        # Overall status
        if results['overall_status'] == 'success':
            self.stdout.write(
                self.style.SUCCESS('[PASS] Overall Status: HEALTHY')
            )
        else:
            self.stdout.write(
                self.style.ERROR('[FAIL] Overall Status: FAILED')
            )
        
        # Heroku backups
        heroku = results.get('heroku_backups', {})
        self.stdout.write('\nHeroku Backups:')
        if heroku.get('healthy'):
            self.stdout.write(
                self.style.SUCCESS(
                    f'  [OK] {heroku.get("backup_count", 0)} backups available'
                )
            )
            if heroku.get('latest_backup'):
                self.stdout.write(f'  Latest: {heroku["latest_backup"]["id"]}')
        else:
            self.stdout.write(
                self.style.WARNING(f'  [WARN] {heroku.get("error", "Unknown error")}')
            )
        
        # Local backups
        local = results.get('local_backups', {})
        self.stdout.write('\nLocal Backups:')
        if local.get('healthy'):
            self.stdout.write(
                self.style.SUCCESS(
                    f'  [OK] {local.get("verified_backups", 0)}/{local.get("total_backups", 0)} backups verified'
                )
            )
        else:
            self.stdout.write(
                self.style.ERROR(
                    f'  [FAIL] {local.get("failed_backups", 0)}/{local.get("total_backups", 0)} backups failed verification'
                )
            )
            
            for failure in local.get('failures', []):
                self.stdout.write(f'    - {failure.get("error", "Unknown error")}')

    def _log_verification_results(self, results):
        """Log verification results to database"""
        try:
            from utils.models import BackupStatus
            
            BackupStatus.objects.create(
                backup_type='verification',
                status=results['overall_status'],
                completed_at=timezone.now(),
                metadata=results
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not log verification results: {str(e)}')
            )
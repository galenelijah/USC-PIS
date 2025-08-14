from django.apps import AppConfig


class UtilsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'utils'
    verbose_name = 'System Utilities & Backup Management'

    def ready(self):
        """
        Called when the app is ready.
        This is where we can set up any app-specific initialization.
        """
        pass

import os
import django
from django.conf import settings

# Setup minimal django
if not settings.configured:
    settings.configure(
        INSTALLED_APPS=['reports', 'patients', 'authentication'],
        TEMPLATES=[{
            'BACKEND': 'django.template.backends.django.DjangoTemplates',
            'APP_DIRS': True,
        }]
    )
    django.setup()

from django.template import Template, Context
from reports.management.commands.create_default_report_templates import Command

cmd = Command()
template_content = cmd.get_generic_template("Test")
# template_content = cmd._apply_shared_styles(template_content)

print("Template content sample:")
print(template_content)

context = Context({'report_data': {'key': 'value'}, 'date_range_start': '2023-01-01', 'date_range_end': '2023-01-31'})
try:
    rendered = Template(template_content).render(context)
    print("\nRendered successfully!")
    print(rendered[:200])
except Exception as e:
    print(f"\nRender failed: {e}")
    import traceback
    traceback.print_exc()

import re

with open('backend/reports/services.py', 'r') as f:
    content = f.read()

# Fix campus substring matching in all instances of ACADEMIC_DIRECTORY_MAP
content = content.replace("if info['campus'] in campus_names]", "if any(c in info['campus'] for c in campus_names)]")
content = content.replace("if info['campus'] in campuses]", "if any(c in info['campus'] for c in campuses)]")
content = content.replace("if info['school'] in school_names]", "if any(s in info['school'] for s in school_names)]")
content = content.replace("if info['school'] in schools]", "if any(s in info['school'] for s in schools)]")

with open('backend/reports/services.py', 'w') as f:
    f.write(content)

print("Backend filters patched")

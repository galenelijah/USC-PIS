import re

with open('frontend/src/components/MedicalHistoryPage.jsx', 'r') as f:
    content = f.read()

content = content.replace("<MenuItem,\n  ListSubheader", "<MenuItem")
content = content.replace("</MenuItem,\n  ListSubheader>", "</MenuItem>")

with open('frontend/src/components/MedicalHistoryPage.jsx', 'w') as f:
    f.write(content)

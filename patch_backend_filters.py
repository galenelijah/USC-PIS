import re

with open('frontend/src/components/MedicalHistoryPage.jsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("MenuItem", "MenuItem,\n  ListSubheader")
content = content.replace("Delete as DeleteIcon,", "Delete as DeleteIcon,\n  School as SchoolIcon")
content = content.replace("import dayjs from 'dayjs';", "import dayjs from 'dayjs';\nimport isBetween from 'dayjs/plugin/isBetween';")
content = content.replace("dayjs.extend(relativeTime);", "dayjs.extend(relativeTime);\ndayjs.extend(isBetween);")

# Add state
state_injection = """  const [insightsDateFilter, setInsightsDateFilter] = useState('30days');
  const academicHistory = selectedPatient?.academic_history || [];"""

content = content.replace("const [insightsStartDate, setInsightsStartDate] = useState(null);", "const [insightsStartDate, setInsightsStartDate] = useState(null);\n" + state_injection)

with open('frontend/src/components/MedicalHistoryPage.jsx', 'w') as f:
    f.write(content)


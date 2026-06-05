import re

with open('frontend/src/components/MedicalHistoryPage.jsx', 'r') as f:
    content = f.read()

# Add customParseFormat
content = content.replace("import isBetween from 'dayjs/plugin/isBetween';", "import isBetween from 'dayjs/plugin/isBetween';\nimport customParseFormat from 'dayjs/plugin/customParseFormat';")
content = content.replace("dayjs.extend(isBetween);", "dayjs.extend(isBetween);\ndayjs.extend(customParseFormat);")

# Update useEffect dependencies
old_effect = """  useEffect(() => {
    filterInsightsRecords();
  }, [records, selectedPatient, insightsStartDate, insightsEndDate, insightsRecordType]);"""

new_effect = """  useEffect(() => {
    filterInsightsRecords();
  }, [records, selectedPatient, insightsStartDate, insightsEndDate, insightsRecordType, insightsDateFilter]);"""

content = content.replace(old_effect, new_effect)

# Change default to Full Academic History
content = content.replace("useState('30days');", "useState('Full Academic History');")

with open('frontend/src/components/MedicalHistoryPage.jsx', 'w') as f:
    f.write(content)

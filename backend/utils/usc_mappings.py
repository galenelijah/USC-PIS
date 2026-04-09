# USC Static Choices Mappings
# This file mirrors the choices in frontend/src/components/static/choices.jsx

PROGRAMS_CHOICES = {
    '1': 'Bachelor of Science in Architecture',
    '2': 'Bachelor of Landscape Architecture',
    '3': 'Bachelor of Science in Interior Design',
    '4': 'Bachelor of Fine Arts major in Advertising Arts',
    '5': 'Bachelor of Fine Arts major in Cinema',
    '6': 'Bachelor of Arts in Anthropology',
    '7': 'Bachelor of Science in Biology',
    '8': 'Bachelor of Science in Marine Biology',
    '9': 'Bachelor of Science in Chemistry',
    '10': 'Bachelor of Arts in English Language Studies',
    '11': 'Bachelor of Arts in Literary and Cultural Studies with Creative Writing',
    '12': 'Bachelor of Arts in Communication major in Media',
    '13': 'Bachelor of Science in Computer Science',
    '14': 'Bachelor of Science in Information Systems',
    '15': 'Bachelor of Science in Information Technology',
    '16': 'Bachelor of Science in Applied Mathematics',
    '17': 'Bachelor of Philosophy',
    '18': 'Bachelor of Science in Applied Physics',
    '19': 'Bachelor of Science in Psychology',
    '20': 'Bachelor of Science in Nursing',
    '21': 'Bachelor of Science in Nutrition and Dietetics',
    '22': 'Bachelor of Science in Pharmacy',
    '23': 'Bachelor of Arts in Political Science major in International Relations and Foreign Service',
    '24': 'Bachelor of Arts in Political Science major in Law and Policy Studies',
    '25': 'Bachelor of Science in Accountancy',
    '26': 'Bachelor of Science in Management Accounting',
    '27': 'Bachelor of Science in Business Administration major in Financial Management',
    '28': 'Bachelor of Science in Business Administration major in Human Resource Management',
    '29': 'Bachelor of Science in Business Administration major in Marketing Management',
    '30': 'Bachelor of Science in Business Administration major in Operations Management',
    '31': 'Bachelor of Science in Entrepreneurship',
    '32': 'Bachelor of Science in Economics',
    '33': 'Bachelor of Science in Hospitality Management',
    '34': 'Bachelor of Science in Tourism Management',
    '35': 'Diploma in Culinary Arts',
    '36': 'Bachelor of Secondary Education major in Science',
    '37': 'Bachelor of Special Needs Education specialization in Early Childhood Education-Montessori Education',
    '38': 'Bachelor of Science in Chemical Engineering',
    '39': 'Bachelor of Science in Civil Engineering',
    '40': 'Bachelor of Science in Computer Engineering',
    '41': 'Bachelor of Science in Electrical Engineering',
    '42': 'Bachelor of Science in Electronics Engineering',
    '43': 'Bachelor of Science in Industrial Engineering',
    '44': 'Bachelor of Science in Mechanical Engineering',
    '45': 'Doctor of Engineering',
    '46': 'Doctor of Philosophy in Biology, Track A: Bioscience',
    '47': 'Doctor of Philosophy in Business Administration',
    '48': 'Doctor of Philosophy in Education, specializations in Research and Evaluation',
    '49': 'Doctor of Philosophy in Information Technology',
    '50': 'Doctor of Philosophy in Philosophy',
    '51': 'Doctor of Philosophy in Physics',
    '52': 'Doctor of Philosophy in Science Education, major in Biology Education, Chemistry Education, or Physics Education',
    '53': 'Juris Doctor',
    '54': 'Master of Business Administration',
    '55': 'Master of Management, major in Hospitality Management, Management Accounting, Tourism Management',
    '56': 'Master of Architecture, major in Architectural Science, Interior Architecture, Landscape Architecture, or Urban Design',
    '57': 'Master of Arts in Anthropology',
    '58': 'Master of Arts in Applied Linguistics',
    '59': 'Master of Arts in Clinical Psychology',
    '60': 'Master of Arts in Economics',
    '61': 'Master of Arts in Education, major in Special Education',
    '62': 'Master of Arts in Literature',
    '63': 'Master of Arts in Philosophy',
    '64': 'Master of Arts in Political Science',
    '65': 'Master of Science in Biology',
    '66': 'Master of Science in Chemical Engineering',
    '67': 'Master of Science in Chemistry',
    '68': 'Master of Science in Computer Engineering',
}

YEAR_LEVEL_CHOICES = {
    '1': '1st Year',
    '2': '2nd Year',
    '3': '3rd Year',
    '4': '4th Year',
}

def get_program_name(program_id):
    if not program_id:
        return ""
    # Convert to string in case it's an int
    pid = str(program_id)
    return PROGRAMS_CHOICES.get(pid, pid)

def get_year_level_name(year_id):
    if not year_id:
        return ""
    # Convert to string in case it's an int
    yid = str(year_id)
    return YEAR_LEVEL_CHOICES.get(yid, yid)

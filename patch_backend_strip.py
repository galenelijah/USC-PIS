import re

with open('backend/reports/services.py', 'r') as f:
    content = f.read()

old_proc_split = "if isinstance(proc_list, str): proc_list = proc_list.split(',')"
new_proc_split = "if isinstance(proc_list, str): proc_list = [p.strip() for p in proc_list.split(',')]"
content = content.replace(old_proc_split, new_proc_split)

old_diag_split = "if isinstance(diag_list, str): diag_list = diag_list.split(',')"
new_diag_split = "if isinstance(diag_list, str): diag_list = [d.strip() for d in diag_list.split(',')]"
content = content.replace(old_diag_split, new_diag_split)

old_role_split = "if isinstance(roles, str): roles = roles.split(',')"
new_role_split = "if isinstance(roles, str): roles = [r.strip() for r in roles.split(',')]"
content = content.replace(old_role_split, new_role_split)

old_campus_split = "if isinstance(campus_names, str): campus_names = campus_names.split(',')"
new_campus_split = "if isinstance(campus_names, str): campus_names = [c.strip() for c in campus_names.split(',')]"
content = content.replace(old_campus_split, new_campus_split)
content = content.replace("campus_names = filters['campus'].split(',') if isinstance(filters['campus'], str) else filters['campus']", "campus_names = [c.strip() for c in filters['campus'].split(',')] if isinstance(filters['campus'], str) else filters['campus']")

old_school_split = "if isinstance(school_names, str): school_names = school_names.split(',')"
new_school_split = "if isinstance(school_names, str): school_names = [s.strip() for s in school_names.split(',')]"
content = content.replace(old_school_split, new_school_split)
content = content.replace("school_names = filters['school'].split(',') if isinstance(filters['school'], str) else filters['school']", "school_names = [s.strip() for s in filters['school'].split(',')] if isinstance(filters['school'], str) else filters['school']")

old_course_split = "if isinstance(course_list, str): course_list = course_list.split(',')"
new_course_split = "if isinstance(course_list, str): course_list = [c.strip() for c in course_list.split(',')]"
content = content.replace(old_course_split, new_course_split)
content = content.replace("courses = filters['course'].split(',') if isinstance(filters['course'], str) else filters['course']", "courses = [c.strip() for c in filters['course'].split(',')] if isinstance(filters['course'], str) else filters['course']")

old_year_split = "if isinstance(level_list, str): level_list = level_list.split(',')"
new_year_split = "if isinstance(level_list, str): level_list = [l.strip() for l in level_list.split(',')]"
content = content.replace(old_year_split, new_year_split)
content = content.replace("levels = filters['year_level'].split(',') if isinstance(filters['year_level'], str) else filters['year_level']", "levels = [l.strip() for l in filters['year_level'].split(',')] if isinstance(filters['year_level'], str) else filters['year_level']")

old_rating_split = "if isinstance(ratings, str): ratings = ratings.split(',')"
new_rating_split = "if isinstance(ratings, str): ratings = [r.strip() for r in ratings.split(',')]"
content = content.replace(old_rating_split, new_rating_split)

# also check if there is any other occurrences of splitting by commas.
content = content.replace("if isinstance(priorities, str): priorities = priorities.split(',')", "if isinstance(priorities, str): priorities = [p.strip() for p in priorities.split(',')]")

with open('backend/reports/services.py', 'w') as f:
    f.write(content)

print("Backend splits patched with strip()")
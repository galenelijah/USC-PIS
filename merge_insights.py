import re

def get_block(content, function_name, is_arrow_fn=True):
    if is_arrow_fn:
        start_idx = content.find(f"const {function_name} =")
    else:
        start_idx = content.find(f"function {function_name}")
        
    if start_idx == -1:
        return None, -1, -1
        
    brace_count = 0
    in_function = False
    
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            brace_count += 1
            in_function = True
        elif content[i] == '}':
            brace_count -= 1
            
        if in_function and brace_count == 0:
            return content[start_idx:i+1], start_idx, i+1
            
    return None, -1, -1

with open('frontend/src/components/MedicalHistoryPage.jsx', 'r') as f:
    orig_content = f.read()

with open('New folder/MedicalHistoryPage.jsx', 'r') as f:
    new_content = f.read()

# Replace filterInsightsRecords
orig_filter_block, start, end = get_block(orig_content, 'filterInsightsRecords')
new_filter_block, _, _ = get_block(new_content, 'filterInsightsRecords')
orig_content = orig_content[:start] + new_filter_block + orig_content[end:]

# Replace renderHealthInsights
orig_render_block, start, end = get_block(orig_content, 'renderHealthInsights')
new_render_block, _, _ = get_block(new_content, 'renderHealthInsights')
orig_content = orig_content[:start] + new_render_block + orig_content[end:]

# Move generateHealthInsights above renderHealthInsights if necessary, or just replace them
orig_gen_block, start, end = get_block(orig_content, 'generateHealthInsights')
if orig_gen_block:
    new_gen_block, _, _ = get_block(new_content, 'generateHealthInsights')
    if new_gen_block:
        orig_content = orig_content[:start] + new_gen_block + orig_content[end:]
        
orig_trend_block, start, end = get_block(orig_content, 'getTrend')
if orig_trend_block:
    new_trend_block, _, _ = get_block(new_content, 'getTrend')
    orig_content = orig_content[:start] + new_trend_block + orig_content[end:]

orig_common_block, start, end = get_block(orig_content, 'getCommonConditions')
if orig_common_block:
    new_common_block, _, _ = get_block(new_content, 'getCommonConditions')
    orig_content = orig_content[:start] + new_common_block + orig_content[end:]
    
orig_rec_block, start, end = get_block(orig_content, 'getRecommendations')
if orig_rec_block:
    new_rec_block, _, _ = get_block(new_content, 'getRecommendations')
    orig_content = orig_content[:start] + new_rec_block + orig_content[end:]
    
orig_visits_block, start, end = get_block(orig_content, 'getMonthlyVisits')
if orig_visits_block:
    new_visits_block, _, _ = get_block(new_content, 'getMonthlyVisits')
    orig_content = orig_content[:start] + new_visits_block + orig_content[end:]


with open('frontend/src/components/MedicalHistoryPage.jsx', 'w') as f:
    f.write(orig_content)


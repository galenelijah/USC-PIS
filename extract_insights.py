import re

def get_block(filepath, function_name):
    with open(filepath, 'r') as f:
        content = f.read()
    
    start_idx = content.find(f"const {function_name} =")
    if start_idx == -1:
        return "Not found"
        
    brace_count = 0
    in_function = False
    
    for i in range(start_idx, len(content)):
        if content[i] == '{':
            brace_count += 1
            in_function = True
        elif content[i] == '}':
            brace_count -= 1
            
        if in_function and brace_count == 0:
            return content[start_idx:i+1]
            
    return "Failed to parse"

print("--- NEW FOLDER renderHealthInsights ---")
print(get_block("New folder/MedicalHistoryPage.jsx", "renderHealthInsights")[:500] + "...")

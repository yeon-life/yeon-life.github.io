import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def inspect_grade_data():
    path = '어린이의_결_초등_월간/js/grade_data.js'
    if not os.path.exists(path):
        print("grade_data.js not found.")
        return
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print(f"grade_data.js size: {len(content)} characters.")
    # Find variable declarations or keys
    # Typically, it might look like window.gradeData = { ... } or const gradeData = { ... }
    # Let's search for keys like "1", "2", "3", "4", "5", "6"
    import re
    keys = re.findall(r'"(\d)"\s*:\s*\{', content)
    print("Found keys in gradeData:", keys)
    
    # Check if there is any mention of "2호" or "호" in the content
    matches = re.findall(r'(\d+호)', content)
    print("Mentions of '호' in grade_data.js:", set(matches))
    
    # Check if there are other files in js/
    js_dir = '어린이의_결_초등_월간/js'
    if os.path.exists(js_dir):
        print(f"Files in {js_dir}:", os.listdir(js_dir))

if __name__ == '__main__':
    inspect_grade_data()

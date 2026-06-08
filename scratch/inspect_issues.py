import os
import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

def extract_issue_data(html_path):
    if not os.path.exists(html_path):
        return None
    try:
        with open(html_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Look for <script id="issue-data" type="application/json">
        match = re.search(r'<script id="issue-data" type="application/json">\s*(.*?)\s*</script>', content, re.DOTALL)
        if match:
            json_str = match.group(1)
            # Sometimes it might be truncated or invalid, let's try to parse
            data = json.loads(json_str)
            return data
        else:
            # Let's search for any json-like config in script tags
            return "No script id='issue-data' found"
    except Exception as e:
        return f"Error: {e}"

def inspect_all():
    paths = {
        '어린이의_결_월간': '어린이의_결_월간/index.html',
        '어린이의_결_유치_월간': '어린이의_결_유치_월간/index.html',
        '어린이의_결_초등_월간': '어린이의_결_초등_월간/index.html'
    }
    
    for label, path in paths.items():
        print(f"=== {label} ({path}) ===")
        data = extract_issue_data(path)
        if isinstance(data, dict):
            print(f"  Issue Name: {data.get('issue', 'N/A')}")
            corners = data.get('corners', [])
            print(f"  Number of corners: {len(corners)}")
            for idx, corner in enumerate(corners):
                print(f"    - Corner {idx+1}: Key={corner.get('key')}, Title={corner.get('title')}, Headline={corner.get('headline')}")
        else:
            print(f"  Data: {data}")

if __name__ == '__main__':
    inspect_all()

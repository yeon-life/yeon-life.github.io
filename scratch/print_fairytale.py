import os
import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

def print_fairytale_from_kindergarten():
    path = '어린이의_결_유치_월간/index.html'
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    match = re.search(r'<script id="issue-data" type="application/json">\s*(.*?)\s*</script>', content, re.DOTALL)
    if match:
        data = json.loads(match.group(1))
        for corner in data.get('corners', []):
            if corner.get('key') == 'fairytale':
                print(json.dumps(corner, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    print_fairytale_from_kindergarten()

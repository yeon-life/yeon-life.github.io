import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_index_html():
    path = '_INDEX_현재까지_완성된것.html'
    if not os.path.exists(path):
        print(f"File {path} does not exist.")
        return
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print("=== Searching for '어린이' or '월간' in _INDEX_현재까지_완성된것.html ===")
    lines = content.split('\n')
    for idx, line in enumerate(lines):
        if '어린이' in line or '월간' in line:
            print(f"Line {idx}: {line.strip()[:120]}")

if __name__ == '__main__':
    check_index_html()

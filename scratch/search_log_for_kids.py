import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def search_log_for_kids():
    path = '연라이프-작업기록.md'
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print("=== Searching for '어린이' or '월간' or '결' in 연라이프-작업기록.md ===")
    for term in ['어린이', '월간', '결', '창간호']:
        if term in content:
            print(f"Found '{term}'")
            lines = content.split('\n')
            for idx, line in enumerate(lines):
                if term in line:
                    print(f"  Line {idx}: {line.strip()[:100]}")

if __name__ == '__main__':
    search_log_for_kids()

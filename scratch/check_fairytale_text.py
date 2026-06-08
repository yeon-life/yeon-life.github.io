import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def check_fairytale_text():
    # Check Kindergarten index.html fairytale
    kinder_path = '어린이의_결_유치_월간/index.html'
    if os.path.exists(kinder_path):
        with open(kinder_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Let's search for "비가" or "내렸어요" or "보슬보슬"
        print("=== Kindergarten fairytale keywords search ===")
        lines = content.split('\n')
        for idx, line in enumerate(lines):
            if '구름' in line or '비' in line or '내렸어요' in line or '미세먼지' in line:
                if 'body_md' in line or idx > 400: # only print content part
                    print(f"Line {idx}: {line.strip()[:120]}")
                    
    # Check Elementary grade_data.js key "1" fairytale
    elem_path = '어린이의_결_초등_월간/js/grade_data.js'
    if os.path.exists(elem_path):
        with open(elem_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        print("\n=== Elementary grade_data.js fairytale keywords search ===")
        # search for fairytale content
        # we can print around the matches
        lines = content.split('\n')
        for idx, line in enumerate(lines):
            if '보물비' in line or '양보해서' in line or '구름' in line:
                # only print near grade 1 data
                if idx < 500: # let's see where grade 1 is
                    print(f"Line {idx}: {line.strip()[:120]}")

if __name__ == '__main__':
    check_fairytale_text()

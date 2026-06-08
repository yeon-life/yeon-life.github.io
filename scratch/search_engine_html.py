import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('c:\\Claude\\연라이프\\AI엔진_종합조사_2026-05.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for idx, line in enumerate(lines, 1):
        if 'tts' in line.lower() or '음성' in line.lower():
            print(f"{idx}: {line.strip()[:120]}")

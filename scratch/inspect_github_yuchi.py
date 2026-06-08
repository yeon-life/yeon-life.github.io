import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

path = 'c:\\Claude\\연라이프\\yeon-life.github.io\\어린이의_결_유치_월간\\index.html'
print("Exists:", os.path.exists(path))
if os.path.exists(path):
    print("Size:", os.path.getsize(path))
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    print("First 500 characters:")
    print(content[:500])

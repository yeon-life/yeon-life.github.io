import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backup_root = 'c:\\Claude\\연라이프\\_백업'
found = []
for root, dirs, files in os.walk(backup_root):
    for file in files:
        if file == 'index.html':
            path = os.path.join(root, file)
            # check if it belongs to a folder with "yuchi" or "어린이의_결_유치_월간" in its original path or backup structure
            if '유치' in path or 'yuchi' in path or '어린이의_결_유치_월간' in root:
                found.append(path)
            # also print all index.html paths in backup just to be safe
            else:
                found.append(path)

print(f"Found {len(found)} index.html backups:")
for f in found:
    print(f)

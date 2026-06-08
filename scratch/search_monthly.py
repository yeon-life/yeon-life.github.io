import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def find_monthly_folders():
    print("=== Scanning directories containing '월간' ===")
    for root, dirs, files in os.walk('.'):
        # Ignore node_modules, .git, and scratch
        if 'node_modules' in root or '.git' in root or 'scratch' in root:
            continue
        for d in dirs:
            if '월간' in d:
                print(f"Directory: {os.path.join(root, d)}")
        for f in files:
            if '월간' in f:
                print(f"File: {os.path.join(root, f)}")

if __name__ == '__main__':
    find_monthly_folders()

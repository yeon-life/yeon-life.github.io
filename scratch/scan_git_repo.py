import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def scan_git_repo():
    git_dir = 'yeon-life.github.io'
    if not os.path.exists(git_dir):
        print(f"{git_dir} does not exist.")
        return
    
    print(f"=== Scanning directories in {git_dir} ===")
    for root, dirs, files in os.walk(git_dir):
        if '.git' in root or 'node_modules' in root:
            continue
        for d in dirs:
            if '어린이' in d or '월간' in d:
                print(f"Directory: {os.path.join(root, d)}")
        for f in files:
            if '월간' in f or 'grade_data' in f:
                print(f"File: {os.path.join(root, f)}")

if __name__ == '__main__':
    scan_git_repo()

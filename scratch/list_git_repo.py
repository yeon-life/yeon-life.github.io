import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def list_git_repo_contents():
    git_dir = 'yeon-life.github.io'
    if not os.path.exists(git_dir):
        print(f"{git_dir} does not exist.")
        return
    
    print(f"=== Listing all files in {git_dir} ===")
    for root, dirs, files in os.walk(git_dir):
        if '.git' in root or 'node_modules' in root:
            continue
        for f in files:
            print(os.path.join(root, f))

if __name__ == '__main__':
    list_git_repo_contents()

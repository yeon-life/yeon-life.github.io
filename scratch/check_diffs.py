import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

repo_dir = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

def run_git(args):
    try:
        return subprocess.check_output(['git'] + args, cwd=repo_dir).decode('utf-8')
    except Exception as e:
        return f"Error: {e}"

print("=== Diff between f5b7f75 (Before any Children's Gyul) and 59ac9f8 (Single Children's Gyul) ===")
print(run_git(['diff', '--name-status', 'f5b7f75', '59ac9f8']))

print("\n=== Diff between 01aad8c (Single Children's Gyul) and 3fdfcde (Separated Kindergarten/Elementary) ===")
print(run_git(['diff', '--name-status', '01aad8c', '3fdfcde']))

import os
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

repo_dir = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"
output_dir = r"C:\Claude\연라이프\scratch\versions"

os.makedirs(output_dir, exist_ok=True)

def save_commit_file(commit, filename, out_name):
    try:
        content = subprocess.check_output(['git', 'show', f'{commit}:{filename}'], cwd=repo_dir)
        out_path = os.path.join(output_dir, out_name)
        with open(out_path, 'wb') as f:
            f.write(content)
        print(f"Saved {commit}:{filename} to {out_path} ({len(content)} bytes)")
    except Exception as e:
        print(f"Error saving {commit}: {e}")

# Save the index.html from:
# 1. 01aad8c (Just before separating into Kindergarten and Elementary)
save_commit_file("01aad8c", "index.html", "index_before_split_01aad8c.html")

# 2. f5b7f75 (Just before adding any Children's Gyul magazine)
save_commit_file("f5b7f75", "index.html", "index_before_any_childrens_gyul_f5b7f75.html")

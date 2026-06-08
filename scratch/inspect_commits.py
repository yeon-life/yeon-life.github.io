import subprocess
import sys

# Set output to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

repo_dir = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

def get_file_at_commit(commit, filename):
    try:
        content = subprocess.check_output(['git', 'show', f'{commit}:{filename}'], cwd=repo_dir).decode('utf-8')
        return content
    except Exception as e:
        return f"Error: {e}"

# Commits to inspect
commits = ["01aad8c", "59ac9f8", "f5b7f75"]

for commit in commits:
    print(f"\n==================== {commit} ====================")
    content = get_file_at_commit(commit, "index.html")
    if "Error:" in content:
        print(content)
        continue
    
    # Print lines that seem to define the navigation items
    lines = content.split('\n')
    nav_lines = []
    in_navbar = False
    for line in lines:
        if 'class="navbar-inner"' in line:
            in_navbar = True
        if in_navbar:
            nav_lines.append(line.strip())
            if '</nav>' in line:
                in_navbar = False
                break
    print("Navbar HTML:")
    print("\n".join(nav_lines))

    # Print version info or date/author
    commit_info = subprocess.check_output(['git', 'log', '-1', '--format=%ad %an: %s', commit], cwd=repo_dir).decode('utf-8')
    print("Commit info:", commit_info.strip())

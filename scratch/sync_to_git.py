import os
import shutil

src_dir = r"C:\Claude\연라이프\yeon-life.github.io"
dest_dir = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

# 1. Copy index.html
print("Syncing index.html...")
shutil.copy2(os.path.join(src_dir, "index.html"), os.path.join(dest_dir, "index.html"))

# 2. Copy 어린이의_결_월간 folder
print("Syncing 어린이의_결_월간...")
src_children_dir = os.path.join(src_dir, "어린이의_결_월간")
dest_children_dir = os.path.join(dest_dir, "어린이의_결_월간")

if os.path.exists(dest_children_dir):
    shutil.rmtree(dest_children_dir)

shutil.copytree(src_children_dir, dest_children_dir)

# 3. If there are any deleted files that we need to represent in Git,
# since we are restoring to before split, the folders 어린이의_결_유치_월간 and 어린이의_결_초등_월간
# should be deleted in the Git repo if they exist!
# Wait, let's check if they exist in the git repo.
print("Syncing deletions (유치_월간, 초등_월간)...")
for folder in ["어린이의_결_유치_월간", "어린이의_결_초등_월간"]:
    git_folder = os.path.join(dest_dir, folder)
    if os.path.exists(git_folder):
        shutil.rmtree(git_folder)
        print(f"Removed {folder} from Git repo directory")

print("Sync completed!")

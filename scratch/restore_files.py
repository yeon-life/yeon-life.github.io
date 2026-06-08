import os
import shutil

src_root = r"C:\Claude\연라이프"
github_root = os.path.join(src_root, "yeon-life.github.io")

# 1. Paths
index_before_split = os.path.join(src_root, "scratch", "versions", "index_before_split_01aad8c.html")
children_index_before_split = os.path.join(src_root, "scratch", "versions", "어린이의_결_월간_index_before_split_01aad8c.html")

# 2. Copy index.html
print("Copying main index.html...")
shutil.copy2(index_before_split, os.path.join(src_root, "index.html"))
shutil.copy2(index_before_split, os.path.join(github_root, "index.html"))

# 3. Copy 어린이의_결_월간/index.html
print("Copying children monthly index.html...")
os.makedirs(os.path.join(src_root, "어린이의_결_월간"), exist_ok=True)
os.makedirs(os.path.join(github_root, "어린이의_결_월간"), exist_ok=True)
shutil.copy2(children_index_before_split, os.path.join(src_root, "어린이의_결_월간", "index.html"))
shutil.copy2(children_index_before_split, os.path.join(github_root, "어린이의_결_월간", "index.html"))

# 4. Copy images
print("Restoring images for children monthly magazine...")
src_img_dir = os.path.join(src_root, "어린이의_결_유치_월간", "img")
if not os.path.exists(src_img_dir):
    src_img_dir = os.path.join(github_root, "어린이의_결_유치_월간", "img")

dest_img_dir_root = os.path.join(src_root, "어린이의_결_월간", "img")
dest_img_dir_github = os.path.join(github_root, "어린이의_결_월간", "img")

os.makedirs(dest_img_dir_root, exist_ok=True)
os.makedirs(dest_img_dir_github, exist_ok=True)

images = [
    "corner-cover.webp",
    "corner-english.webp",
    "corner-fairytale.webp",
    "corner-future.webp",
    "corner-habit.webp",
    "corner-hangeul.webp",
    "corner-math.webp",
    "corner-parents.webp"
]

for img in images:
    src_path = os.path.join(src_img_dir, img)
    if os.path.exists(src_path):
        shutil.copy2(src_path, os.path.join(dest_img_dir_root, img))
        shutil.copy2(src_path, os.path.join(dest_img_dir_github, img))
        print(f"Copied {img}")
    else:
        print(f"Warning: Image {img} not found at {src_path}")

# 5. Clean up temp preview files
print("Cleaning up temp preview files...")
for temp_file in ["index_temp_preview.html", "index_temp_preview_no_children.html"]:
    temp_path = os.path.join(src_root, temp_file)
    if os.path.exists(temp_path):
        os.remove(temp_path)
        print(f"Removed {temp_file}")

print("Restoration completed locally!")

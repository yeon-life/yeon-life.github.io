import os
import sys
import subprocess
import re

# Ensure pillow is installed
try:
    from PIL import Image
except ImportError:
    print("Pillow library not found. Installing it now...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

TARGET_DIR = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"
BACKUP_DIR = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\_backup_images"

# File extensions to scan for updating image links
TEXT_EXTS = ['.html', '.js', '.css', '.json']

# Exclude directories
EXCLUDE_DIRS = ['.git', 'node_modules', '.vercel']

def setup_directories():
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        print(f"Created backup directory: {BACKUP_DIR}")

def convert_png_to_webp(png_path, quality=80):
    """Converts a PNG image to WebP and saves it in the same directory."""
    webp_path = os.path.splitext(png_path)[0] + ".webp"
    try:
        with Image.open(png_path) as img:
            # Convert RGBA to RGB if saving as WebP without alpha, but WebP supports RGBA.
            # We preserve RGBA just in case.
            img.save(webp_path, "WEBP", quality=quality)
        orig_size = os.path.getsize(png_path)
        new_size = os.path.getsize(webp_path)
        print(f"✓ Converted: {os.path.basename(png_path)} ({orig_size/1024/1024:.2f}MB) -> WebP ({new_size/1024/1024:.2f}MB) [Reduced by {(orig_size-new_size)/orig_size*100:.1f}%]")
        return webp_path
    except Exception as e:
        print(f"✗ Failed to convert {png_path}: {e}")
        return None

def update_references(old_filename, new_filename):
    """Searches all HTML, JS, CSS files and replaces occurrences of old_filename with new_filename."""
    count = 0
    for root, dirs, files in os.walk(TARGET_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in TEXT_EXTS:
                file_path = os.path.join(root, f)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                        content = file_obj.read()
                    
                    # Look for old filename (case-insensitive or exact)
                    # Use regex to match old_filename exactly
                    pattern = re.compile(re.escape(old_filename), re.IGNORECASE)
                    if pattern.search(content):
                        new_content = pattern.sub(new_filename, content)
                        with open(file_path, 'w', encoding='utf-8') as file_obj:
                            file_obj.write(new_content)
                        count += 1
                except Exception as e:
                    print(f"  Error reading/writing {f}: {e}")
    if count > 0:
        print(f"  → Updated references in {count} file(s)")

def main():
    setup_directories()
    
    print("\nStep 1: Finding large PNG files to optimize...")
    png_files = []
    for root, dirs, files in os.walk(TARGET_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f.lower().endswith('.png'):
                full_path = os.path.join(root, f)
                size = os.path.getsize(full_path)
                # Optimize any PNG larger than 500KB to WebP
                if size > 500 * 1024:
                    png_files.append((full_path, size))
    
    print(f"Found {len(png_files)} PNG files larger than 500KB.")
    
    converted_count = 0
    for png_path, size in png_files:
        filename = os.path.basename(png_path)
        print(f"\nProcessing {filename} ({size/1024/1024:.2f} MB)...")
        
        # 1. Convert to WebP
        webp_path = convert_png_to_webp(png_path, quality=82)
        
        if webp_path:
            # 2. Update references in code
            webp_filename = os.path.basename(webp_path)
            update_references(filename, webp_filename)
            
            # 3. Move original PNG to backup folder
            backup_path = os.path.join(BACKUP_DIR, filename)
            try:
                # If backup file already exists, rename it
                if os.path.exists(backup_path):
                    base, ext = os.path.splitext(filename)
                    import time
                    backup_path = os.path.join(BACKUP_DIR, f"{base}_{int(time.time())}{ext}")
                
                os.rename(png_path, backup_path)
                print(f"  → Moved original PNG to backup: {os.path.basename(backup_path)}")
                converted_count += 1
            except Exception as e:
                print(f"  ✗ Failed to backup/remove original PNG: {e}")
                
    print(f"\nJob complete! Successfully optimized {converted_count} files.")
    print(f"Original files are safely stored in: {BACKUP_DIR}")

if __name__ == "__main__":
    main()

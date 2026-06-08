import os
import shutil
import glob

# Source directory containing the generated images in the brain/artifact workspace
SOURCE_DIR = r"C:\Users\jinwo\AppData\Roaming\antigravity\brain\232387af-1028-46a3-9338-aad43822831f"
if not os.path.exists(SOURCE_DIR):
    # Fallback to local profile directory path if AppData differs
    SOURCE_DIR = r"C:\Users\jinwo\.gemini\antigravity\brain\232387af-1028-46a3-9338-aad43822831f"

# Destination directory for the project
DEST_DIR = r"C:\C-Antigravity\연라이프-도서관\완성책장\005_두글자단어만들기\images"

# Mapping prefix to destination filename
MAPPING = {
    "cover": "cover.png",
    "p01": "p01.png",
    "p02": "p02.png",
    "p03": "p03.png",
    "p04": "p04.png",
    "p05": "p05.png",
    "p06": "p06.png",
    "p07": "p07.png",
    "p08": "p08.png",
    "p09": "p09.png",
    "p10": "p10.png",
    "p11": "p11.png",
    "p12": "p12.png",
    "p13": "p13.png",
    "p14": "p14.png",
    "p15": "p15.png",
    "p16": "p16.png",
    "craft01": "craft01.png",
    "craft02": "craft02.png",
    "craft03": "craft03.png"
}

def copy_images():
    print(f"Creating destination directory if not exists: {DEST_DIR}")
    os.makedirs(DEST_DIR, exist_ok=True)
    
    success_count = 0
    
    for prefix, dest_name in MAPPING.items():
        # Match files starting with prefix followed by underscore (e.g. cover_*.png)
        pattern = os.path.join(SOURCE_DIR, f"{prefix}_*.png")
        matching_files = glob.glob(pattern)
        
        if not matching_files:
            print(f"[Warning] No files found matching pattern: {pattern}")
            continue
            
        # If there are multiple, get the latest one by modification time
        latest_file = max(matching_files, key=os.path.getmtime)
        dest_path = os.path.join(DEST_DIR, dest_name)
        
        try:
            print(f"Copying: {os.path.basename(latest_file)} -> {dest_name}")
            shutil.copy2(latest_file, dest_path)
            success_count += 1
        except Exception as e:
            print(f"[Error] Failed to copy {latest_file} to {dest_path}: {e}")
            
    print(f"\nCompleted copying {success_count}/{len(MAPPING)} images.")

if __name__ == "__main__":
    copy_images()

import os
import shutil

# Source directory containing the generated images (Brain directory)
src_dir = r"C:\Users\jinwo\.gemini\antigravity\brain\4f3ac161-fe6e-4271-b1a7-96ac13b50afd"

# Destination directory
dest_dir = r"C:\C-Antigravity\연라이프-도서관\완성책장\006_세글자단어친구들\images"

# Mapping of source generated files to destination files
mapping = {
    "cover_1780334203708.png": ["cover.png"],
    "p01_1780334233457.png": ["p01.png"],
    "p02_1780334251920.png": ["p02.png"],
    "p03_1780334277738.png": ["p03.png"],
    "p04_1780334295444.png": ["p04.png"],
    "p05_1780334318201.png": ["p05.png"],
    "p06_1780334337686.png": ["p06.png"],
    "p07_1780334359415.png": ["p07.png"],
    "p08_1780334377789.png": ["p08.png"],
    "p09_1780334395929.png": ["p09.png"],
    "p10_1780334415126.png": ["p10.png"],
    "p11_1780334437261.png": ["p11.png"],
    "p12_1780334465024.png": ["p12.png"],
    "p13_1780334490315.png": ["p13.png"],
    "p14_1780334508974.png": ["p14.png"],
    "play01_1780334537570.png": ["play01.png", "play01_바나나.png", "craft01.png"],
    "play02_1780334622546.png": ["play02.png", "play02_동물친구.png", "craft02.png"],
    "play03_1780334643795.png": ["play03.png", "play03_단어잔치.png", "craft03.png"]
}

def copy_images():
    os.makedirs(dest_dir, exist_ok=True)
    print(f"Starting image copying from {src_dir} to {dest_dir}...")
    for src_file, dest_files in mapping.items():
        src_path = os.path.join(src_dir, src_file)
        if not os.path.exists(src_path):
            print(f"Warning: Source file {src_file} does not exist in {src_dir}.")
            continue
        for dest_file in dest_files:
            dest_path = os.path.join(dest_dir, dest_file)
            shutil.copy2(src_path, dest_path)
            print(f"Copied {src_file} -> {dest_file}")
    print("Image copying completed successfully.")

if __name__ == "__main__":
    copy_images()

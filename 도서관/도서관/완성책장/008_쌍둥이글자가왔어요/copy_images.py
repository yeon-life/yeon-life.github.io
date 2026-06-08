import os
import glob
import shutil

def main():
    brain_dir = r"C:\Users\jinwo\.gemini\antigravity\brain\01701633-4229-42aa-8d6f-848de763bc8b"
    dest_dir = r"C:\C-Antigravity\연라이프-도서관\완성책장\008_쌍둥이글자가왔어요\images"
    
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)
        print(f"Created destination directory: {dest_dir}")
        
    # We want to copy files matching the generated image patterns
    # Schema pattern: {slot_id}_{timestamp}.png
    # Map them to {slot_id}.png in destination
    files = glob.glob(os.path.join(brain_dir, "*.png"))
    for filepath in files:
        filename = os.path.basename(filepath)
        # Check if the filename fits the pattern like slot_timestamp.png
        # Find the last underscore
        parts = filename.rsplit('_', 1)
        if len(parts) == 2 and parts[1].endswith('.png') and parts[1][:-4].isdigit():
            slot_id = parts[0]
            # Replace underscores or map specifically
            # Some slot IDs have hyphens in the markdown but we passed name to generate_image
            # let's match slot_id
            dest_filename = slot_id.replace('_', '-') + '.png'
            dest_path = os.path.join(dest_dir, dest_filename)
            shutil.copy2(filepath, dest_path)
            print(f"Copied {filename} to {dest_filename}")

if __name__ == "__main__":
    main()

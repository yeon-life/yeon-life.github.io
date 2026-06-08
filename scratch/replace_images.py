import os
from PIL import Image

# Paths to the newly generated PNG files in the artifact directory
generated_files = {
    "cover": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_cover_alt_1780845938502.png",
    "weekly": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_weekly_alt_1780845954205.png",
    "mythbust": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_mythbust_alt_1780845972231.png",
    "app": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_app_alt_1780847489215.png",
    "voice": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_voice_alt_1780847502624.png",
    "word": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_word_alt_1780847517067.png",
    "future": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_future_alt_1780847532907.png",
    "qna": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_qna_alt_1780847548091.png",
    "tobook": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\corner_tobook_alt_1780847571748.png",
    "intro-poster": r"C:\Users\jinwo\.gemini\antigravity\brain\4c500a70-29b1-4e6f-9337-46aa54973cf2\intro_poster_alt_1780847590262.png"
}

dest_dirs = [
    r"c:\Claude\연라이프\yeon-life.github.io\내친구인공지능_월간\img",
    r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\내친구인공지능_월간\img"
]

def process_file(key, src_path):
    print(f"Processing {key} -> {src_path}")
    if not os.path.exists(src_path):
        print(f"ERROR: {src_path} does not exist!")
        return

    # Open the image using Pillow
    img = Image.open(src_path)

    # For each destination directory
    for dest_dir in dest_dirs:
        os.makedirs(dest_dir, exist_ok=True)
        
        # 1. Save as PNG
        if key == "intro-poster":
            dest_png = os.path.join(dest_dir, "intro-poster.png")
        else:
            dest_png = os.path.join(dest_dir, f"corner-{key}.png")
        img.save(dest_png, "PNG")
        print(f"  Saved PNG to: {dest_png}")

        # 2. Save as WebP (skip for intro-poster as it is strictly PNG)
        if key != "intro-poster":
            dest_webp = os.path.join(dest_dir, f"corner-{key}.webp")
            img.save(dest_webp, "WEBP", quality=85)
            print(f"  Saved WebP to: {dest_webp}")

def main():
    for key, path in generated_files.items():
        process_file(key, path)
    print("All images updated successfully!")

if __name__ == "__main__":
    main()

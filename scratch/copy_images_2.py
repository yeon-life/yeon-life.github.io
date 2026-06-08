import os
from PIL import Image

generated_files = {
    "cover-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_cover_2_1780893182823.png",
    "math-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_math_2_1780893196338.png",
    "hangeul-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_hangeul_2_1780893210688.png",
    "english-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_english_2_1780893225145.png",
    "future-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_future_2_1780893239640.png",
    "fairytale-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_fairytale_2_1780893254491.png",
    "habit-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_habit_2_1780893269293.png",
    "parents-2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\corner_parents_2_1780893281547.png"
}

dest_dirs = [
    r"c:\Claude\연라이프\yeon-life.github.io\어린이의_결_유치_월간\img",
    r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\img"
]

def main():
    for key, src_path in generated_files.items():
        print(f"Processing {key} -> {src_path}")
        if not os.path.exists(src_path):
            print(f"ERROR: {src_path} does not exist!")
            continue

        img = Image.open(src_path)
        for dest_dir in dest_dirs:
            os.makedirs(dest_dir, exist_ok=True)
            
            # Save as WebP
            dest_webp = os.path.join(dest_dir, f"corner-{key}.webp")
            img.save(dest_webp, "WEBP", quality=90)
            print(f"  Saved WebP to: {dest_webp}")

    print("All images copied and converted successfully!")

if __name__ == "__main__":
    main()

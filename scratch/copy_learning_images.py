import os
from PIL import Image

generated_files = {
    "slide_1": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_1_1780923564322.png",
    "slide_2": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_2_1780923582808.png",
    "slide_3": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_3_1780923601429.png",
    "slide_4": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_4_1780923620267.png",
    "slide_5": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_5_1780923636302.png",
    "slide_6": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_6_1780923653811.png",
    "slide_7": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_7_1780923671702.png",
    "slide_8": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_8_1780923687251.png",
    "slide_9": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_9_1780923703540.png",
    "slide_10": r"C:\Users\jinwo\.gemini\antigravity\brain\cdfbb340-800a-435c-920b-c954f76b62a9\slide_10_1780923719399.png"
}

dest_dir = r"C:\Claude\연라이프\진짜_배움_영상\img"
os.makedirs(dest_dir, exist_ok=True)

def main():
    for name, src_path in generated_files.items():
        print(f"Processing {name} -> {src_path}")
        if not os.path.exists(src_path):
            print(f"ERROR: {src_path} does not exist!")
            continue
            
        img = Image.open(src_path)
        dest_webp = os.path.join(dest_dir, f"{name}.webp")
        img.save(dest_webp, "WEBP", quality=95)
        print(f"  Saved WebP to: {dest_webp}")
        
    print("All illustrations copied and converted successfully!")

if __name__ == "__main__":
    main()

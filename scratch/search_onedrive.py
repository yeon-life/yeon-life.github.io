import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_onedrive():
    path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"
    if os.path.exists(path):
        print(f"OneDrive path exists: {path}")
        print("Subdirectories:")
        for item in os.listdir(path):
            full_path = os.path.join(path, item)
            if os.path.isdir(full_path):
                print(f"  [DIR] {item}")
            else:
                print(f"  [FILE] {item}")
    else:
        print(f"OneDrive path does not exist: {path}")

if __name__ == '__main__':
    check_onedrive()

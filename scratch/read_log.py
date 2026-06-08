import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def read_first_lines(path):
    if not os.path.exists(path):
        print(f"File {path} does not exist.")
        return
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    print(f"=== {path} (first 30 lines) ===")
    for line in lines[:30]:
        print(line, end='')

if __name__ == '__main__':
    read_first_lines('연라이프-작업기록.md')

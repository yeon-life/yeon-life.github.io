import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_myfriend_ai():
    paths = [
        'yeon-life.github.io/내친구인공지능_월간',
        'yeon-life.github.io/내친구인공지능_책'
    ]
    for p in paths:
        if os.path.exists(p):
            print(f"=== Files in {p} ===")
            for item in os.listdir(p):
                print(item)
        else:
            print(f"Path does not exist: {p}")

if __name__ == '__main__':
    check_myfriend_ai()

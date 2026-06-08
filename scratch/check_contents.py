import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_kindergarten():
    path = '어린이의_결_유치_월간/index.html'
    if not os.path.exists(path):
        print("Kindergarten index.html does not exist.")
        return
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    keywords = [
        "느껴보아요",
        "식물이 좋아하는 맛있는 밥",
        "귀여운 아기 고양이처럼",
        "비밀을 다른 곳에 이야기",
        "아기 구름 친구들을",
        "시원하게 내렸어요"
    ]
    
    print("=== Checking Kindergarten index.html ===")
    for kw in keywords:
        found = kw in content
        print(f"Keyword '{kw}': {'FOUND' if found else 'NOT FOUND'}")

def check_elementary():
    path = '어린이의_결_초등_월간/js/grade_data.js'
    if not os.path.exists(path):
        print("Elementary grade_data.js does not exist.")
        return
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    keywords = [
        "힘을 양옆으로 잘 나누어서",
        "따뜻하고 생각 표현을 잘하는 멋진 어린이",
        "재미있게 소리 놀이를 해보세요",
        "우리가 이야기한 비밀을 기억해 두었다가",
        "시들어가는 친구들을 도와줄래",
        "부드럽게 내려주었답니다",
        "스스로 나와의 약속을 지켜요"
    ]
    
    print("=== Checking Elementary grade_data.js ===")
    for kw in keywords:
        found = kw in content
        print(f"Keyword '{kw}': {'FOUND' if found else 'NOT FOUND'}")

if __name__ == '__main__':
    check_kindergarten()
    check_elementary()

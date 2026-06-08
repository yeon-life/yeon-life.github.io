import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def apply_corrections_to_file(file_path):
    if not os.path.exists(file_path):
        print(f"File {file_path} does not exist.")
        return
        
    print(f"=== Processing {file_path} ===")
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    original_content = content
    
    # 1. Terminology: replace "학원" with "아카데미"
    # Let's see some specific common contexts:
    # "학원에 등원" -> "아카데미에 등원"
    # "학원을 마칠 때" -> "아카데미를 마칠 때"
    # "학원 선생님" -> "아카데미 선생님"
    # "학원 컴퓨터" -> "아카데미 컴퓨터"
    # Let's do a general replacement of "학원" to "아카데미", but checking where it might be.
    # To be safe, we can replace "학원" with "아카데미" in most text contexts.
    content = content.replace("학원에", "아카데미에")
    content = content.replace("학원을", "아카데미를")
    content = content.replace("학원 선생님", "아카데미 선생님")
    content = content.replace("학원 컴퓨터", "아카데미 컴퓨터")
    content = content.replace("학원 학습기", "아카데미 학습기")
    content = content.replace("학원 등원", "아카데미 등원")
    content = content.replace("학원도", "아카데미도")
    content = content.replace("학원에서", "아카데미에서")
    
    # 2. Fairytale: remove fine dust/dust friends ("미세먼지 친구들", "먼지 친구들" etc.)
    # Replace "먼지 친구들" / "미세 먼지 친구들" with "아기 구름 친구들"
    content = content.replace("먼지 친구들을 꼭 껴안고", "아기 구름 친구들을 꼭 껴안고")
    content = content.replace("먼지 친구들을 부둥켜 안고", "아기 구름 친구들을 꼭 안고")
    content = content.replace("미세 먼지 친구들을 껴안고", "아기 구름 친구들을 꼭 안고")
    content = content.replace("회색 먼지 친구들을 감싸 쥔", "아기 구름 친구들을 감싸 안은")
    content = content.replace("미세한 먼지 친구들을 꼬옥 껴안으며", "다른 아기 구름 친구들을 꼬옥 껴안으며")
    content = content.replace("회색 먼지 친구들을 감싸 안은", "아기 구름 친구들을 감싸 안은")
    content = content.replace("미세먼지 친구들", "아기 구름 친구들")
    content = content.replace("미세 먼지 친구들", "아기 구름 친구들")
    content = content.replace("먼지 친구들", "아기 구름 친구들")
    
    # 3. Tone of voice: "착한 어린이" -> "멋진 어린이" (in parents corners)
    content = content.replace("착한 어린이는", "멋진 어린이는")
    
    if content != original_content:
        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  Updated successfully.")
    else:
        print(f"  No changes needed.")

if __name__ == '__main__':
    files = [
        '어린이의_결_초등_월간/js/grade_data.js',
        '어린이의_결_유치_월간/index.html'
    ]
    for f in files:
        apply_corrections_to_file(f)

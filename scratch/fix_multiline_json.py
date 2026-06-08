# -*- coding: utf-8 -*-
import os

def fix_js_multiline_strings(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File not found {file_path}")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    output = []
    in_string = False
    string_char = None
    i = 0
    n = len(content)

    while i < n:
        char = content[i]
        
        if not in_string:
            output.append(char)
            if char in ('"', "'", '`'):
                in_string = True
                string_char = char
        else:
            # 문자열 내부인 경우
            if char == '\\':
                # 이스케이프 문자 처리 (다음 문자는 무조건 그냥 포함)
                output.append(char)
                if i + 1 < n:
                    output.append(content[i+1])
                    i += 1
            elif char == string_char:
                # 문자열의 끝
                output.append(char)
                in_string = False
                string_char = None
            elif char == '\n':
                # 문자열 안에서 실제 줄바꿈을 만나면 \n 텍스트로 치환
                output.append('\\n')
            elif char == '\r':
                # CR 문자는 생략하고 LF만 \n으로 치환하도록 처리
                pass
            else:
                output.append(char)
        i += 1

    fixed_content = "".join(output)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(fixed_content)
    print("Successfully fixed multiline string literals in grade_data.js!")

if __name__ == "__main__":
    target = r"c:\Claude\연라이프\어린이의_결_월간\js\grade_data.js"
    fix_js_multiline_strings(target)

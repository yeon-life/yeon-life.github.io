import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def search_work_logs():
    files_to_search = [
        '연라이프-작업기록.md',
        '연라이프-작업기록.html',
        '연플래닝-작업기록.md',
        '연플래닝-작업기록.html',
        '영풀-작업기록.md',
        '영풀-작업기록.html',
        '수풀-작업기록.md',
        '수풀-작업기록.html'
    ]
    
    print("=== Searching Work Logs for '월간지' or '2호' ===")
    for f in files_to_search:
        if os.path.exists(f):
            try:
                with open(f, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    content = file_obj.read()
                    for term in ['월간지', '2호', '유치_월간', '초등_월간']:
                        if term in content:
                            print(f"Found '{term}' in {f}")
                            # print context
                            lines = content.split('\n')
                            for idx, line in enumerate(lines):
                                if term in line:
                                    print(f"  Line {idx}: {line.strip()[:120]}")
            except Exception as e:
                print(f"Error reading {f}: {e}")
        else:
            print(f"File {f} does not exist.")

if __name__ == '__main__':
    search_work_logs()

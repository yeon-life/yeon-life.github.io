import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def search_files(directory, query):
    results = []
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if not file.endswith(('.html', '.js', '.json', '.md', '.py', '.txt')):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for line_num, line in enumerate(f, 1):
                        if query in line:
                            results.append((path, line_num, line.strip()))
            except Exception:
                pass
    return results

if __name__ == '__main__':
    res = search_files('c:\\Claude\\연라이프', '어린이의_결_유치_월간')
    print(f"Found {len(res)} matches:")
    for r in res[:30]:
        print(f"{r[0]}:{r[1]}: {r[2][:120]}")

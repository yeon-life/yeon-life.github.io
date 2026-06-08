import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def search_files(directory, query):
    results = []
    for file in os.listdir(directory):
        path = os.path.join(directory, file)
        if not os.path.isfile(path):
            continue
        if not file.endswith(('.html', '.js', '.json', '.md', '.py', '.txt')):
            continue
        try:
            with open(path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    if query.lower() in line.lower():
                        results.append((path, line_num, line.strip()))
        except Exception:
            pass
    return results

if __name__ == '__main__':
    for q in ['tts', '음성', '목소리']:
        res = search_files('c:\\Claude\\연라이프', q)
        print(f"--- Matches for '{q}' ---")
        for r in res[:20]:
            print(f"{os.path.basename(r[0])}:{r[1]}: {r[2][:120]}")

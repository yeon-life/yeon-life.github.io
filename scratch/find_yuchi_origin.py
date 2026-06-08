import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def search_phrase(directory, query):
    results = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if not file.endswith(('.html', '.js', '.json', '.md', '.txt')):
                continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                if query in content:
                    results.append(path)
            except Exception:
                pass
    return results

if __name__ == '__main__':
    res = search_phrase('c:\\Claude\\연라이프', '지렁이 친구야')
    print(f"Found matches for '지렁이 친구야':")
    for r in res:
        print(f"  {r} (size: {os.path.getsize(r)} bytes)")

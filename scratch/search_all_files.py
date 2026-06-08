import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def search_text_everywhere(keywords):
    print(f"=== Searching for keywords: {keywords} ===")
    for root, dirs, files in os.walk('.'):
        # Skip directories
        if any(p in root for p in ['node_modules', '.git', 'scratch', '_백업', 'yeon-life.github.io']):
            continue
        for f in files:
            if f.endswith(('.html', '.js', '.md', '.txt', '.json', '.docx')):
                path = os.path.join(root, f)
                try:
                    # For docx, we'll just search by filename first, or skip it
                    if f.endswith('.docx'):
                        if any(kw in f for kw in keywords):
                            print(f"Match in filename: {path}")
                        continue
                    with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                        content = file_obj.read()
                        for kw in keywords:
                            if kw in content:
                                count = content.count(kw)
                                print(f"Found '{kw}' in {path}: {count} times")
                                # Print first few matching lines
                                for line in content.split('\n'):
                                    if kw in line:
                                        print(f"  Line: {line.strip()[:100]}")
                                        break
                except Exception as e:
                    pass

if __name__ == '__main__':
    search_text_everywhere(['월간지_2', '월간지 2', '월간지2', '2호', '3호'])

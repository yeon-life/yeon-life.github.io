import os
import sys

# Configure output to support UTF-8
sys.stdout.reconfigure(encoding='utf-8')

def list_files(dir_path):
    print(f"=== Files in {dir_path} ===")
    try:
        for item in os.listdir(dir_path):
            full_path = os.path.join(dir_path, item)
            is_dir = os.path.isdir(full_path)
            size = os.path.getsize(full_path) if not is_dir else 0
            print(f"{'[DIR]' if is_dir else '[FILE]'} {item} ({size} bytes)")
    except Exception as e:
        print(f"Error listing {dir_path}: {e}")

def search_text_in_files(keyword):
    print(f"=== Searching for '{keyword}' ===")
    for root, dirs, files in os.walk('.'):
        if 'node_modules' in root or '.git' in root or 'scratch' in root or '_백업' in root:
            continue
        for f in files:
            if f.endswith(('.html', '.js', '.md', '.json', '.txt')):
                full_path = os.path.join(root, f)
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                        content = file_obj.read()
                        if keyword in content:
                            count = content.count(keyword)
                            print(f"Found in {full_path}: {count} times")
                except Exception as e:
                    pass

if __name__ == '__main__':
    # List some core directories
    list_files('.')
    list_files('./어린이의_결_월간')
    list_files('./어린이의_결_유치_월간')
    list_files('./어린이의_결_초등_월간')
    
    # Search for "월간지" or "3호" or other keywords
    search_text_in_files("월간지")
    search_text_in_files("3호")

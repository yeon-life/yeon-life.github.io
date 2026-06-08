import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def search_brain_folders():
    brain_dir = r'C:\Users\jinwo\.gemini\antigravity\brain'
    if not os.path.exists(brain_dir):
        print("Brain directory does not exist.")
        return
    
    print(f"=== Searching in {brain_dir} ===")
    for root, dirs, files in os.walk(brain_dir):
        for f in files:
            if f.endswith(('.md', '.json', '.jsonl')):
                path = os.path.join(root, f)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                        content = file_obj.read()
                        if '월간지_2' in content or '월간지 2' in content or '월간지2' in content:
                            print(f"Found keyword in brain file: {path}")
                            # Print some context lines around the match
                            lines = content.split('\n')
                            for idx, line in enumerate(lines):
                                if any(kw in line for kw in ['월간지_2', '월간지 2', '월간지2']):
                                    start = max(0, idx - 2)
                                    end = min(len(lines), idx + 3)
                                    print(f"--- Context (lines {start}-{end}) ---")
                                    for i in range(start, end):
                                        print(f"  {i}: {lines[i]}")
                except Exception as e:
                    pass

if __name__ == '__main__':
    search_brain_folders()

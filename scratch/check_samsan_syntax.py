import os
import sys
import re
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

def verify_js_file(file_path):
    try:
        # Run command with raw bytes capture to avoid UnicodeDecodeError in threading
        result = subprocess.run(
            ["node", "-c", file_path], 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )
        return True, "OK"
    except subprocess.CalledProcessError as e:
        stderr_bytes = e.stderr if e.stderr else b""
        stderr_str = stderr_bytes.decode('utf-8', errors='ignore')
        if not stderr_str:
            stderr_str = stderr_bytes.decode('cp949', errors='ignore')
        return False, stderr_str.strip()
    except FileNotFoundError:
        return True, "Node not installed"
    except Exception as ex:
        return True, f"Other error: {ex}"

def verify_html_js_tags(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return []
        
    # Match <script> tags and extract their attributes and contents
    script_pattern = re.compile(r'<script(\b[^>]*)>(.*?)</script>', re.DOTALL | re.IGNORECASE)
    matches = list(script_pattern.finditer(html))
    
    temp_dir = 'scratch'
    os.makedirs(temp_dir, exist_ok=True)
    
    errors = []
    for idx, match in enumerate(matches):
        attrs = match.group(1).lower()
        code = match.group(2).strip()
        if not code:
            continue
            
        # Skip JSON-LD blocks
        if 'application/ld+json' in attrs:
            continue
        
        # Write to temp file
        temp_file = os.path.join(temp_dir, f"temp_script_{idx}.js")
        try:
            with open(temp_file, 'w', encoding='utf-8') as tf:
                tf.write(code)
        except Exception as e:
            print(f"Error writing temp file: {e}")
            continue
            
        ok, msg = verify_js_file(temp_file)
        
        # Clean up temp file
        try:
            os.remove(temp_file)
        except:
            pass
            
        if not ok:
            # Calculate actual line number in HTML file
            start_pos = match.start(2)
            line_in_html = html.count('\n', 0, start_pos) + 1
            
            # Find line number inside the script block
            node_line = 1
            # Search for line numbers in the error message
            m = re.search(r'temp_script_\d+\.js:(\d+)', msg)
            if m:
                node_line = int(m.group(1))
            
            actual_line = line_in_html + node_line - 1
            errors.append((actual_line, msg))
            
    return errors

def scan_samsan():
    samsan_dir = 'c:\\Claude\\yeon-samsan'
    if not os.path.exists(samsan_dir):
        print(f"Directory {samsan_dir} does not exist.")
        return
        
    print(f"=== Scanning {samsan_dir} for Syntax Errors ===")
    for root, dirs, files in os.walk(samsan_dir):
        if any(p in root for p in ['.git', 'node_modules', '.firebase', '__pycache__']):
            continue
            
        for file in files:
            file_path = os.path.join(root, file)
            
            # Check standalone JS files
            if file.endswith('.js'):
                ok, msg = verify_js_file(file_path)
                if not ok:
                    print(f"\n[JS ERROR] {file_path}:\n{msg}\n")
                    
            # Check JS blocks in HTML files
            elif file.endswith('.html'):
                errors = verify_html_js_tags(file_path)
                if errors:
                    print(f"\n[HTML JS ERROR] in {file_path}:")
                    for line, msg in errors:
                        # Print only the first few lines of error message to be readable
                        clean_msg = "\n".join(msg.split("\n")[:4])
                        print(f"  Line {line}: {clean_msg}\n")

if __name__ == '__main__':
    scan_samsan()

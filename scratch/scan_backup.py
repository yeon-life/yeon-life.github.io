import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def scan_backup():
    backup_dir = '_백업'
    if not os.path.exists(backup_dir):
        print("Backup directory does not exist.")
        return
    
    print(f"=== Scanning files in {backup_dir} ===")
    for root, dirs, files in os.walk(backup_dir):
        for f in files:
            path = os.path.join(root, f)
            print(path)

if __name__ == '__main__':
    scan_backup()

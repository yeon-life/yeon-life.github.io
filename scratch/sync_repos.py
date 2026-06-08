import os
import shutil

src = r"C:\Claude\연라이프"
dst = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

exclude_dirs = {
    '.git', '.firebase', 'node_modules', '__pycache__', '.wrangler', 
    '_백업', 'yeon-life.github.io', 'yeon-ai-kr-new', 'yeon-ai-kr-v3', 'yeon-ai-kr-v4',
    'y-life_v6_2026-05-18', '리디자인_2026-05-16', '리디자인_2026-05-16_전체',
    '연라이프_캔바_디자인_의뢰', '울산소개_v1_20260521'
}

exclude_files = {
    '.firebaserc', 'firebase.json', 'firestore.rules', 'wrangler.toml', 
    'verify_deployment.py', 'firebase-debug.log'
}

def sync():
    print(f"Syncing from: {src}")
    print(f"To: {dst}")
    
    copied_files = 0
    copied_dirs = 0
    
    for root, dirs, files in os.walk(src):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        # Determine relative path
        rel_path = os.path.relpath(root, src)
        if rel_path == '.':
            target_dir = dst
        else:
            target_dir = os.path.join(dst, rel_path)
            
        # Create directory if not exists
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
            copied_dirs += 1
            
        for file in files:
            if file in exclude_files:
                continue
            src_file = os.path.join(root, file)
            dst_file = os.path.join(target_dir, file)
            
            # Copy file if it is different or doesn't exist
            if not os.path.exists(dst_file) or os.path.getmtime(src_file) > os.path.getmtime(dst_file):
                shutil.copy2(src_file, dst_file)
                copied_files += 1
                
    print(f"Sync complete. Copied {copied_files} files and created {copied_dirs} directories.")

if __name__ == "__main__":
    sync()

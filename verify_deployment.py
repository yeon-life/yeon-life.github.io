import os
import re
import sys
import urllib.parse

# Windows 콘솔에서 UTF-8 출력을 보장하기 위한 설정
try:
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

# 대상 디렉토리 정의 (yeon-life.github.io 하위 폴더 대상, 없을 시 스크립트 위치 기준)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TARGET_DIR = os.path.join(BASE_DIR, "yeon-life.github.io")
if not os.path.exists(TARGET_DIR):
    TARGET_DIR = BASE_DIR

errors = []
warnings = []

# 검증에서 제외할 폴더 및 파일 (백업 및 비배포 폴더 포함)
EXCLUDE_DIRS = {
    ".git", "node_modules", ".vercel", "_samsan_backup_deleted", "내친구인공지능_책",
    "yeon-ai-kr", "yeon-ai-kr-new", "yeon-ai-kr-v3", "yeon-ai-kr-v4", "_백업",
    "y-life_v6_2026-05-18", "리디자인_2026-05-16", "리디자인_2026-05-16_전체",
    "연라이프_캔바_디자인_의뢰", "울산소개_v1_20260521", "korea"
}
EXCLUDE_FILES = {
    "index_backup_before_length_fix.html", 
    "index_옛_20260507_v5배포전.html",
    "_INDEX_현재까지_완성된것.html"
}

def log_error(file_path, line_no, message):
    errors.append(f"[ERROR] {os.path.basename(file_path)}:L{line_no} - {message}")

def log_warning(file_path, line_no, message):
    warnings.append(f"[WARNING] {os.path.basename(file_path)}:L{line_no} - {message}")

# --- 검증 1: JS 구문 오류 및 백틱 매칭 검사 ---
def check_javascript_integrity(file_path, content):
    script_pattern = re.compile(r'<script\b[^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
    
    for match in script_pattern.finditer(content):
        script_code = match.group(1)
        start_pos = match.start(1)
        
        # 1-1. 백틱 문자 중첩 오류 검사 (무한 루프를 직접 유발하므로 치명적 에러로 분류)
        bad_concat_pattern = re.compile(r"<scr`|/scr`", re.IGNORECASE)
        for m in bad_concat_pattern.finditer(script_code):
            err_pos = start_pos + m.start()
            line_no = content.count('\n', 0, err_pos) + 1
            log_error(file_path, line_no, f"자바스크립트 내 비정상 백틱 기반 스크립트 태그 쪼개기 패턴 발견: '{m.group()}' (무한 루프 원인)")
            
        # 1-2. 백틱 및 따옴표 비대칭 검사 (오탐 가능성이 높으므로 치명적 에러가 아닌 '경고'로 판정)
        check_syntax_by_state(file_path, script_code, content.count('\n', 0, start_pos))

def check_syntax_by_state(file_path, code, line_offset):
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    in_single_line_comment = False
    in_multi_line_comment = False
    
    escape = False
    current_line = line_offset + 1
    
    i = 0
    code_len = len(code)
    while i < code_len:
        char = code[i]
        
        if char == '\n':
            current_line += 1
            if in_single_line_comment:
                in_single_line_comment = False
            escape = False
            i += 1
            continue
            
        if escape:
            escape = False
            i += 1
            continue
            
        if char == '\\':
            escape = True
            i += 1
            continue
            
        # 주석 스킵
        if not in_single_quote and not in_double_quote and not in_backtick:
            if not in_multi_line_comment and i + 1 < code_len and code[i:i+2] == '//':
                in_single_line_comment = True
                i += 2
                continue
            if not in_single_line_comment and i + 1 < code_len and code[i:i+2] == '/*':
                in_multi_line_comment = True
                i += 2
                continue
            if in_multi_line_comment and i + 1 < code_len and code[i:i+2] == '*/':
                in_multi_line_comment = False
                i += 2
                continue
                
        if in_single_line_comment or in_multi_line_comment:
            i += 1
            continue
            
        # 따옴표/백틱 상태 전이
        if char == "'":
            if not in_double_quote and not in_backtick:
                in_single_quote = not in_single_quote
        elif char == '"':
            if not in_single_quote and not in_backtick:
                in_double_quote = not in_double_quote
        elif char == '`':
            if not in_single_quote and not in_double_quote:
                in_backtick = not in_backtick
                
        i += 1
        
    # 복잡한 JS 코드에서 정규식 리터럴 등으로 인한 단순 상태 머신의 한계를 고려하여 경고로만 로깅
    if in_single_quote:
        log_warning(file_path, current_line, "홑따옴표(')가 닫히지 않은 것처럼 보입니다. (구문 확인 필요)")
    if in_double_quote:
        log_warning(file_path, current_line, "쌍따옴표(\")가 닫히지 않은 것처럼 보입니다. (구문 확인 필요)")
    if in_backtick:
        log_warning(file_path, current_line, "백틱(`) 템플릿 리터럴이 닫히지 않은 것처럼 보입니다. (구문 확인 필요)")

# --- 검증 2: 잘못된 링크 및 쿼리 파라미터 매핑 검사 ---
def check_links_and_parameters(file_path, content):
    href_pattern = re.compile(r'href=["\']([^"\']+)["\']')
    for match in href_pattern.finditer(content):
        link = match.group(1).strip()
        start_pos = match.start(1)
        line_no = content.count('\n', 0, start_pos) + 1
        
        # 2-1. 블로그/상세페이지 링크에서 옛날 방식인 ?author= 가 하드코딩되었는지 체크 (치명적 에러)
        if 'author=' in link and ('블로그_페르소나' in link or '오늘의_연라이프' in link or 'column' in link):
            log_error(file_path, line_no, f"구형 쿼리 파라미터가 사용된 링크 발견: '{link}' (slug 및 post를 사용해야 합니다)")
            
        # 2-2. 로컬 테스트용 URL 및 절대 경로 체크 (치명적 에러)
        if 'localhost' in link or '127.0.0.1' in link:
            log_error(file_path, line_no, f"로컬 테스트 주소가 하드코딩되어 있습니다: '{link}'")
        elif link.startswith('file://') or re.match(r'^[a-zA-Z]:[/\\]', link.lstrip('/')):
            log_error(file_path, line_no, f"로컬 절대 경로가 하드코딩되어 있습니다: '{link}'")
            
        # 2-3. 상대 경로 파일의 실제 존재 여부 검증 (404 방지)
        # 외부 주소, 해시 앵커, 특수 스키마는 제외
        if not (link.startswith('http://') or link.startswith('https://') or 
                link.startswith('mailto:') or link.startswith('tel:') or 
                link.startswith('javascript:') or link.startswith('#') or 
                link.startswith('//') or link == ""):
            
            # 동적 템플릿 리터럴 플레이스홀더(${...} 또는 {{...}})가 링크 내부에 포함되어 있다면 
            # 정적 파일 경로 검사에서 제외시킴 (오탐 방지)
            if '${' in link or '{{' in link:
                continue
            
            # 쿼리 및 해시 분리하여 순수 파일명만 검사
            parsed = urllib.parse.urlparse(link)
            file_name = parsed.path.lstrip('/') # 루트 상대경로의 시작 슬래시 제거하여 로컬 파일과 매핑
            
            if file_name:
                decoded_file_name = urllib.parse.unquote(file_name)
                # 현재 검사 중인 파일 위치 기준 절대 경로 확인
                file_dir = os.path.dirname(file_path)
                referenced_path = os.path.abspath(os.path.join(file_dir, decoded_file_name))
                root_based_path = os.path.abspath(os.path.join(TARGET_DIR, decoded_file_name))
                
                # 파일이 로컬(혹은 루트 기반)에 실재하지 않는 경우
                if not os.path.exists(referenced_path) and not os.path.exists(root_based_path):
                    # 깨진 대상이 HTML 파일이면 치명적인 404 에러로 처리
                    if decoded_file_name.endswith('.html'):
                        log_error(file_path, line_no, f"깨진 상대경로 HTML 링크 발견 (404 에러 위험): '{decoded_file_name}'")
                    else:
                        # 아이콘, CSS, 이미지 등의 파일 누락은 경고로 낮춰 처리하여 오탐 방지
                        log_warning(file_path, line_no, f"참조된 리소스 파일을 찾을 수 없습니다: '{decoded_file_name}'")

    # onclick 이벤트 기반 페이지 이동 구문 검사
    onclick_pattern = re.compile(r'onclick=["\']([^"\']+)["\']')
    for match in onclick_pattern.finditer(content):
        onclick_code = match.group(1)
        start_pos = match.start(1)
        line_no = content.count('\n', 0, start_pos) + 1
        
        if 'location.href' in onclick_code or 'window.open' in onclick_code:
            if 'author=' in onclick_code:
                log_error(file_path, line_no, f"onclick 이벤트 내 구형 파라미터 발견: '{onclick_code}'")
            if 'localhost' in onclick_code or '127.0.0.1' in onclick_code:
                log_error(file_path, line_no, f"onclick 이벤트 내 로컬 주소 하드코딩 발견: '{onclick_code}'")

def main():
    print("==================================================")
    print("      Yeonlife Quality Gate (Deployment Check)    ")
    print("==================================================")
    print(f"Target Directory: {TARGET_DIR}")
    print("Scanning HTML files for syntax errors and broken links...")
    print()

    html_files_count = 0
    
    for root, dirs, files in os.walk(TARGET_DIR):
        # 불필요 디렉토리 스킵
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        
        for file in files:
            if file.endswith('.html') and file not in EXCLUDE_FILES:
                html_files_count += 1
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # 1. 자바스크립트 결합 패턴 및 구문(백틱) 무결성 체크
                    check_javascript_integrity(file_path, content)
                    # 2. 링크 유효성 및 파라미터 미치 매치 검사
                    check_links_and_parameters(file_path, content)
                    
                except Exception as e:
                    print(f"[FATAL] System error reading/parsing file: {file} -> {str(e)}")
                    sys.exit(2)
                    
    print(f"Total HTML files scanned: {html_files_count}")
    print()
    
    if warnings:
        print(f"[-] Warnings found ({len(warnings)}):")
        for warning in warnings:
            print(f"  {warning}")
        print()
        
    if errors:
        print("[ERROR] Critical Errors Found! Deployment Blocked.")
        print("--------------------------------------------------")
        for error in errors:
            print(f"  {error}")
        print("--------------------------------------------------")
        print("[FAIL] Quality Gate Blocked: Please fix these errors before deploying!")
        sys.exit(1)
        
    print("[SUCCESS] Quality Gate Passed: All checks completed successfully. Ready to deploy!")
    sys.exit(0)

if __name__ == '__main__':
    main()

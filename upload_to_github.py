#!/usr/bin/env python3
"""
y-life.kr 홈페이지를 GitHub에 업로드하는 스크립트
GitHub API를 사용하여 index.html 파일을 직접 업로드합니다.
"""

import base64
import json
import os
import sys
import subprocess

def get_github_token():
    """GitHub 토큰을 환경변수나 GitHub CLI에서 가져옵니다"""
    # 먼저 환경변수 확인
    token = os.getenv('GITHUB_TOKEN') or os.getenv('GH_TOKEN')
    if token:
        return token

    # GitHub CLI에서 토큰 가져오기
    try:
        result = subprocess.run(
            ['gh', 'auth', 'token'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass

    return None

def upload_file_to_github():
    """index.html 파일을 GitHub에 업로드합니다"""

    # 설정
    REPO_OWNER = "yeon-life"
    REPO_NAME = "yeon-life.github.io"
    FILE_PATH = "index.html"
    COMMIT_MESSAGE = "y-life.kr 완전 리뉴얼: 순수 플랫폼 포지셔닝, yeon-design 규칙 적용"

    # 현재 스크립트 위치에서 index.html 찾기
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_to_upload = os.path.join(script_dir, 'index.html')

    if not os.path.exists(file_to_upload):
        print(f"✗ 오류: {file_to_upload} 파일을 찾을 수 없습니다")
        sys.exit(1)

    # 파일 읽기 및 인코딩
    with open(file_to_upload, 'r', encoding='utf-8') as f:
        file_content = f.read()

    encoded_content = base64.b64encode(file_content.encode('utf-8')).decode('utf-8')

    print(f"📄 파일 정보:")
    print(f"  경로: {file_to_upload}")
    print(f"  크기: {len(file_content)} bytes")
    print()

    # GitHub 토큰 확인
    github_token = get_github_token()

    if not github_token:
        print("✗ 오류: GitHub 토큰이 없습니다")
        print()
        print("해결 방법:")
        print("1. GitHub CLI 설치 및 로그인: gh auth login")
        print("2. 또는 환경변수 설정: set GITHUB_TOKEN=your_token")
        print("3. 또는 GitHub 웹사이트에서 파일 직접 수정")
        sys.exit(1)

    # GitHub API 요청
    import urllib.request
    import urllib.error

    url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}"

    # 현재 파일 SHA 가져오기
    print(f"🔍 현재 파일 정보 조회 중...")
    try:
        req = urllib.request.Request(
            url,
            headers={'Authorization': f'token {github_token}'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read())
            current_sha = data.get('sha')
            print(f"  ✓ 현재 SHA: {current_sha[:7]}")
    except urllib.error.HTTPError as e:
        if e.code == 404:
            current_sha = None
            print(f"  ℹ 새 파일로 생성됩니다")
        else:
            print(f"  ✗ 오류: {e.code}")
            sys.exit(1)

    # 업로드할 데이터
    payload = {
        "message": COMMIT_MESSAGE,
        "content": encoded_content,
    }

    if current_sha:
        payload["sha"] = current_sha

    print()
    print(f"📤 파일 업로드 중...")
    print(f"  저장소: {REPO_OWNER}/{REPO_NAME}")
    print(f"  파일: {FILE_PATH}")
    print(f"  메시지: {COMMIT_MESSAGE}")

    # PUT 요청
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            method='PUT',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {github_token}',
                'Accept': 'application/vnd.github+json',
            }
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read())

            print()
            print(f"✓ 업로드 완료!")
            commit_sha = result.get('commit', {}).get('sha', '')
            print(f"  커밋: {commit_sha[:7]}")
            print(f"  브랜치: main")
            print()
            print(f"🌐 배포 확인:")
            print(f"  https://y-life.kr 에서 약 30초 후 업데이트 확인 가능합니다")

    except urllib.error.HTTPError as e:
        print()
        print(f"✗ 업로드 실패: {e.code}")
        try:
            error_data = json.loads(e.read())
            print(f"  메시지: {error_data.get('message')}")
        except:
            pass
        sys.exit(1)

if __name__ == "__main__":
    upload_file_to_github()

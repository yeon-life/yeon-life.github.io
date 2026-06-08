#!/bin/bash

# y-life.kr 홈페이지를 GitHub에 푸시하는 스크립트
# 이 스크립트는 Windows PowerShell이나 Git Bash에서 실행하세요

# 설정
REPO_PATH="${HOME}/Documents/GitHub/yeon-life.github.io"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FILE_TO_COPY="$SCRIPT_DIR/index.html"
COMMIT_MESSAGE="y-life.kr 완전 리뉴얼: 순수 플랫폼 포지셔닝, yeon-design 규칙 적용"

echo "📦 y-life.kr 배포 스크립트"
echo "========================================"

# 파일 확인
if [ ! -f "$FILE_TO_COPY" ]; then
    echo "❌ 오류: $FILE_TO_COPY 파일을 찾을 수 없습니다"
    echo ""
    echo "이 스크립트는 index.html과 같은 폴더에서 실행해야 합니다"
    exit 1
fi

echo "✓ 파일 확인: $FILE_TO_COPY"
echo ""

# GitHub 저장소 경로 확인 (찾기)
if [ -d "$REPO_PATH" ]; then
    REPO_LOCATION="$REPO_PATH"
elif [ -d "${HOME}/Documents/yeon-life.github.io" ]; then
    REPO_LOCATION="${HOME}/Documents/yeon-life.github.io"
elif [ -d "${HOME}/yeon-life.github.io" ]; then
    REPO_LOCATION="${HOME}/yeon-life.github.io"
else
    echo "❌ GitHub 저장소를 찾을 수 없습니다"
    echo ""
    echo "다음 경로 중 하나를 확인하세요:"
    echo "  - ~/Documents/GitHub/yeon-life.github.io"
    echo "  - ~/Documents/yeon-life.github.io"
    echo "  - ~/yeon-life.github.io"
    echo ""
    echo "또는 REPO_PATH 변수를 수정하세요"
    exit 1
fi

echo "✓ GitHub 저장소: $REPO_LOCATION"
echo ""

# 파일 복사
echo "📄 파일 복사 중..."
cp "$FILE_TO_COPY" "$REPO_LOCATION/index.html"
if [ $? -eq 0 ]; then
    echo "✓ 파일 복사 완료"
else
    echo "❌ 파일 복사 실패"
    exit 1
fi
echo ""

# 저장소로 이동
cd "$REPO_LOCATION" || exit 1

# Git 상태 확인
echo "📊 Git 상태 확인..."
git status
echo ""

# 변경사항 추가
echo "➕ 변경사항 추가..."
git add index.html
echo "✓ index.html 추가"
echo ""

# 커밋
echo "📝 커밋 중..."
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
    echo "❌ 커밋 실패 (변경사항이 없거나 오류 발생)"
    exit 1
fi
echo ""

# 푸시
echo "🚀 GitHub에 푸시 중..."
git push origin main
if [ $? -eq 0 ]; then
    echo "✓ 푸시 완료!"
    echo ""
    echo "🌐 배포 완료!"
    echo "  약 30초 후 https://y-life.kr 에서 업데이트를 확인할 수 있습니다"
else
    echo "❌ 푸시 실패"
    echo "  네트워크 연결을 확인하거나 GitHub 인증을 다시 시도하세요"
    exit 1
fi

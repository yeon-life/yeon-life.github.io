# ============================================================
# 연라이프 홈페이지 제작 → 구글 드라이브 자동 동기화 스크립트
# ============================================================
# 실행 방법: PowerShell에서 우클릭 → "PowerShell로 실행"
# 또는 명령줄: powershell -ExecutionPolicy Bypass -File "연라이프_구글드라이브_동기화.ps1"
# ============================================================

$SourceFolder = "C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작"
$TargetFolder = "G:\내 드라이브\AI - Claud. Cowork 작업 진행\jj 연프로젝트 백업\연라이프 홈페이지"

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host " 연라이프 구글 드라이브 동기화" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

# 원본 폴더 확인
if (-not (Test-Path $SourceFolder)) {
    Write-Host "[오류] 원본 폴더를 찾을 수 없습니다:" -ForegroundColor Red
    Write-Host "  $SourceFolder" -ForegroundColor Red
    Read-Host "엔터를 눌러 종료"
    exit 1
}

# 대상 폴더 확인 및 생성
if (-not (Test-Path $TargetFolder)) {
    Write-Host "[알림] 대상 폴더가 없어 새로 만듭니다..." -ForegroundColor Yellow
    try {
        New-Item -ItemType Directory -Path $TargetFolder -Force | Out-Null
        Write-Host "[완료] 폴더 생성됨: $TargetFolder" -ForegroundColor Green
    } catch {
        Write-Host "[오류] 폴더를 만들 수 없습니다. G 드라이브가 연결되어 있는지 확인하세요." -ForegroundColor Red
        Write-Host "  $_" -ForegroundColor Red
        Read-Host "엔터를 눌러 종료"
        exit 1
    }
}

Write-Host "원본: $SourceFolder" -ForegroundColor Gray
Write-Host "대상: $TargetFolder" -ForegroundColor Gray
Write-Host ""

# 동기화 실행
$CopiedCount = 0
$SkippedCount = 0
$ErrorCount = 0

$Files = Get-ChildItem -Path $SourceFolder -File -Recurse | Where-Object {
    # 숨김 파일 및 임시 파일 제외
    -not $_.Name.StartsWith(".") -and
    -not $_.Name.StartsWith("~") -and
    $_.Name -ne "Thumbs.db"
}

foreach ($File in $Files) {
    $RelativePath = $File.FullName.Substring($SourceFolder.Length + 1)
    $TargetPath = Join-Path $TargetFolder $RelativePath
    $TargetDir = Split-Path $TargetPath -Parent

    # 하위 폴더 생성
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }

    try {
        # 파일이 없거나 원본이 더 새로운 경우에만 복사
        $ShouldCopy = $true
        if (Test-Path $TargetPath) {
            $SourceTime = $File.LastWriteTime
            $TargetTime = (Get-Item $TargetPath).LastWriteTime
            if ($TargetTime -ge $SourceTime) {
                $ShouldCopy = $false
            }
        }

        if ($ShouldCopy) {
            Copy-Item -Path $File.FullName -Destination $TargetPath -Force
            Write-Host "  [복사] $RelativePath" -ForegroundColor Green
            $CopiedCount++
        } else {
            $SkippedCount++
        }
    } catch {
        Write-Host "  [오류] $RelativePath — $_" -ForegroundColor Red
        $ErrorCount++
    }
}

Write-Host ""
Write-Host "=============================" -ForegroundColor Cyan
Write-Host " 동기화 완료!" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "  복사된 파일: $CopiedCount 개" -ForegroundColor Green
Write-Host "  건너뜀(최신): $SkippedCount 개" -ForegroundColor Gray
if ($ErrorCount -gt 0) {
    Write-Host "  오류 발생: $ErrorCount 개" -ForegroundColor Red
}
Write-Host ""
Write-Host "대상 폴더: $TargetFolder" -ForegroundColor Gray
Write-Host ""
Read-Host "엔터를 눌러 종료"

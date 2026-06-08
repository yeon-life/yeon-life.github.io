/**
 * 영풀 — 막힌 영어를 풀다 · 사용자 설정 파일
 *
 * 이 파일만 수정하면 백엔드 URL / 관리자 코드 / Google Client ID 를
 * 한 곳에서 관리할 수 있습니다.
 *
 * ⚠️ 주의: 이 파일은 브라우저에서 공개됩니다.
 *   - ADMIN_CODE 는 숨김 진입 1차선일 뿐, 민감한 키는 절대 두지 마세요.
 *   - Netlify 의존성 제거 완료 (2026-04-25) — Apps Script 직접 연결
 */
window.YEON_CONFIG = {
  // ============================================
  // 백엔드 (Google Apps Script — 직접 연결)
  // ============================================
  // Netlify Functions 제거 후 Apps Script 에 직접 연결합니다.
  // 빈 값이거나 PASTE_YOUR_URL_HERE 이면 localStorage 데모 모드로 동작합니다.
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwnA2B6a4VPdkJ8KyvZcmhXalfI2xHgzHACeqChKqgzuiXpdX1rM26hHRkUMUF-oc00/exec',

  APPS_SCRIPT_SECRET: 'yeon-secret-xr7k2m9pq4',

  // ============================================
  // 관리자
  // ============================================
  // 관리자 콘솔(admin.html) 진입 승인번호 — 6자리 숫자
  // 관리자 페이지는 index.html 에서 직접 링크되지 않습니다.
  // 주소창에 /admin.html 을 직접 입력해 진입하고, 이 번호를 입력하세요.
  ADMIN_CODE: '240409',

  // 신규 가입/원격 신청 발생 시 알림 받을 관리자 이메일 (선택)
  // 값이 있으면 Apps Script 가 MailApp 으로 메일 발송합니다.
  ADMIN_EMAIL: '',

  // ============================================
  // Google Sign-In (원격회원 자동 로그인용)
  // ============================================
  // Google Cloud Console > OAuth 동의화면 > Client ID (Web) 를 여기 붙여넣으면
  // 원격회원이 Google One Tap 으로 자동 인식됩니다.
  // 빈 값이면 이메일 기반 자동 로그인으로 폴백됩니다.
  GOOGLE_CLIENT_ID: '852268715593-o2mblqq2og0rgdl3mhhuir5hc2rdoaab.apps.googleusercontent.com',

  // ============================================
  // 앱 메타
  // ============================================
  APP_NAME: '영풀',
  APP_TAGLINE: '막힌 영어를 풀다',

  // ============================================
  // 무료 체험 정책
  // ============================================
  TRIAL: {
    TOTAL_DAYS: 30,
    PHASE1_DAYS: 7,
    PHASE1_QUOTA: 3,
    PHASE2_QUOTA: 1
  },

  // ============================================
  // 비밀번호 정책 (일반·프리미엄 회원)
  // ============================================
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_LETTER: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false // 필요 시 true 로
  },

  // ============================================
  // 원격회원 정책
  // ============================================
  REMOTE: {
    INVITE_CODE_LENGTH: 6,
    INVITE_CODE_ONE_TIME: true,
    // 원격회원에서 제외되는 기능 플래그
    EXCLUDED_FEATURES: ['teacher_direct_message']
  },

  // ============================================
  // 유료 이용료 — 5단 자동 승급 요금제
  // ============================================
  // 핵심 원칙:
  //  - 모든 단계는 "모든 기능 무제한 사용 가능". 티어별 기능 제한 없음.
  //  - 차이는 오직 "월 세션 한도"뿐.
  //  - 한도 초과 시 해당 월에 한해 한 단계 위 요금제가 자동 적용되어 끊김 없이 학습 지속.
  //  - 최대 한도는 T5 (50만원). 그 이상은 청구되지 않음.
  //  - 학부모 명의 계좌이체/카카오페이를 기본 결제 수단으로 유도해 전산 기록을 명확히 남긴다.
  //  - 심리적으로 적당한 가격 간격 (20k → 45k → 99k → 199k → 499k) 으로 선택 피로를 낮춘다.
  PRICING: {
    CURRENCY: 'KRW',
    BILLING_CYCLE_DAYS: 30,
    // 기본 진입 요금 (사용자가 처음 선택하는 베이스)
    DEFAULT_TIER: 'T1',
    // 초과 시 자동으로 한 단계 위 요금제 적용 (동일 월 내, 다음 달 재선택 가능)
    AUTO_UPGRADE: true,
    // 5단 선택 옵션 — 모든 티어 동일 기능, 차이는 세션 한도뿐
    TIERS: [
      {
        id: 'T1',
        name: '라이트',
        tagline: '가볍게 시작',
        price: 20000,
        sessions: 30,
        dailyAvg: 1,
        bestFor: '처음 시작하는 학생 · 주 2~3회 복습',
        highlight: false
      },
      {
        id: 'T2',
        name: '스탠다드',
        tagline: '꾸준히 습관',
        price: 45000,
        sessions: 80,
        dailyAvg: 2,
        bestFor: '매일 꾸준히 학습하는 중학생 · 평일 루틴',
        highlight: false
      },
      {
        id: 'T3',
        name: '포커스',
        tagline: '집중 공부',
        price: 99000,
        sessions: 200,
        dailyAvg: 6,
        bestFor: '시험 대비 · 주말 집중 · 상위권 목표',
        highlight: true  // 인기(추천) 티어 — 심리적 기준점
      },
      {
        id: 'T4',
        name: '마스터',
        tagline: '심화 학습',
        price: 199000,
        sessions: 450,
        dailyAvg: 15,
        bestFor: '수능/내신 집중기 · 하루 여러 시간 학습',
        highlight: false
      },
      {
        id: 'T5',
        name: '언리미티드',
        tagline: '전과목 풀 가동',
        price: 499000,
        sessions: 9999,           // 실질 무제한 — 한도 체크용 값
        dailyAvg: 50,
        bestFor: '전과목 동시 학습 · 여러 앱 생태계 풀 활용',
        highlight: false
      }
    ],
    // 결제 수단: 학부모 명의 우선, 현금/타인 이체는 기록 불명확하므로 권장하지 않음
    PREFERRED_METHODS: ['parent_bank_transfer', 'parent_kakaopay'],
    // 부모 안내 페이지 경로 — 부모님께 공유할 상세 설명서
    PARENT_INFO_URL: 'parent.html',
    // 입금 정보 (부모님께 공유되는 내용)
    DEPOSIT_INFO: {
      BANK_NAME: '카카오뱅크',
      ACCOUNT_NUMBER: '3333-37-1080249',
      ACCOUNT_HOLDER: '이진우',
      KAKAOPAY_LINK: ''
    },
    // 과거 호환용 (레거시 코드가 읽을 수 있음) — TIERS 로 이전 완료
    MIN: 20000,
    MAX: 499000
  },

  // ============================================
  // 결제 시스템 (카드·계좌·간편결제 통합)
  // ============================================
  // 전략:
  //  1) 즉시 가능한 "수동 경로" (계좌번호 복사 + 카카오페이 송금 링크)
  //  2) PG 연동 "자동 경로" (토스페이먼츠 단일 PG — 카드/계좌/카카오/네이버/토스/삼성 전부)
  //  PG 키만 입력하면 자동 경로로 전환되고, 키가 비어 있으면 수동 경로로 폴백.
  //
  // ⚠️ 정식 운영 전 반드시 확보해야 할 것:
  //  - 사업자등록증
  //  - 통신판매업 신고증 (연매출 4,800만 초과 시 필수, 그 전에도 권장)
  //  - 이용약관 / 개인정보처리방침 / 환불정책 페이지
  //  - 전자상거래법 표시사항 (상호·대표자·사업자번호·주소·전화·이메일)
  //  - HTTPS 도메인
  //  - 토스페이먼츠/포트원 가입 심사 통과
  PAYMENT: {
    // PG 공급자 선택: 'toss' | 'portone' | 'manual'
    //  - 'manual' 이면 계좌이체 + 카카오송금 링크만 활성화 (PG 계약 불필요)
    //  - 'toss'   이면 토스페이먼츠 SDK 통해 전 결제수단 활성화
    //  - 'portone' 이면 포트원(아임포트) 멀티 PG 허브
    PG_PROVIDER: 'manual',

    // 토스페이먼츠 클라이언트 키 (브라우저 노출 가능, 테스트 키로 시작)
    //  발급: https://developers.tosspayments.com/my/api-keys
    //  테스트: test_ck_...  실운영: live_ck_...
    TOSS_CLIENT_KEY: '',

    // 토스페이먼츠 시크릿 키는 절대 프론트에 두지 말 것!
    //  Apps Script Script Properties 에 TOSS_SECRET_KEY 로 저장.
    //  또는 Netlify Functions 환경변수 TOSS_SECRET_KEY 사용.

    // 포트원(아임포트) 사용 시
    PORTONE_STORE_ID: '',     // 스토어 ID
    PORTONE_CHANNEL_KEY: '',  // 채널 키

    // 결제 수단 활성화 (체크한 것만 사용자에게 노출)
    METHODS: {
      card:        { enabled: true,  label: '신용/체크카드',  icon: 'card',    order: 1 },
      bank:        { enabled: true,  label: '실시간 계좌이체', icon: 'bank',    order: 2 },
      virtual:     { enabled: true,  label: '가상계좌',       icon: 'vbank',   order: 3 },
      kakaopay:    { enabled: true,  label: '카카오페이',     icon: 'kakao',   order: 4 },
      naverpay:    { enabled: true,  label: '네이버페이',     icon: 'naver',   order: 5 },
      tosspay:     { enabled: true,  label: '토스페이',       icon: 'toss',    order: 6 },
      samsungpay:  { enabled: true,  label: '삼성페이',       icon: 'samsung', order: 7 },
      phone:       { enabled: false, label: '휴대폰 결제',    icon: 'phone',   order: 8 },
      payco:       { enabled: false, label: 'PAYCO',         icon: 'payco',   order: 9 }
    },

    // 수동 경로 (PG 심사 전 임시 운영)
    MANUAL: {
      // 카카오페이 개인/비즈 송금 링크 (예: https://qr.kakaopay.com/xxxxx)
      KAKAOPAY_SEND_LINK: '',
      // 토스 송금 링크 (예: https://toss.me/xxxxx)
      TOSS_SEND_LINK: '',
      // 입금 확인 연락처 (카톡 ID · 전화번호)
      CONFIRM_CONTACT: '',
      // 계좌번호는 위 DEPOSIT_INFO 에서 가져옴
      COPY_BUTTON_ENABLED: true,
      // "송금 완료 확인" 수동 버튼 → Apps Script 에 기록
      MANUAL_CONFIRM_ENABLED: true
    },

    // 결제 성공/실패 리디렉션 URL (토스 결제창에서 사용)
    SUCCESS_URL: '/payment-success.html',
    FAIL_URL: '/payment-fail.html',

    // 주문 번호 prefix — 중복 방지 위해 타임스탬프+랜덤 조합
    ORDER_ID_PREFIX: 'YEON',

    // 현금영수증 (교육서비스 건당 10만원 이상 의무발행)
    CASH_RECEIPT: {
      REQUIRED: true,
      DEFAULT_TYPE: 'personal',  // 'personal' (소득공제용) | 'business' (지출증빙용)
      THRESHOLD: 100000          // 이 금액 이상은 의무발행
    },

    // 환불 정책 요약 (parent.html 에서 표시)
    REFUND_POLICY: {
      FULL_REFUND_DAYS: 7,        // 7일 이내 미사용 시 100% 환불
      PARTIAL_REFUND_DAYS: 30,    // 30일 이내 사용량 비례 환불
      CANCEL_CONTACT: '담당 선생님 또는 고객센터 메시지',
      // 법적 근거: 전자상거래법 §17 (청약철회권 7일)
      LEGAL_BASIS: '전자상거래법 제17조'
    },

    // 결제 완료 후 회원 상태 업데이트 방식
    //  - 'instant'  : 결제 성공 즉시 premium 승격 (PG webhook 검증 완료 후)
    //  - 'manual'   : 관리자 수동 승인 후 승격 (수동 경로)
    ACTIVATION_MODE: 'manual'
  },

  // ============================================
  // 생태계 앱 — 연 프로젝트 시리즈 (정직한 상태 표시)
  // ============================================
  // ⚠️ 2026-04-10 정정 — status 값을 실제 상태와 일치시킴.
  //    이전에는 5개 앱이 'live'로 표시되었으나 실제 라이브는 영풀 1개뿐.
  //    거짓 'live' 표시는 학생/학부모 신뢰 손상 → 절대 금지.
  //
  // status 값 정의:
  //   'live'     — 실제 배포되어 학생이 즉시 사용 가능
  //   'dev'      — 개발 중, 곧 배포 예정
  //   'planned'  — 로드맵에만 있음, 개발 미착수
  //   'internal' — 본 앱(영풀)에 내장된 모듈, 별도 앱 아님
  //
  // 노출 위치 (2026-04-10 변경):
  //   ❌ 첫 화면 — index.html #ecosystemCard 는 display:none 처리
  //   ✅ parent.html — 부모님 안내 페이지
  //   ✅ 마이페이지 (Phase 2 신설 예정)
  //
  // 사용자 로드맵: 영풀 → 수풀(수학) → 논풀(논술) → 국풀(국어) → 기타
  //   + 스무고개(정체성 + 학과목 교차)
  //   연플래너는 모든 학과목을 수집하는 hub
  //   참조: project_planner_hub_architecture.md
  ECOSYSTEM_APPS: [
    {
      id: 'yeong-pul',
      name: '영풀',
      desc: '현재 앱 · 막힌 영어를 풀다 · AI 오답·약점 분석 완전학습',
      status: 'live',
      current: true
    },
    {
      id: 'yeon-planner',
      name: '연플래너',
      desc: '학습 계획 · 5·2·5·5 복습 · 100일 습관 · 모든 학과목 허브',
      status: 'dev'
    },
    {
      id: 'supul',
      name: '수풀',
      desc: '수학 학습앱 · 영풀 다음 차례 (개발 예정)',
      status: 'planned'
    },
    {
      id: 'nonpul',
      name: '논풀',
      desc: '논술 학습앱 · 로드맵 3순위 (개발 예정)',
      status: 'planned'
    },
    {
      id: 'gukpul',
      name: '국풀',
      desc: '국어 학습앱 · 로드맵 4순위 (개발 예정)',
      status: 'planned'
    },
    {
      id: 'twenty-q',
      name: '스무고개',
      desc: 'AI 20문답 추리 학습 · 정체성 찾기 + 학과목 교차 완전학습',
      status: 'dev'
    },
    {
      id: 'vocab-notebook',
      name: '단어 학습장',
      desc: '본 앱 내장 모듈 · 즉시 저장 · 원문 + 일기 예문 · 영작 훈련',
      status: 'internal'
    },
    {
      id: 'cumulative-report',
      name: '누적 분석 보고서',
      desc: '학생 취약점 정밀 분석 · 선생님/학부모 월간 리포트 (개발 중)',
      status: 'dev'
    }
  ],

  // ============================================
  // 서버 용량 · 확장 대비 (운영자 사전 준비 체크리스트)
  // ============================================
  // 사용자 수가 늘어날 때 앱이 먹통이 되지 않도록,
  // 관리자가 미리 임계치를 설정해 경보를 받고 단계적으로 대응할 수 있게 한다.
  //
  // 운영 단계:
  //  PHASE_0 (MVP)        : 0 ~ 50명       · localStorage + Apps Script 프리티어
  //  PHASE_1 (소규모)     : 50 ~ 500명     · Apps Script + Firestore 보조
  //  PHASE_2 (확장기)     : 500 ~ 5000명   · Firebase/Supabase 본격 이전
  //  PHASE_3 (대규모)     : 5000명+        · Cloud Run · CDN · 전담 백엔드
  //
  // admin.html 에서 각 임계치 대비 현재 값을 보여주고,
  // 85% 이상이면 경고 배지, 100% 이상이면 긴급 경보로 표시한다.
  CAPACITY: {
    // 현재 운영 단계 — 사용자 수가 임계치 넘기면 관리자가 수동 올림
    CURRENT_PHASE: 'PHASE_0',

    // 동시 접속자 임계치 (분당 활성 요청 수 기준)
    CONCURRENT_WARN: 30,     // 경고 시작
    CONCURRENT_CRIT: 60,     // 임계치 돌파 → 확장 필요

    // 일일 API 호출 한도 (Anthropic Claude / Kakao / Google)
    DAILY_CLAUDE_CALLS_WARN: 800,
    DAILY_CLAUDE_CALLS_CRIT: 1500,
    DAILY_KAKAO_CALLS_WARN: 2000,
    DAILY_APPS_SCRIPT_CALLS_WARN: 15000,   // Google Apps Script 기본 할당량 20000
    DAILY_APPS_SCRIPT_CALLS_CRIT: 19000,

    // 등록 회원 수 — 다음 단계로 이전할 시점 알림
    MEMBERS_PHASE_0_LIMIT: 50,
    MEMBERS_PHASE_1_LIMIT: 500,
    MEMBERS_PHASE_2_LIMIT: 5000,

    // 저장소 용량 한도 (Apps Script Spreadsheet 한 시트 약 1000만 셀)
    SHEET_ROW_WARN: 50000,
    SHEET_ROW_CRIT: 200000,

    // 응답 지연 임계치 (밀리초) — 초과 시 백엔드 점검 필요
    LATENCY_WARN_MS: 1500,
    LATENCY_CRIT_MS: 4000,

    // 자동 백업 주기 (시간)
    BACKUP_INTERVAL_HOURS: 6,
    BACKUP_RETAIN_DAYS: 30,

    // 프리티어 → 유료 플랜 전환 체크포인트
    //  - 이 값 이상이면 관리자가 admin.html 에서 수동으로 다음 단계 체크리스트 확인
    MIGRATION_CHECKPOINTS: {
      to_firebase: { trigger: 'members >= 300 OR daily_calls >= 10000' },
      to_cdn:      { trigger: 'daily_unique_visitors >= 1000' },
      to_cloud_run:{ trigger: 'members >= 3000 OR concurrent_peak >= 100' }
    },

    // 장애 대비 — 긴급 공지 모드 (true 면 전체 사용자에게 배너 표시)
    MAINTENANCE_BANNER: false,
    MAINTENANCE_MESSAGE: '',

    // 사용자 알림: 서버 점검 예정 시점 (ISO string, 비어 있으면 없음)
    SCHEDULED_MAINTENANCE_AT: '',

    // 읽기 전용 모드 — 쓰기 장애 시 서비스 유지용 폴백
    READ_ONLY_MODE: false,

    // 관리자 알림 채널 — 임계치 돌파 시 발송
    ALERT_CHANNELS: {
      email: true,           // ADMIN_EMAIL 로 발송
      kakao: false,          // 추후 카카오 비즈니스 메시지 연동
      webhook_url: ''        // Slack/Discord 웹훅
    }
  },

  // ============================================
  // 지속 사용 유도 (리텐션) 장치
  // ============================================
  // "끊으면 손해" 를 구조적으로 만든다. 기능 제한이 아닌 "누적 가치" 로 묶는다.
  RETENTION: {
    // 매일 연속 학습 스트릭 — 끊기면 리셋
    STREAK_ENABLED: true,
    STREAK_MILESTONES: [7, 14, 30, 60, 100, 180, 365],
    // 누적 패킷 이월 — 해지 시 전액 소멸
    PACKET_ROLLOVER: true,
    // 월말 성취 리포트 자동 발송 (부모/선생님)
    MONTHLY_REPORT: true,
    // 생태계 앱 크로스 데이터 공유 — 이 앱을 끊으면 다른 앱 연동도 끊김
    CROSS_APP_SYNC: true,
    // 친구 추천 누적 등급 — 해지 시 등급 초기화
    REFERRAL_TIER_PERSIST: false
  },

  // ============================================
  // 카카오톡 공유 (부모님께 안내 전송용)
  // ============================================
  // https://developers.kakao.com 에서 JavaScript 키 발급 후 붙여넣기.
  // 빈 값이면 "링크 복사" 폴백으로 동작합니다.
  KAKAO_JS_KEY: '',

  // ============================================
  // 패킷 보상 정책 (사업 확장에 맞춰 서버 관리자만 조정)
  // ============================================
  // ⚠️ 사업 확장에 유리한 값으로 신중히 조정해 갑니다.
  //    프론트엔드에서는 절대 임의 상향 불가.
  //    이 블록은 나중에 Apps Script / 서버 API 응답으로 덮어쓰도록 전환할 수 있습니다.
  //    (localStorage 조작 차단 로직은 백엔드에서 최종 검증)
  //
  // 기본 정책 철학:
  //  - 초기에는 사용자 유입 유도를 위해 후하게, 점차 긴축
  //  - 최대 보상 패킷 합계는 너무 크지 않게
  //  - 서버 관리자가 admin.html 또는 Apps Script 설정에서만 변경
  REWARDS: {
    // 이 플래그가 true 면 프론트엔드에서 REWARDS 를 직접 읽고,
    // false 면 서버에서 동적으로 수치를 받아오도록(향후 확장) 준비.
    SERVER_MANAGED: false,

    REVIEW: {
      BASE: 1,                    // 평가 제출 기본
      NEG_TAG: 2,                 // 문제점 태그 1개 이상
      TEXT_50: 1,                 // 상세 의견 50자+
      TEXT_150: 1,                // 상세 의견 150자+
      PROBLEM_KW: 1,              // 버그/개선 키워드
      CAP: 5                      // 기본 리뷰 최대 합계
    },
    STORY: {
      LEN_200: 1,                 // 경험담 200자+
      LEN_500: 2,                 // 상세 경험담 500자+ 추가
      CAP: 3                      // 경험담 보너스 최대
    },
    REASON: {
      LEN_20: 1,                  // 이유 20자+
      LEN_40: 1,                  // 이유 40자+ 추가
      KW: 1,                      // 구체적 근거 키워드
      INITIAL_UPVOTES: 2,         // 20자+ 이유 작성 시 게시판 초기 공감 부여 수
      CAP: 3                      // 이유 보너스 최대
    },

    // 무료 체험 전체 허용 패킷 (사용량 한도)
    TRIAL_INITIAL_PACKETS: 15,

    // 평가 게시판 등 유저 활동 누적 패킷 한도
    MAX_USER_BONUS: 50
  },

  // ============================================
  // 평가 게시판 → 관리자 자동 전달 임계치
  // ============================================
  // 사용자 평가가 일정 수준 이상의 공감을 받으면,
  // 관리자가 승인/채택하기 좋은 형태로 자동 정리되어
  // admin.html 알림장 수신함에 푸시됩니다.
  // 사업 확장 단계에 맞춰 값을 조정하세요.
  BOARD_ADMIN_PUSH: {
    ENABLED: true,
    MIN_UPVOTES: 3,            // 이 값 이상 공감이면 대상
    MIN_SCORE: 70,             // 이 점수 이상만 대상 (낮은 점수는 불만이므로 별도 처리)
    PREFER_STORY: true,        // 경험담이면 임계치 -1 완화
    CHALLENGED_EXCLUDED: true, // 검증 거친(악의 의심) 글은 제외
    // 채택 시 원작성자에게 줄 감사 패킷 (서버 관리자만 조정)
    ADOPT_REWARD_PACKETS: 5
  }
};

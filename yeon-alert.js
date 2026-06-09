/**
 * 연소사(이진우 님)를 위한 긴급 확인 & 인계사항 알리미 스크립트
 * 완전히 컴맹이신 사용자의 눈높이에 맞춰 상세하고 쉬운 용어로 작성되었습니다.
 * 모든 페이지 우측 하단에 주황색으로 깜빡이는 🔔 아이콘이 나타나며, 클릭 시 상세 팝업이 뜹니다.
 */
(function() {
    // 1. 스타일 동적 주입 (CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        /* 깜빡이는 알림 버튼 */
        #yeon-alert-trigger {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff6b6b, #ff8787);
            color: white;
            border: 3px solid #fff;
            box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            transition: all 0.3s ease;
            animation: yeon-blink 1.2s infinite alternate;
        }
        #yeon-alert-trigger:hover {
            transform: scale(1.1);
            box-shadow: 0 12px 28px rgba(255, 107, 107, 0.6);
        }
        @keyframes yeon-blink {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
                background: #ff6b6b;
            }
            100% {
                box-shadow: 0 0 0 15px rgba(255, 107, 107, 0);
                background: #ff3333;
            }
        }
        
        /* 팝업 모달창 배경 */
        #yeon-alert-modal {
            display: none; /* 기본 숨김 */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(5px);
            z-index: 9999999;
            justify-content: center;
            align-items: center;
            font-family: 'Pretendard', sans-serif;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        #yeon-alert-modal.show {
            display: flex;
            opacity: 1;
        }
        
        /* 팝업창 본체 */
        .yeon-modal-content {
            background: #ffffff;
            color: #2b2b2b;
            width: 90%;
            max-width: 580px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            overflow: hidden;
            animation: yeon-slideUp 0.4s ease;
            border: 1px solid #e2e8f0;
        }
        @keyframes yeon-slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        /* 헤더 */
        .yeon-modal-header {
            background: linear-gradient(135deg, #1f2937, #111827);
            color: #ffffff;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .yeon-modal-header h3 {
            margin: 0;
            font-size: 19px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .yeon-modal-close {
            background: transparent;
            border: none;
            color: #9ca3af;
            font-size: 24px;
            cursor: pointer;
            transition: color 0.2s;
        }
        .yeon-modal-close:hover {
            color: #ffffff;
        }
        
        /* 바디 */
        .yeon-modal-body {
            padding: 24px;
            max-height: 480px;
            overflow-y: auto;
            line-height: 1.6;
        }
        .yeon-alert-item {
            background: #f8fafc;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .yeon-alert-item.urgent {
            border-left-color: #ef4444;
            background: #fff5f5;
        }
        .yeon-alert-item.success {
            border-left-color: #10b981;
            background: #f0fdf4;
        }
        .yeon-alert-item h4 {
            margin: 0 0 8px 0;
            font-size: 16px;
            color: #0f172a;
            font-weight: 700;
        }
        .yeon-alert-item p {
            margin: 0 0 10px 0;
            font-size: 14.5px;
            color: #475569;
        }
        
        /* 쉬운 설명 가이드 */
        .yeon-guide-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 13.5px;
            color: #1e3a8a;
        }
        .yeon-guide-box strong {
            display: block;
            margin-bottom: 4px;
            color: #1e40af;
        }
        
        /* 푸터 */
        .yeon-modal-footer {
            padding: 16px 24px;
            background: #f1f5f9;
            text-align: right;
            border-top: 1px solid #e2e8f0;
        }
        .yeon-btn-confirm {
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .yeon-btn-confirm:hover {
            background: #1d4ed8;
        }
    `;
    document.head.appendChild(style);

    // 2. DOM 요소 동적 생성 및 body에 주입
    // 알림 버튼 생성
    const trigger = document.createElement('button');
    trigger.id = 'yeon-alert-trigger';
    trigger.innerHTML = '🔔';
    trigger.title = '연소사 긴급 확인 사항';
    document.body.appendChild(trigger);

    // 모달창 생성
    const modal = document.createElement('div');
    modal.id = 'yeon-alert-modal';
    
    modal.innerHTML = `
        <div class="yeon-modal-content">
            <div class="yeon-modal-header">
                <h3>🔔 연소사님(이진우 님) 필독 확인 사항</h3>
                <button class="yeon-modal-close" id="yeon-modal-close-btn">&times;</button>
            </div>
            <div class="yeon-modal-body">
                
                <!-- 건 1: API 키 미등록 -->
                <div class="yeon-alert-item urgent">
                    <h4>🚨 [긴급] 인공지능 API 키 미등록 (올풀 접수처 대기)</h4>
                    <p>
                        현재 한글의 결 접수처와 올풀 인공지능이 정상 작동하기 위한 <strong>'열쇠(API 키)'</strong>가 컴퓨터에 등록되지 않았습니다. 이 때문에 접수처가 켜지지 않고 있습니다.
                    </p>
                    <div class="yeon-guide-box">
                        <strong>🛠 어떻게 해결하나요? (컴맹용 안내)</strong>
                        1. 키보드의 윈도우 창 검색창에 <strong>"시스템 환경 변수 편집"</strong>을 치고 엔터를 칩니다.<br>
                        2. <strong>[환경 변수]</strong> 버튼을 누릅니다.<br>
                        3. 아래쪽 시스템 변수에서 <strong>[새로 만들기]</strong>를 누른 후,<br>
                        - 변수 이름: <code>ANTHROPIC_API_KEY</code> 입력<br>
                        - 변수 값: 발급받으신 영문/숫자로 된 <strong>API 비밀키</strong> 입력<br>
                        4. 확인을 누르고 컴퓨터를 한 번 껐다 켜거나 재부팅하시면 즉시 작동됩니다!
                    </div>
                </div>

                <!-- 건 2: 가격 요금제 v4 통일 확인 -->
                <div class="yeon-alert-item urgent">
                    <h4>💰 [가격 확정 대기] 가격 모델 v4 단일 요금제 확정 필요</h4>
                    <p>
                        기존에 복잡하던 <strong>'개별 질문 충전식(크레딧)'</strong> 방식을 폐지하고, 모든 앱 이용과 개인 기록은 평생 무료로 제공하되 AI 도움 횟수에만 차등을 두는 <strong>v4 단일 월 구독제</strong>로 정리했습니다.<br>
                        안티는 화면 표기와 안내 가이드를 모두 이 <strong>v4 단일제</strong>로 깔끔하게 정리해두었습니다!
                    </p>
                    <div class="yeon-guide-box">
                        <strong>⚠️ 꼭 알아두실 사항!</strong>
                        연소사님의 <strong>최종 승인/결정</strong>이 있어야 정식으로 돈이 결제되는 '중앙 멤버십 카드 결제 시스템' 개발에 착수합니다. 확정하시기 전까지는 임의로 결제 모듈이 설치되지 않으니 걱정하지 않으셔도 됩니다!
                    </div>
                </div>

                <!-- 건 3: 올풀 앱목록 탑재 완료 -->
                <div class="yeon-alert-item success">
                    <h4>✅ [완료] 통합 포털 메인에 '올풀' 바로가기 탑재</h4>
                    <p>
                        현재 원활하게 작동 중인 전과목 학습 참고서 <strong>올풀(https://curiosity-loop-theta.vercel.app)</strong>이 포털 사이트 메인 카드로 완전히 등록되었습니다. 이제 홈페이지에서 한 번의 클릭으로 접속이 가능합니다!
                    </p>
                </div>
                
            </div>
            <div class="yeon-modal-footer">
                <button class="yeon-btn-confirm" id="yeon-modal-ok-btn">확인했습니다</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 3. 이벤트 리스너 설정
    const openModal = () => {
        modal.classList.add('show');
    };
    const closeModal = () => {
        modal.classList.remove('show');
    };

    trigger.addEventListener('click', openModal);
    document.getElementById('yeon-modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('yeon-modal-ok-btn').addEventListener('click', closeModal);

    // 모달창 바깥 클릭 시 닫히기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
})();

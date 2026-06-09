import os

files = [
    r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_월간\index.html",
    r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html",
    r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_초등_월간\index.html"
]

target_code = """      // 도서관 링크가 있으면 지점 파라미터 전달하도록 수정
      var libNav = document.querySelector('.ynav a[href*="/도서관/"]');
      if (libNav && libNav.href.indexOf('from=samsan') === -1) {
        libNav.href = libNav.href.indexOf('?') >= 0 ? libNav.href + '&from=samsan' : libNav.href + '?from=samsan';
      }"""

replacement_code = """      // 도서관 링크가 있으면 지점 파라미터 전달하도록 수정
      var libNav = document.querySelector('.ynav a[href*="/도서관/"]');
      if (libNav && libNav.href.indexOf('from=samsan') === -1) {
        libNav.href = libNav.href.indexOf('?') >= 0 ? libNav.href + '&from=samsan' : libNav.href + '?from=samsan';
      }

      // 프린트용 삼산점 QR 배너 동적 주입 및 CSS 삽입
      var style = document.createElement('style');
      style.textContent = 
        '#samsan-print-qr { display: none; }' +
        '@media print {' +
        '  #samsan-print-qr { display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; text-align: center !important; margin: 40px auto 20px auto !important; padding: 15px !important; border: 1.5px dashed #2a5a4b !important; border-radius: 8px !important; background: #fff !important; width: 80% !important; max-width: 400px !important; page-break-inside: avoid !important; }' +
        '  #samsan-print-qr img { display: block !important; margin: 0 auto !important; width: 90px !important; height: 90px !important; }' +
        '  #samsan-print-qr p { margin: 4px 0 !important; font-size: 12px !important; color: #000 !important; font-family: sans-serif !important; font-weight: bold !important; }' +
        '  body.eco-print #samsan-print-qr { display: flex !important; border-color: #000 !important; }' +
        '  body.eco-print #samsan-print-qr p { color: #000 !important; }' +
        '}';
      document.head.appendChild(style);

      var qrBanner = document.createElement('div');
      qrBanner.id = 'samsan-print-qr';
      qrBanner.innerHTML = 
        '<div id="samsan-qr-holder" style="display:inline-block; margin-bottom:8px;"></div>' +
        '<p>📢 연삼산점 홈페이지 바로가기</p>' +
        '<p style="font-size:10px; font-weight:normal; color:#555; margin: 2px 0 0 0;">스캔하시면 삼산점 소식과 간담회 일정을 확인하실 수 있습니다.</p>' +
        '<p style="font-size:10px; font-weight:normal; color:#777; margin: 2px 0 0 0;">https://yeon-samsan.pages.dev</p>';
      
      var container = document.querySelector('.wrap') || document.body;
      container.appendChild(qrBanner);

      try {
        new QRCode(document.getElementById('samsan-qr-holder'), {
          text: samsanUrl,
          width: 90,
          height: 90,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch(e) {
        console.error('Failed to generate Samsan QR code:', e);
      }"""

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "samsan-print-qr" in content:
        print(f"Already updated: {os.path.basename(file_path)}")
        continue
        
    if target_code in content:
        new_content = content.replace(target_code, replacement_code)
        with open(file_path, 'w', encoding='utf-8') as f_out:
            f_out.write(new_content)
        print(f"Successfully updated: {os.path.basename(file_path)}")
    else:
        print(f"Target code pattern not found in: {os.path.basename(file_path)}")

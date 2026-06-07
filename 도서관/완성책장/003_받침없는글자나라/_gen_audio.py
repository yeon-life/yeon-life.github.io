# 003 받침없는글자나라 — 고급 음성(mp3) 사전 생성
# 무료 Edge 신경망 음성(선희 여 / 인준 남)으로 페이지 + 본문 '모든 한글 단어' mp3를 굽는다.
import re, os, json, asyncio, edge_tts

BASE = os.path.dirname(os.path.abspath(__file__))
data = open(os.path.join(BASE, 'data.js'), encoding='utf-8').read()

# 페이지 본문 (line:"...") 16개
pages = re.findall(r'line:"((?:[^"\\]|\\.)*)"', data)
pages = [p.replace('\\n', '  ').replace('—', '') for p in pages]

# 본문에 등장하는 모든 한글 단어(음절·낱자 포함) — 등장 순서, 중복 제거
HANGUL = re.compile(r'[가-힣ㄱ-ㅎㅏ-ㅣ]+')
toks, seen = [], set()
for p in pages:
    for t in HANGUL.findall(p):
        if t not in seen:
            seen.add(t); toks.append(t)

VOICES = {'sunhi': 'ko-KR-SunHiNeural', 'injoon': 'ko-KR-InJoonNeural'}
AUD = os.path.join(BASE, 'audio')

sem = asyncio.Semaphore(6)
fails = []
async def gen(text, out, voice):
    async with sem:
        for _ in range(3):
            try:
                await edge_tts.Communicate(text, voice).save(out)
                return
            except Exception:
                await asyncio.sleep(1.2)
        fails.append(out)

async def main():
    tasks = []
    for vi, voice in VOICES.items():
        d = os.path.join(AUD, vi)
        os.makedirs(d, exist_ok=True)
        for i, txt in enumerate(pages):
            tasks.append(gen(txt, os.path.join(d, f'p{i+1:02d}.mp3'), voice))
        for idx, w in enumerate(toks):
            tasks.append(gen(w, os.path.join(d, f'w{idx:03d}.mp3'), voice))
    await asyncio.gather(*tasks)

asyncio.run(main())

manifest = {
    'voices': list(VOICES.keys()),
    'labels': {'sunhi': '선희(여)', 'injoon': '인준(남)'},
    'pages': len(pages),
    'words': {w: f'w{idx:03d}' for idx, w in enumerate(toks)}
}
json.dump(manifest, open(os.path.join(AUD, 'manifest.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=0)
print('pages', len(pages), 'words(tokens)', len(toks), 'fails', len(fails))
if fails:
    print('FAILED:', fails[:10])

import json
import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the <script id="issue-data" type="application/json"> block
pattern = re.compile(r'(<script id="issue-data" type="application/json">)(.*?)(</script>)', re.DOTALL)
match = pattern.search(content)

if match:
    start_tag = match.group(1)
    json_text = match.group(2)
    end_tag = match.group(3)
    
    data = json.loads(json_text.strip())
    
    # Check if 'record' key already exists to prevent duplication
    exists = any(c.get("key") == "record" for c in data["corners"])
    if not exists:
        record_corner = {
            "key": "record",
            "title": "📝 생각 보물상자 · 기록놀이",
            "headline": "동글동글 내 생각을 적어두는 마법의 수첩!",
            "dek": "흘러가는 반짝이는 생각들을 귀여운 글과 그림으로 꼭꼭 잡아두는 마법을 배워요.",
            "body_md": "## 내 생각을 담는 마법의 그물, 기록!\n\n친구들, 오늘 아침에 무슨 꿈을 꿨는지 기억하나요? 어제 어린이집이나 유치원에서 어떤 장난을 치며 웃었는지 기억하나요?\n우리의 반짝이는 생각들은 하늘을 지나가는 구름 같아서 금방 휙 사라져 버려요.\n하지만 이 소중한 생각들을 평생 나의 보물로 남겨둘 수 있는 **마법**이 있어요. 바로 **'기록(적어두기)'**이랍니다!\n\n### 1. 에디슨 할아버지의 비밀 노트\n세상에 없던 전등과 녹음기를 만든 위대한 발명가 에디슨 할아버지는 평생 머릿속에 떠오른 모든 생각을 수첩에 적어두었어요.\n아주 사소한 생각이나 서툰 그림도 다 모아서 책으로 만드니, 그것들이 나중에 멋진 발명품이 되었답니다.\n에디슨 할아버지가 기억력이 천재라서 그랬을까요? 아니에요! 잊어버리기 전에 수첩에 꼭꼭 적어두었기 때문이에요.\n\n### 2. 오늘부터 나도 '생각 탐험가'!\n*   **첫째, 내 마음에 드는 작은 수첩 준비하기**: 예쁜 스티커를 붙인 나만의 수첩을 만들어 보세요.\n*   **둘째, 하루에 딱 한 줄만 적기**: 길게 쓰지 않아도 괜찮아요. \"오늘 먹은 사과가 정말 달콤했다\", \"오늘 지렁이를 봐서 신기했다\"처럼 짧게 적어보세요.\n*   **셋째, 글씨를 몰라도 그림으로 그리기**: 아직 글을 쓰기 힘들다면 동그라미, 세모로 내 기분을 그리거나 귀여운 그림으로 생각을 남겨보세요. 그림도 멋진 기록이 된답니다.\n\n---\n\n### 🧸 엄마, 아빠와 약속해요!\n오늘 수업이 끝나고 나서, 오늘 가장 기뻤던 일 한 가지를 수첩에 글씨나 그림으로 남겨보세요.\n나중에 수첩을 다시 열어보면 \"우와, 내가 이런 생각도 했었네!\" 하고 깜짝 놀라며 기뻐하게 될 거예요.",
            "future_note": "오늘 가장 재미있었던 단어 하나를 나만의 생각 수첩에 그림이나 짧은 한 줄로 남겨보아요.",
            "thoughtQuestions": [
                "만약 10년 뒤의 내가 지금 내가 그린 생각 수첩을 다시 본다면 나에게 어떤 말을 해주고 싶을까요?",
                "오늘 흘려보내지 않고 꼭꼭 적어두고 싶은 가장 예쁘고 소중한 생각은 무엇인가요?"
            ],
            "app_verdict": "유아의 메타인지 발달과 자기성찰 능력 함양을 위해 설계된 기록 습관 형성 교육 콘텐츠입니다. 삼산 연아카데미 수업 지도 교재 연계.",
            "sources": [
                {"name": "연삼산점 학습 습관 코칭 가이드", "url": "https://yeon-samsan.pages.dev/"}
            ],
            "critique": {
                "fact_verdict": "clean",
                "false_claims": [],
                "readability": 5,
                "links_checked": 1,
                "links_ok": 1,
                "dead_links": []
            },
            "corrected": 0,
            "imgPrompt": "Soft pastel watercolor of a cute happy young Korean child sitting on a fluffy cushion, writing and drawing with a colorful crayon in a small sketchbook, magic sparkles and hearts floating in the air, warm cream background",
            "aiRole": "세상의 모든 소중한 상상을 글과 그림으로 간직해 주는 꼬마 기록 요정",
            "aiSuggestions": [
                "글씨를 쓰기 힘들 때는 어떻게 기록을 남기면 좋을까요?",
                "오늘 내 기분을 그림으로 그린다면 어떤 색깔로 칠하고 싶나요?",
                "에디슨 할아버지는 하루에 몇 번이나 수첩에 적으셨나요?"
            ],
            "cartoonCuts": [
                {"cut": 1, "emoji": "📝", "caption": "나만의 반짝이는 생각 수첩을 준비해요."},
                {"cut": 2, "emoji": "☁️", "caption": "스쳐 지나가는 예쁜 생각들을 잊지 않게 꽉 잡아요."},
                {"cut": 3, "emoji": "👴", "caption": "위대한 발명가 에디슨 할아버지도 매일 노트를 썼대요."},
                {"cut": 4, "emoji": "✍️", "caption": "욕심내지 않고 하루에 딱 한 줄씩만 적어봐요."},
                {"cut": 5, "emoji": "🎨", "caption": "글씨를 몰라도 괜찮아요! 내 감정을 그림으로 그려요."},
                {"cut": 6, "emoji": "📖", "caption": "하나씩 모인 글과 그림은 나만의 소중한 보물책이 돼요."},
                {"cut": 7, "emoji": "🤝", "caption": "오늘 밤, 가장 재미있었던 일을 수첩에 남기기로 약속!"},
                {"cut": 8, "emoji": "💖", "caption": "기록 마법을 통해 무럭무럭 자라나는 멋진 어린이가 되어요."}
            ]
        }
        data["corners"].append(record_corner)
        
        # Format JSON with indent=2 and ensure_ascii=False for clean Korean text
        new_json_text = "\n" + json.dumps(data, indent=2, ensure_ascii=False) + "\n  "
        
        # Replace the script block content
        new_content = content[:match.start(2)] + new_json_text + content[match.end(2):]
        
        with open(path, 'w', encoding='utf-8') as f_out:
            f_out.write(new_content)
        print("Successfully added record corner to yuchi index.html")
    else:
        print("Record corner already exists in yuchi index.html")
else:
    print("Could not find issue-data script block in yuchi index.html")

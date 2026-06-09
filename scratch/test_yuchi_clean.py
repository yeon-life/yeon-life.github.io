path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find matches for '</script>'
import re
matches = list(re.finditer(r'</script>', content))

if len(matches) >= 2:
    first_end = matches[0].end()
    second_end = matches[1].end()
    
    # Let's see what is after the second script tag
    print("After second script tag preview:")
    print(repr(content[second_end:second_end+200]))
    
    # Build clean content:
    # Everything before first </script>, plus the first </script>, plus everything after the second </script>
    clean_content = content[:first_end] + content[second_end:]
    
    # Save to temp file to verify
    temp_path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\scratch\temp_yuchi_clean.html"
    with open(temp_path, 'w', encoding='utf-8') as f_out:
        f_out.write(clean_content)
    print("Wrote clean version to scratch/temp_yuchi_clean.html")
    
    # Let's verify that the JSON parses and there's only one issue-data script tag
    pattern = re.compile(r'<script id="issue-data" type="application/json">(.*?)</script>', re.DOTALL)
    matches_clean = pattern.findall(clean_content)
    print(f"Number of issue-data matches in clean version: {len(matches_clean)}")
    try:
        import json
        data = json.loads(matches_clean[0].strip())
        print(f"Valid JSON in clean version! Issue: {data.get('issue')}, Corners: {len(data.get('corners', []))}")
    except Exception as e:
        print("JSON error in clean version:", str(e))
else:
    print("Not enough script tags to clean")

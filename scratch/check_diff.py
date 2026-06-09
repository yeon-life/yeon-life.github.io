import subprocess

cwd = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"
# Let's run git diff 0e2c7a4~1 0e2c7a4 -- 어린이의_결_초등_월간/js/grade_data.js and write it to scratch/grade_data_diff.txt
cmd = ["git", "diff", "0e2c7a4~1", "0e2c7a4", "--", "어린이의_결_초등_월간/js/grade_data.js"]
res = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='ignore')

with open("scratch/grade_data_diff.txt", "w", encoding="utf-8") as out:
    out.write(res.stdout)

print(f"Diff output size: {len(res.stdout)} chars. Saved to scratch/grade_data_diff.txt")

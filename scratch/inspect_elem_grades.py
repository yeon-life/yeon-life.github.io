import json
import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_초등_월간\js\grade_data.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The file defines var GRADE_DATA = { ... };
# We can find the JSON block inside GRADE_DATA = ...
# Since it is a JavaScript assignment, let's parse it using a simple regex or node, or since it's standard JS object, we can run it in Node and print details.
# Let's write a node script to print the keys of GRADE_DATA and corners for each grade.
node_script = """
const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync('어린이의_결_초등_월간/js/grade_data.js', 'utf8');
// Evaluate it
eval(fileContent);

const result = {};
for (const grade in GRADE_DATA) {
  result[grade] = {
    issue: GRADE_DATA[grade].issue,
    corners: GRADE_DATA[grade].corners.map(c => ({
      key: c.key,
      title: c.title,
      headline: c.headline
    }))
  };
}

fs.writeFileSync('scratch/grade_data_corners.json', JSON.stringify(result, null, 2), 'utf8');
console.log("Done writing grade corners to scratch/grade_data_corners.json");
"""

with open("scratch/inspect_elem_grades.js", "w", encoding="utf-8") as f_out:
    f_out.write(node_script)

print("Created inspection script scratch/inspect_elem_grades.js")

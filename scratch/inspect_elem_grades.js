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

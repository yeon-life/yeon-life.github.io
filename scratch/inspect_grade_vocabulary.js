const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync('어린이의_결_초등_월간/js/grade_data.js', 'utf8');
eval(fileContent);

for (const grade in GRADE_DATA) {
  console.log(`Grade ${grade}:`);
  GRADE_DATA[grade].corners.forEach((c, idx) => {
    console.log(`  Corner ${idx} (${c.key}): has vocabulary? ${'vocabulary' in c}`);
  });
}

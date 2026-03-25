const fs = require('fs');
const file = './components/inspo/ModelDetailPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import Colors from '@/constants/Colors';")) {
  content = content.replace(
    "import { Typography } from '@/constants/Typography';",
    "import { Typography } from '@/constants/Typography';\nimport Colors from '@/constants/Colors';"
  );
  fs.writeFileSync(file, content);
}

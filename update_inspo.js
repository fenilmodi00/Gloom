const fs = require('fs');
const file = './components/inspo/InspoBottomSheet.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { TrendingGrid } from './TrendingGrid';",
  "import { TrendingGrid } from './TrendingGrid';\nimport Colors from '@/constants/Colors';"
);

content = content.replace(
  "backgroundColor: '#FDFAF6', // bgSurface",
  "backgroundColor: Colors.light.bgSurface,"
);

content = content.replace(
  "backgroundColor: '#EAE4DA', // bgMuted",
  "backgroundColor: Colors.light.bgMuted,"
);

fs.writeFileSync(file, content);

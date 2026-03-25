const fs = require('fs');
const file = './components/inspo/ModelCarousel.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import Animated from 'react-native-reanimated';",
  "import Animated from 'react-native-reanimated';\nimport { Typography } from '@/constants/Typography';\nimport Colors from '@/constants/Colors';"
);

content = content.replace(
  /className="text-lg font-heading text-white"\n                style={{ textShadowColor: 'rgba\(0,0,0,0.4\)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}/g,
  "style={{ ...Typography.heading3, color: Colors.light.textOnDark, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}"
);

content = content.replace(
  /className="text-sm font-normal text-white\/90"\n                style={{ textShadowColor: 'rgba\(0,0,0,0.4\)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}/g,
  "style={{ ...Typography.bodySmall, color: 'rgba(255, 255, 255, 0.9)', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}"
);

fs.writeFileSync(file, content);

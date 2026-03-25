const fs = require('fs');
const file = './app/(tabs)/inspo/index.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import Colors from '@/constants/Colors';",
  "import Colors from '@/constants/Colors';\nimport { Typography } from '@/constants/Typography';"
);

content = content.replace(
  "  title: {\n    fontSize: 34,\n    fontWeight: '600',\n    color: Colors.light.textPrimary,\n    fontStyle: 'italic',\n    letterSpacing: -0.5,\n    textShadowColor: 'rgba(0, 0, 0, 0.3)',\n    textShadowOffset: { width: 0, height: 1 },\n    textShadowRadius: 4,\n  },",
  "  title: {\n    ...Typography.heading1,\n    fontSize: 34,\n    color: Colors.light.textPrimary,\n    fontStyle: 'italic',\n    textShadowColor: 'rgba(0, 0, 0, 0.3)',\n    textShadowOffset: { width: 0, height: 1 },\n    textShadowRadius: 4,\n  },"
);

content = content.replace(
  "  uploadText: {\n    fontSize: 14,\n    fontWeight: '600',\n    color: Colors.light.bgSurface,\n  },",
  "  uploadText: {\n    ...Typography.uiLabelMedium,\n    fontWeight: '600',\n    color: Colors.light.bgSurface,\n  },"
);

fs.writeFileSync(file, content);

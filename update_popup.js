const fs = require('fs');
const file = './components/inspo/ModelDetailPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { MOCK_OUTFIT } from '@/types/wardrobe';",
  "import { MOCK_OUTFIT } from '@/types/wardrobe';\nimport Colors from '@/constants/Colors';\nimport { Typography } from '@/constants/Typography';"
);

// We need to replace usages of local `COLORS` mapping with `Colors.light`
content = content.replace(
  /const COLORS = {\n  background: '#FDFAF6',\n  surface: '#FFFFFF',\n  textPrimary: '#1A1A1A',\n  textSecondary: '#6B6B6B',\n  accent: '#8B7355',\n};/m,
  "// COLORS removed in favor of Colors.light"
);

content = content.replace(/COLORS\.background/g, "Colors.light.bgCanvas");
content = content.replace(/COLORS\.surface/g, "Colors.light.bgSurface");
content = content.replace(/COLORS\.textPrimary/g, "Colors.light.textPrimary");
content = content.replace(/COLORS\.textSecondary/g, "Colors.light.textSecondary");
content = content.replace(/COLORS\.accent/g, "Colors.light.primary");

// Replace font styles with Typography
content = content.replace(
  /hintText: {[^}]*},/m,
  "hintText: {\n    ...Typography.bodySmall,\n    color: Colors.light.textSecondary,\n  },"
);

content = content.replace(
  /outfitTitle: {[^}]*},/m,
  "outfitTitle: {\n    ...Typography.heading3,\n    color: Colors.light.textPrimary,\n  },"
);

content = content.replace(
  /emptyText: {[^}]*},/m,
  "emptyText: {\n    ...Typography.body,\n    color: Colors.light.textSecondary,\n  },"
);

content = content.replace(
  /saveBtnText: {[^}]*},/m,
  "saveBtnText: {\n    ...Typography.uiLabelMedium,\n    color: Colors.light.primary,\n  },"
);

content = content.replace(
  /shareBtnText: {[^}]*},/m,
  "shareBtnText: {\n    ...Typography.uiLabelMedium,\n    color: Colors.light.bgSurface,\n  },"
);

fs.writeFileSync(file, content);

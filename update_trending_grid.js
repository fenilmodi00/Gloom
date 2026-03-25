const fs = require('fs');
const file = './components/inspo/TrendingGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import type { TrendingItem, TrendingSection } from '@/types/inspo';",
  "import type { TrendingItem, TrendingSection } from '@/types/inspo';\nimport Colors from '@/constants/Colors';\nimport { Typography } from '@/constants/Typography';"
);

// Replace styles
content = content.replace(
  /mainTitle: {[^}]*},/m,
  "mainTitle: {\n    ...Typography.heading2,\n    color: Colors.light.textPrimary,\n    marginBottom: 16,\n    marginHorizontal: 24,\n  },"
);

content = content.replace(
  /categoryChip: {[^}]*},/m,
  "categoryChip: {\n    paddingHorizontal: 16,\n    paddingVertical: 8,\n    borderRadius: 999,\n    backgroundColor: Colors.light.bgSurface,\n    borderWidth: 1,\n    borderColor: Colors.light.bgMuted,\n  },"
);

content = content.replace(
  /categoryChipActive: {[^}]*},/m,
  "categoryChipActive: {\n    backgroundColor: Colors.light.primary,\n    borderColor: Colors.light.primary,\n  },"
);

content = content.replace(
  /categoryText: {[^}]*},/m,
  "categoryText: {\n    ...Typography.bodySmall,\n    color: Colors.light.textSecondary,\n  },"
);

content = content.replace(
  /categoryTextActive: {[^}]*},/m,
  "categoryTextActive: {\n    color: Colors.light.textOnDark,\n    fontWeight: '600',\n  },"
);

content = content.replace(
  /sectionTitle: {[^}]*},/m,
  "sectionTitle: {\n    ...Typography.heading3,\n    color: Colors.light.textPrimary,\n    marginBottom: 12,\n    marginLeft: 24,\n  },"
);

content = content.replace(
  /card: {[^}]*elevation: 3,\n  },/m,
  "card: {\n    width: CARD_WIDTH,\n    height: CARD_HEIGHT,\n    borderRadius: 16,\n    overflow: 'hidden',\n    backgroundColor: Colors.light.bgSurfaceRaised,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.08,\n    shadowRadius: 8,\n    elevation: 3,\n  },"
);

content = content.replace(
  /outfitName: {[^}]*textShadowRadius: 3,\n  },/m,
  "outfitName: {\n    ...Typography.productName,\n    color: '#FFFFFF',\n    textShadowColor: 'rgba(0, 0, 0, 0.5)',\n    textShadowOffset: { width: 0, height: 1 },\n    textShadowRadius: 3,\n  },"
);

content = content.replace(
  /tryOnText: {[^}]*},/m,
  "tryOnText: {\n    ...Typography.uiLabel,\n    color: Colors.light.textPrimary,\n  },"
);

fs.writeFileSync(file, content);

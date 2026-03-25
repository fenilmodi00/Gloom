const fs = require('fs');
const file = './components/inspo/TrendingGrid.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "  card: {\n    width: CARD_WIDTH,\n    height: CARD_HEIGHT,\n    borderRadius: 16,\n    overflow: 'hidden',\n    backgroundColor: '#F0EBE3', // bgSurfaceRaised\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.08,\n    shadowRadius: 8,\n    elevation: 3,\n  },",
  "  card: {\n    width: CARD_WIDTH,\n    height: CARD_HEIGHT,\n    borderRadius: 16,\n    overflow: 'hidden',\n    backgroundColor: Colors.light.bgSurfaceRaised,\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 2 },\n    shadowOpacity: 0.08,\n    shadowRadius: 8,\n    elevation: 3,\n  },"
);

content = content.replace(
  "  outfitName: {\n    fontSize: 13,\n    fontWeight: '600',\n    color: '#FFFFFF',\n    textShadowColor: 'rgba(0, 0, 0, 0.5)',\n    textShadowOffset: { width: 0, height: 1 },\n    textShadowRadius: 3,\n  },",
  "  outfitName: {\n    ...Typography.productName,\n    color: '#FFFFFF',\n    textShadowColor: 'rgba(0, 0, 0, 0.5)',\n    textShadowOffset: { width: 0, height: 1 },\n    textShadowRadius: 3,\n  },"
);

fs.writeFileSync(file, content);

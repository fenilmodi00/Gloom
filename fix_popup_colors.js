const fs = require('fs');
const file = './components/inspo/ModelDetailPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const COLORS = {\n  background: '#FDFAF6',\n  surface: '#FFFFFF',\n  textPrimary: '#1A1A1A',\n  textSecondary: '#6B6B6B',\n  accent: '#8B7355',\n};/m,
  "// COLORS removed in favor of Colors.light"
);

fs.writeFileSync(file, content);

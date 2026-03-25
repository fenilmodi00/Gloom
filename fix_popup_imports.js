const fs = require('fs');
const file = './components/inspo/ModelDetailPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

// The original import might look like: import { Brand, Backgrounds, Typography } from '@/constants/Colors';
// but we just added import Colors from '@/constants/Colors'; and import { Typography } from '@/constants/Typography';

// Let's replace the COLORS constant entirely and also fix the imports.
content = content.replace(
  "import { Brand, Backgrounds, Typography } from '@/constants/Colors';",
  ""
);

content = content.replace(
  /const COLORS = {\n  background: Backgrounds.bgCanvas,\n  surface: Backgrounds.bgSurface,\n  textPrimary: Typography.textPrimary,\n  textSecondary: Typography.textSecondary,\n  accent: Brand.primary,\n};/m,
  "// COLORS removed in favor of Colors.light"
);

content = content.replace(/COLORS\.background/g, "Colors.light.bgCanvas");
content = content.replace(/COLORS\.surface/g, "Colors.light.bgSurface");
content = content.replace(/COLORS\.textPrimary/g, "Colors.light.textPrimary");
content = content.replace(/COLORS\.textSecondary/g, "Colors.light.textSecondary");
content = content.replace(/COLORS\.accent/g, "Colors.light.primary");

fs.writeFileSync(file, content);

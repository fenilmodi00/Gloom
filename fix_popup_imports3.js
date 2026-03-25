const fs = require('fs');
const file = './components/inspo/ModelDetailPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { Typography }")) {
  content = content.replace(
    "import React, { useRef, useState, useMemo } from 'react';",
    "import React, { useRef, useState, useMemo } from 'react';\nimport { Typography } from '@/constants/Typography';\nimport Colors from '@/constants/Colors';"
  );
  fs.writeFileSync(file, content);
}

const fs = require('fs');
const file = './components/inspo/ModelDetailPopup.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { Typography }")) {
  content = content.replace(
    "import React, { useEffect, useState, useCallback } from 'react';",
    "import React, { useEffect, useState, useCallback } from 'react';\nimport { Typography } from '@/constants/Typography';\nimport Colors from '@/constants/Colors';"
  );
  fs.writeFileSync(file, content);
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all .ts and .tsx files (excluding node_modules and dist)
const getAllTsFiles = () => {
  const output = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist', { encoding: 'utf8' });
  return output.trim().split('\n').filter(Boolean);
};

// Find all exports in a file
const findExports = (content) => {
  const exportRegex = /export\s+(?:const\s+(\w+)|function\s+(\w+)|class\s+(\w+)|type\s+(\w+)|interface\s+(\w+)|(\w+)\s*=\s*[^;])/g;
  const exports = [];
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    // Check which capture group matched
    for (let i = 1; i <= 5; i++) {
      if (match[i]) {
        exports.push(match[i]);
        break;
      }
    }
  }
  
  // Also find named exports like export { func1, func2 }
  const namedExportRegex = /export\s*\{\s*([^}]+)\s*\}/g;
  let namedMatch;
  while ((namedMatch = namedExportRegex.exec(content)) !== null) {
    const items = namedMatch[1].split(',').map(item => item.trim()).filter(Boolean);
    exports.push(...items);
  }
  
  return exports;
};

// Find all imports in all files
const findAllImports = (files) => {
  const imports = new Set();
  const importRegex = /import\s+(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Convert to absolute path
        let resolvedPath = path.resolve(path.dirname(file), importPath);
        // Try with extensions
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        let found = false;
        for (const ext of extensions) {
          const testPath = resolvedPath + ext;
          if (fs.existsSync(testPath)) {
            imports.add(testPath);
            found = true;
            break;
          }
        }
        // If not found with extension, try as directory/index
        if (!found) {
          const indexPath = path.join(resolvedPath, 'index.ts');
          const indexPathTsx = path.join(resolvedPath, 'index.tsx');
          if (fs.existsSync(indexPath)) {
            imports.add(indexPath);
          } else if (fs.existsSync(indexPathTsx)) {
            imports.add(indexPathTsx);
          }
        }
      }
    } catch (err) {
      console.error(`Error reading ${file}: ${err.message}`);
    }
  }
  
  return imports;
};

const main = () => {
  console.log('Finding unused exports...');
  
  const files = getAllTsFiles();
  console.log(`Found ${files.length} TypeScript files`);
  
  const allExports = new Map(); // file -> [export names]
  const allImports = findAllImports(files);
  
  // Collect all exports from each file
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const exports = findExports(content);
      if (exports.length > 0) {
        allExports.set(file, exports);
      }
    } catch (err) {
      console.error(`Error processing ${file}: ${err.message}`);
    }
  }
  
  // Find unused exports
  const unusedExports = [];
  
  for (const [file, exports] of allExports.entries()) {
    // Get the absolute path of the file
    const absFile = path.resolve(file);
    
    for (const exportName of exports) {
      // Check if this export is imported anywhere
      const isUsed = Array.from(allImports).some(importPath => {
        // Check if the import path refers to this file and imports this export
        // This is a simplified check - in reality we'd need to parse what's imported
        return importPath === absFile;
      });
      
      // If we can't easily determine usage, mark for manual review
      if (!isUsed) {
        unusedExports.push({ file, exportName });
      }
    }
  }
  
  console.log(`\\nFound ${unusedExports.length} potentially unused exports:`);
  unusedExports.forEach(item => {
    console.log(`  ${item.file}: ${item.exportName}`);
  });
  
  // Also find files that are never imported
  console.log(`\\nChecking for orphaned files...`);
  const importedFiles = new Set();
  allImports.forEach(importPath => {
    importedFiles.add(importPath);
  });
  
  const orphanedFiles = files.filter(file => {
    const absFile = path.resolve(file);
    return !importedFiles.has(absFile);
  });
  
  console.log(`Found ${orphanedFiles.length} orphaned files:`);
  orphanedFiles.forEach(file => {
    console.log(`  ${file}`);
  });
};

main();
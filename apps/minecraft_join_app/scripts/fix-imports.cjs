const fs = require("fs");
const path = require("path");

// Walk dist/ and add .js to local ESM imports
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  const fixed = content.replace(
    /from\s+["'](\.\/.+?)["'];/g,
    (match, importPath) => {
      if (!importPath.endsWith(".js")) {
        return `from "${importPath}.js";`;
      }
      return match;
    }
  );
  fs.writeFileSync(filePath, fixed, "utf8");
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith(".js")) {
      fixImportsInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, "../dist"));
console.log("Fixed ESM imports in dist/");

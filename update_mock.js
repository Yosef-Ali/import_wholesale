const fs = require('fs');
let code = fs.readFileSync('frontend/src/api/client.ts', 'utf8');

if (!code.includes('const inMemoryStore: Record<string, any[]> = {};')) {
  // Replace the start of getDevMockList
  code = code.replace(
    /function getDevMockList\(doctype: string\): any\[\] \{/,
    `const inMemoryStore: Record<string, any[]> = {};

function getDevMockList(doctype: string): any[] {
  if (inMemoryStore[doctype]) return inMemoryStore[doctype];
`
  );

  // Replace each return [ with inMemoryStore[doctype] = [
  code = code.replace(/if \(doctype === 'Purchase Order'\) \{\s+return \[/, "if (doctype === 'Purchase Order') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Sales Order'\) \{\s+return \[/, "if (doctype === 'Sales Order') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Sales Invoice'\) \{\s+return \[/, "if (doctype === 'Sales Invoice') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Import Shipment'\) \{\s+return \[/, "if (doctype === 'Import Shipment') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Item Group'\) \{\s+return \[/, "if (doctype === 'Item Group') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'User'\) \{\s+return \[/, "if (doctype === 'User') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Customer'\) \{\s+return \[/, "if (doctype === 'Customer') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Supplier'\) \{\s+return \[/, "if (doctype === 'Supplier') {\n    inMemoryStore[doctype] = [");
  code = code.replace(/if \(doctype === 'Warehouse'\) \{\s+return \[/, "if (doctype === 'Warehouse') {\n    inMemoryStore[doctype] = [");
  
  // Replace Item mock specifically to add images
  code = code.replace(/if \(doctype === 'Item'\) \{\s+return \[\s+([^\]]+)\s+\];\s+\}/, (match, itemsStr) => {
    let newItemsStr = itemsStr.replace(/\{([^}]+)\}/g, (m, inner) => {
      let nameMatch = inner.match(/name:\s*'([^']+)'/);
      if (nameMatch) {
         let imgUrl = `https://placehold.co/400x400/2563EB/FFFFFF?text=${encodeURIComponent(nameMatch[1].split('-').join(' '))}`;
         return `{${inner}, image: '${imgUrl}' }`;
      }
      return m;
    });
    return `if (doctype === 'Item') {\n    inMemoryStore[doctype] = [\n      ${newItemsStr}\n    ];\n  }`;
  });

  // Replace trailing ]; } with ]; return inMemoryStore[doctype]; }
  code = code.replace(/\];\s+\}/g, "];\n    return inMemoryStore[doctype];\n  }");

  // Ensure last return [] remains, but update docs that don't match
  code = code.replace(/return \[\];\n\}/, "return inMemoryStore[doctype] || [];\n}");
  
  // Now we need to update updateDoc to mutate inMemoryStore
  code = code.replace(
    /console\.warn\(`\[DEV\] updateDoc\(\$\{doctype\}, \$\{name\}\) failed, returning mocked payload`\);\n\s+return \{ name, \.\.\.data \} as unknown as T;/,
    `console.warn(\`[DEV] updateDoc(\${doctype}, \${name}) failed, modifying inMemoryStore\`);
      const store = getDevMockList(doctype);
      const idx = store.findIndex(i => i.name === name);
      if (idx !== -1) {
        store[idx] = { ...store[idx], ...data };
        return store[idx] as unknown as T;
      }
      return { name, ...data } as unknown as T;`
  );

  // Update createDoc to mutate inMemoryStore
  code = code.replace(
    /console\.warn\(`\[DEV\] createDoc\(\$\{doctype\}\) failed, returning mocked payload`\);\n\s+return \{ name: `MOCK-\$\{Date\.now\(\)\}`, \.\.\.data \} as unknown as T;/,
    `console.warn(\`[DEV] createDoc(\${doctype}) failed, modifying inMemoryStore\`);
      const store = getDevMockList(doctype);
      const newDoc = { name: \`MOCK-\${Date.now()}\`, ...data };
      store.push(newDoc);
      return newDoc as unknown as T;`
  );

  // Update deleteDoc to mutate inMemoryStore
  code = code.replace(
    /console\.warn\(`\[DEV\] deleteDoc\(\$\{doctype\}, \$\{name\}\) failed, ignored in mock mode`\);\n\s+return;/,
    `console.warn(\`[DEV] deleteDoc(\${doctype}, \${name}) failed, modifying inMemoryStore\`);
      const store = getDevMockList(doctype);
      const idx = store.findIndex(i => i.name === name);
      if (idx !== -1) store.splice(idx, 1);
      return;`
  );

  fs.writeFileSync('frontend/src/api/client.ts', code);
  console.log('Updated mock logic!');
} else {
  console.log('Already updated.');
}

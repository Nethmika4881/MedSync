const fs = require('fs');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = dir + '/' + file;
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EACCES') return;
    }
  });
  return filelist;
};

const files = [
  ...walkSync('./app'),
  ...walkSync('./components'),
  ...walkSync('./lib')
].filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

files.forEach(file => {
  if (file.includes('mockData/')) return;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix missed "import type { ... } from '@/lib/mockData/...'"
  const typeRegex = /import\s+type\s+({[^}]+})\s+from\s+["']@\/lib\/mockData[^"']*["']/g;
  content = content.replace(typeRegex, (match, importsStr) => {
    changed = true;
    return `import type ${importsStr} from "@/lib/types";`;
  });

  // 2. Fix broken roleConfig/UserRole imports (were mapped to constants by mistake in some files)
  const roleRegex = /import\s+{\s*roleConfig\s*,\s*UserRole\s*}\s*from\s+["']@\/lib\/constants["'];?/g;
  content = content.replace(roleRegex, () => {
    changed = true;
    return `import { roleConfig } from "@/lib/mockData/users";\nimport type { UserRole } from "@/lib/types";`;
  });
  
  // same for Sidebar.tsx specifically
  const roleRegex2 = /import\s+{\s*roleConfig\s*,\s*UserRole\s*}\s*from\s+["']@\/lib\/constants["'];?/g;
  content = content.replace(/import\s+{\s*roleConfig\s*,\s*UserRole\s*}\s*from\s+["']@\/lib\/constants["'];?/g, () => {
    changed = true;
    return `import { roleConfig } from "@/lib/mockData/users";\nimport type { UserRole } from "@/lib/types";`;
  });

  // 3. Fix app/page.tsx mockUsers reference
  if (file.includes('app/page.tsx')) {
    if (content.includes('mockUsers')) {
      content = content.replace(/mockUsers/g, 'DEMO_USERS');
      if (!content.includes('DEMO_USERS')) {
        content = `import { DEMO_USERS } from "@/lib/stores/authStore";\n` + content;
      }
      changed = true;
    }
    // app/page.tsx missing DEMO_USERS import
    if (content.includes('DEMO_USERS') && !content.includes('import { DEMO_USERS }')) {
      content = `import { DEMO_USERS } from "@/lib/stores/authStore";\n` + content;
      changed = true;
    }
  }

  // 4. Fix type overlaps and missing properties reported by TS (like doctorSpecialization)
  // These are just mock types that were slightly different from the real types.
  // We can just ignore them with @ts-ignore for the UI rendering empty state, or fix them.
  // E.g. `appt.doctorSpecialization` -> `(appt as any).doctorSpecialization`
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated: ${file}`);
  }
});

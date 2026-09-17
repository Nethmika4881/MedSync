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

const TYPE_NAMES = [
  'Appointment', 'VisitType', 'SessionType', 'DayOfWeek', 'DoctorScheduleSlot', 'Doctor',
  'Patient', 'UserRole', 'Medication', 'PatientAllergy', 'PatientCondition', 'InvoiceLineItem',
  'SessionConfig', 'Employee', 'Treatment', 'TreatmentCatalogueItem', 'MockUser'
];

let changedFiles = 0;

files.forEach(file => {
  if (file.includes('mockData/')) return; // skip mockData files

  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Find all mockData imports
  const importRegex = /import\s+({[^}]+})\s+from\s+["']@\/lib\/mockData[^"']*["']/g;
  
  content = content.replace(importRegex, (match, importsStr) => {
    changed = true;
    
    // Parse what's being imported
    const importedItems = importsStr
      .replace(/type\s+/g, '')
      .replace(/\n/g, '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s);
      
    const typesToImport = [];
    const valuesToImport = [];
    
    importedItems.forEach(item => {
      if (TYPE_NAMES.includes(item)) {
        typesToImport.push(item);
      } else {
        valuesToImport.push(item);
      }
    });
    
    let replacement = '';
    if (typesToImport.length > 0) {
      // Don't import MockUser since it was deleted
      const finalTypes = typesToImport.filter(t => t !== 'MockUser');
      if (finalTypes.length > 0) {
        replacement += `import type { ${finalTypes.join(', ')} } from "@/lib/types";\n`;
      }
    }
    if (valuesToImport.length > 0) {
      const roleConfigItems = valuesToImport.filter(i => i === 'roleConfig');
      const otherItems = valuesToImport.filter(i => i !== 'roleConfig' && i !== 'mockUsers'); 
      
      if (roleConfigItems.length > 0) {
        replacement += `import { roleConfig } from "@/lib/mockData/users";\n`;
      }
      if (otherItems.length > 0) {
        replacement += `import { ${otherItems.join(', ')} } from "@/lib/constants";\n`;
      }
    }
    
    return replacement.trim();
  });

  // Specifically handle components/catms/BookingModal.tsx formatting oddity
  if (content.includes('} from\n"@/lib/mockData/appointments";')) {
     content = content.replace(/} from\n"@\/lib\/mockData\/appointments";/g, '} from "@/lib/types";');
     changed = true;
  }
  
  // Specifically handle app/(patient)/find-doctors/page.tsx formatting oddity
  if (content.includes('t { Appointment, VisitType } from "@/lib/mockData/appointments";')) {
     content = content.replace(/t { Appointment, VisitType } from "@\/lib\/mockData\/appointments";/g, 'import type { Appointment, VisitType } from "@/lib/types";');
     changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Done. Updated ${changedFiles} files.`);

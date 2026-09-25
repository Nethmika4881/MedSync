const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${filePath}`);
    }
}

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

// Admin
walk('./app/admin', (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    replaceInFile(filePath, [
        ['href="/doctors"', 'href="/admin/doctors"'],
        ['href="/staff"', 'href="/admin/staff"'],
        ['href="/insurance"', 'href="/admin/insurance"'],
        ['href="/consultations/', 'href="/doctor/consultations/'] // from dashboard
    ]);
});

// Front Desk
walk('./app/front-desk', (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    replaceInFile(filePath, [
        ['href="/patients"', 'href="/front-desk/patients"'],
        ['href="/appointments"', 'href="/front-desk/appointments"'],
        ['href="/consultations/', 'href="/doctor/consultations/'] // from dashboard
    ]);
});

// Doctor
walk('./app/doctor', (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    replaceInFile(filePath, [
        ['href="/consultations"', 'href="/doctor/consultations"'],
        ['href={`/consultations/', 'href={`/doctor/consultations/'],
        ['href="/consultations/', 'href="/doctor/consultations/']
    ]);
});

// Patient
walk('./app/patient', (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    replaceInFile(filePath, [
        ['href="/consultations/', 'href="/doctor/consultations/'] // from dashboard
    ]);
});


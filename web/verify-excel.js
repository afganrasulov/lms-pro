const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/Users/kent/Downloads/Dijital Reklam İçin Tasarım ve Animasyon Kursu.xlsx';

// Helper for robust header matching
const getValue = (row, keys) => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
        // 1. Exact match
        if (row[key] !== undefined) return row[key];

        // 2. Case-insensitive & Trimmed match
        const foundKey = rowKeys.find(k =>
            k.toLowerCase().trim() === key.toLowerCase().trim()
        );
        if (foundKey) return row[foundKey];
    }
    return undefined;
};

try {
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`[DEBUG] Total Rows: ${jsonData.length}`);

    // Logic from route.ts
    // 4. Pre-process: Fill Down
    let lastModuleTitle = '';
    jsonData.forEach((row) => {
        const moduleKeys = ['Module Title', 'Bölüm Adı (Module)'];
        const currentTitle = getValue(row, moduleKeys);

        if (currentTitle && currentTitle.toString().trim()) {
            lastModuleTitle = currentTitle.toString().trim();
        }
        row['_moduleTitle'] = lastModuleTitle;
    });

    // A. Unique Modules
    const uniqueModuleTitles = Array.from(new Set(
        jsonData
            .map((row) => row['_moduleTitle'])
            .filter(Boolean)
    ));
    console.log(`[DEBUG] Unique Modules Found: ${uniqueModuleTitles.length}`);
    console.log('[DEBUG] First 3 Modules:', uniqueModuleTitles.slice(0, 3));

    // Simulate "Created Modules" (Mock DB return)
    const createdModules = uniqueModuleTitles.map((title, i) => ({
        id: `mod_${i}`,
        title: title
    }));

    // Grouping
    const rowsByModule = new Map();
    jsonData.forEach((row) => {
        const mTitle = row['_moduleTitle'];
        if (!mTitle) return;
        if (!rowsByModule.has(mTitle)) rowsByModule.set(mTitle, []);
        rowsByModule.get(mTitle).push(row);
    });

    console.log(`[DEBUG] keys in rowsByModule: ${rowsByModule.size}`);

    // C. Prepare Lessons
    const lessonsToInsert = [];

    for (const module of createdModules) {
        // Strict match check
        const rows = rowsByModule.get(module.title) || [];
        if (rows.length === 0) {
            console.log(`[WARN] No rows found for module: "${module.title}"`);
            continue;
        }

        rows.forEach((row, index) => {
            const lessonTitle = getValue(row, ['Lesson Title', 'Ders başlığı (Lesson)'])?.toString().trim();
            if (!lessonTitle) {
                // console.log(`[WARN] Row skipped, no lesson title. content:`, JSON.stringify(row));
                return;
            }

            lessonsToInsert.push({
                module: module.title,
                lesson: lessonTitle
            });
        });
    }

    console.log(`[DEBUG] Total Lessons Prepared: ${lessonsToInsert.length}`);
    if (lessonsToInsert.length > 0) {
        console.log('[DEBUG] First 3 Lessons:', lessonsToInsert.slice(0, 3));
    } else {
        console.log('[DEBUG] 0 LESSONS GENERATED! Checking sample row keys...');
        if (jsonData.length > 0) console.log(Object.keys(jsonData[0]));
    }

} catch (e) {
    console.error('Error:', e.message);
}

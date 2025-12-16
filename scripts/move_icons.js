
import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('icons');
const destDir = path.resolve('public/icons');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

if (fs.existsSync(srcDir)) {
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);
        if (fs.lstatSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile);
        }
    });
    console.log(`Moved ${files.length} icons to public/icons`);

    // Cleanup srcDir
    // fs.rmSync(srcDir, { recursive: true, force: true });
    console.log("Cleanup: You may delete the root 'icons' folder if verified.");
} else {
    console.log("No 'icons' folder found in root.");
}

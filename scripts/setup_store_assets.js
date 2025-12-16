
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');
const resourcesDir = path.resolve('resources');

if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir);
    console.log('Created resources directory');
}

// Copy Icon
// We need a 1024x1024 icon. using logo-icon.png
const iconSrc = path.join(publicDir, 'logo-icon.png');
const iconDest = path.join(resourcesDir, 'icon.png');

if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, iconDest);
    console.log('Copied icon.png');
} else {
    console.error('Source icon not found:', iconSrc);
}

// Copy Splash
// We need a 2732x2732 splash. using logo-full.png
// It might not be perfect size but the tool handles scaling usually or warns.
const splashSrc = path.join(publicDir, 'logo-full.png');
const splashDest = path.join(resourcesDir, 'splash.png');

if (fs.existsSync(splashSrc)) {
    fs.copyFileSync(splashSrc, splashDest);
    console.log('Copied splash.png');
} else {
    console.error('Source splash not found:', splashSrc);
}

// We also need separate splash screens for dark mode if desired, but let's start with basic.

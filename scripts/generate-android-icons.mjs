import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '..', 'public', 'icons', 'icon.svg');
const androidResDir = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const svgBuffer = readFileSync(svgPath);

// Android mipmap sizes
const mipmapSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground size for adaptive icons (with padding)
const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function generateIcons() {
  // Generate regular icons
  for (const [folder, size] of Object.entries(mipmapSizes)) {
    const outputDir = join(androidResDir, folder);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // ic_launcher.png - regular icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, 'ic_launcher.png'));

    // ic_launcher_round.png - round icon
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, 'ic_launcher_round.png'));

    console.log(`Generated ${folder}/ic_launcher.png (${size}x${size})`);
  }

  // Generate foreground icons for adaptive icons
  for (const [folder, size] of Object.entries(foregroundSizes)) {
    const outputDir = join(androidResDir, folder);

    // ic_launcher_foreground.png - foreground for adaptive icon
    // The icon should be centered in a larger canvas
    const iconSize = Math.round(size * 0.6); // Icon is 60% of the total size
    const padding = Math.round((size - iconSize) / 2);

    await sharp(svgBuffer)
      .resize(iconSize, iconSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(join(outputDir, 'ic_launcher_foreground.png'));

    console.log(`Generated ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  console.log('\nAll Android icons generated successfully!');
}

generateIcons().catch(console.error);

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

const svgPath = join(iconsDir, 'icon.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Apple touch icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);

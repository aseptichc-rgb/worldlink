import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

// 아이콘 사이즈들
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG 원본 (그라데이션이 있는 NEXUS 로고)
const createSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0D1117"/>
      <stop offset="100%" style="stop-color:#161B22"/>
    </linearGradient>
    <linearGradient id="text" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00E5FF"/>
      <stop offset="100%" style="stop-color:#7C4DFF"/>
    </linearGradient>
  </defs>

  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>

  <!-- Decorative nodes -->
  <circle cx="${size * 0.2}" cy="${size * 0.25}" r="${size * 0.02}" fill="#00E5FF" opacity="0.4"/>
  <circle cx="${size * 0.8}" cy="${size * 0.2}" r="${size * 0.015}" fill="#7C4DFF" opacity="0.4"/>
  <circle cx="${size * 0.85}" cy="${size * 0.75}" r="${size * 0.025}" fill="#00E5FF" opacity="0.4"/>
  <circle cx="${size * 0.15}" cy="${size * 0.8}" r="${size * 0.018}" fill="#7C4DFF" opacity="0.4"/>

  <!-- Connection lines -->
  <line x1="${size * 0.2}" y1="${size * 0.25}" x2="${size * 0.5}" y2="${size * 0.5}" stroke="#00E5FF" stroke-width="1" opacity="0.15"/>
  <line x1="${size * 0.8}" y1="${size * 0.2}" x2="${size * 0.5}" y2="${size * 0.5}" stroke="#7C4DFF" stroke-width="1" opacity="0.15"/>
  <line x1="${size * 0.85}" y1="${size * 0.75}" x2="${size * 0.5}" y2="${size * 0.5}" stroke="#00E5FF" stroke-width="1" opacity="0.15"/>
  <line x1="${size * 0.15}" y1="${size * 0.8}" x2="${size * 0.5}" y2="${size * 0.5}" stroke="#7C4DFF" stroke-width="1" opacity="0.15"/>

  <!-- Main "N" letter -->
  <text
    x="${size * 0.5}"
    y="${size * 0.58}"
    font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    font-size="${size * 0.5}"
    font-weight="700"
    fill="url(#text)"
    text-anchor="middle"
    dominant-baseline="middle">N</text>

  <!-- Subtle glow ring -->
  <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.35}" fill="none" stroke="url(#text)" stroke-width="1.5" opacity="0.1"/>
</svg>
`;

async function generateIcons() {
  console.log('🎨 PWA 아이콘 생성 시작...\n');

  // icons 디렉토리 생성
  await mkdir(iconsDir, { recursive: true });

  // 각 사이즈별 아이콘 생성
  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`✅ icon-${size}x${size}.png`);
  }

  // Apple Touch Icon (180x180)
  const appleSvg = createSvg(180);
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png (180x180)');

  // Favicon (32x32) - ICO 대신 PNG 사용
  const faviconSvg = createSvg(32);
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('✅ favicon.png (32x32)');

  // 큰 파비콘 (192x192 복사)
  const favicon192 = createSvg(192);
  await sharp(Buffer.from(favicon192))
    .png()
    .toFile(join(publicDir, 'favicon-192.png'));
  console.log('✅ favicon-192.png');

  console.log('\n🎉 모든 아이콘 생성 완료!');
  console.log(`📁 저장 위치: ${iconsDir}`);
}

generateIcons().catch(console.error);

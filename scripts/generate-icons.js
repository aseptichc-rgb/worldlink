/**
 * PWA 아이콘 생성 스크립트
 *
 * 사용법:
 * 1. sharp 패키지 설치: npm install sharp --save-dev
 * 2. 실행: node scripts/generate-icons.js
 *
 * 또는 온라인 도구 사용:
 * - https://www.pwabuilder.com/imageGenerator
 * - https://realfavicongenerator.net/
 *
 * 512x512 PNG 원본 이미지를 업로드하면 모든 사이즈 자동 생성
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log(`
===================================
PWA 아이콘 생성 가이드
===================================

아이콘 파일이 필요합니다. 다음 방법 중 하나를 선택하세요:

방법 1: 온라인 도구 사용 (추천)
-------------------------------
1. https://www.pwabuilder.com/imageGenerator 접속
2. 512x512 PNG 이미지 업로드
3. 생성된 아이콘들을 public/icons/ 폴더에 저장

방법 2: 수동 생성
-----------------
다음 사이즈의 PNG 파일을 만들어 public/icons/에 저장:
${sizes.map(s => `- icon-${s}x${s}.png`).join('\n')}

방법 3: sharp 패키지 사용
-------------------------
1. npm install sharp --save-dev
2. public/icons/에 icon-512x512.png 원본 파일 배치
3. 이 스크립트의 주석을 해제하고 실행

필요한 파일 목록:
${sizes.map(s => `public/icons/icon-${s}x${s}.png`).join('\n')}
public/apple-touch-icon.png (180x180)
public/favicon.ico

===================================
`);

// sharp 패키지가 설치된 경우 아래 주석 해제
/*
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, '../public/icons/icon-512x512.png');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  if (!fs.existsSync(inputFile)) {
    console.error('원본 파일이 없습니다:', inputFile);
    process.exit(1);
  }

  for (const size of sizes) {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`생성됨: icon-${size}x${size}.png`);
  }

  // Apple Touch Icon
  await sharp(inputFile)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  console.log('생성됨: apple-touch-icon.png');

  console.log('\\n모든 아이콘이 생성되었습니다!');
}

generateIcons().catch(console.error);
*/

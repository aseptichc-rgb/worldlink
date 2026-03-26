import { execFileSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Node.js child_process를 통해 RSS를 가져옴.
 * 임시 스크립트 파일을 사용하여 한글 인코딩 문제 해결.
 */
export function fetchRSSNative(url: string, timeoutMs: number = 8000): Promise<string> {
  return new Promise((resolve) => {
    const tmpFile = join(tmpdir(), `rss-fetch-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
    try {
      const script = `
import https from 'https';
const u = new URL(${JSON.stringify(url)});
const req = https.request({
  hostname: u.hostname, port: 443,
  path: u.pathname + u.search, method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  },
  timeout: ${timeoutMs},
}, (res) => {
  if (res.statusCode !== 200) { process.exit(0); }
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => process.stdout.write(Buffer.concat(chunks)));
});
req.on('error', () => process.exit(0));
req.on('timeout', () => { req.destroy(); process.exit(0); });
req.end();
`;
      writeFileSync(tmpFile, script, 'utf-8');

      const result = execFileSync('node', [tmpFile], {
        timeout: timeoutMs + 3000,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      resolve(result || '');
    } catch {
      resolve('');
    } finally {
      try { unlinkSync(tmpFile); } catch {}
    }
  });
}

/**
 * native fetch를 사용해 RSS를 가져옴.
 * Node.js 18+ 내장 fetch + AbortController로 child_process 오버헤드 제거.
 */
export async function fetchRSSNative(url: string, timeoutMs: number = 5000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

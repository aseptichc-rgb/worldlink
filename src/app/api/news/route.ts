import { NextRequest, NextResponse } from 'next/server';
import { fetchRSSNative } from '@/lib/rss-fetcher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source?: string;
  searchQuery: string;
  memberName?: string;
  memberCompany?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function generateNewsId(link: string, pubDate: string): string {
  const input = link + pubDate;
  return Buffer.from(input).toString('base64').slice(-48);
}

function extractRealUrl(bingUrl: string): string {
  // Bing RSS returns URLs like: https://www.bing.com/news/apiclick.aspx?...&url=https%3a%2f%2f...
  // RSS XML encodes & as &amp;, so decode HTML entities first
  if (bingUrl.includes('bing.com/news/apiclick')) {
    const decoded = bingUrl
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    try {
      const urlObj = new URL(decoded);
      const realUrl = urlObj.searchParams.get('url');
      if (realUrl) {
        return decodeURIComponent(realUrl);
      }
    } catch {
      // If URL parsing fails, try regex extraction
      const match = decoded.match(/[?&]url=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
    }
  }
  return bingUrl;
}

function parseBingNewsRSS(xml: string, query: string, memberName?: string, memberCompany?: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<News:Source>([\s\S]*?)<\/News:Source>/);

    if (titleMatch && linkMatch) {
      const title = stripHtml(titleMatch[1]);
      const rawLink = linkMatch[1].trim();
      const link = extractRealUrl(rawLink);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

      items.push({
        id: generateNewsId(link, pubDate),
        title,
        link,
        description: descMatch ? stripHtml(descMatch[1]) : '',
        pubDate,
        source: sourceMatch ? stripHtml(sourceMatch[1]).replace(/ on MSN$/, '') : undefined,
        searchQuery: query,
        memberName,
        memberCompany,
      });
    }
  }

  return items;
}

function filterByExactMention(items: NewsItem[], memberName?: string, memberCompany?: string): NewsItem[] {
  if (!memberName && !memberCompany) return items;

  return items.filter(item => {
    const text = `${item.title} ${item.description}`;

    const hasName = memberName ? text.includes(memberName) : false;
    const hasCompany = memberCompany
      ? text.includes(memberCompany) || text.includes(memberCompany.split(/\s+/)[0])
      : false;

    // 이름 또는 소속 중 하나라도 일치하면 통과
    if (memberName && memberCompany) return hasName || hasCompany;
    if (memberName) return hasName;
    if (memberCompany) return hasCompany;
    return true;
  });
}

async function searchSingleQuery(
  query: string,
  memberName?: string,
  memberCompany?: string,
): Promise<NewsItem[]> {
  const rssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&mkt=ko-KR`;

  try {
    const xml = await fetchRSSNative(rssUrl, 8000);
    if (!xml) return [];

    const parsed = parseBingNewsRSS(xml, query, memberName, memberCompany);
    const items = filterByExactMention(parsed, memberName, memberCompany);
    if (items.length > 0) {
      console.log(`[News] "${query}" -> ${parsed.length} parsed, ${items.length} matched`);
    }
    return items;
  } catch {
    return [];
  }
}

const BATCH_SIZE = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { members, timeRange } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: '멤버 정보가 필요합니다' }, { status: 400 });
    }

    const range = timeRange || '1d';
    const rangeMs = parseTimeRange(range);
    const cutoffTime = new Date(Date.now() - rangeMs);

    // 멤버당 1개 쿼리 (이름 + 회사 핵심어)
    const searchedQueries = new Set<string>();
    const queryTasks: { query: string; name?: string; company?: string }[] = [];

    for (const member of members) {
      const { name, company } = member;
      if (!name) continue;

      let query: string;
      if (company) {
        const companyShort = company.split(/\s+/)[0];
        query = `${name} ${companyShort}`;
      } else {
        query = name;
      }

      if (!searchedQueries.has(query)) {
        searchedQueries.add(query);
        queryTasks.push({ query, name, company });
      }
    }

    console.log(`[News API] ${queryTasks.length} queries, range=${range}`);

    const allNews: NewsItem[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < queryTasks.length; i += BATCH_SIZE) {
      const batch = queryTasks.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(task =>
          searchSingleQuery(task.query, task.name, task.company)
        )
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          for (const item of result.value) {
            const itemDate = new Date(item.pubDate);
            if (itemDate >= cutoffTime && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              allNews.push(item);
            }
          }
        }
      }

      if (i + BATCH_SIZE < queryTasks.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`[News API] Done: ${allNews.length} news items found`);

    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // 동일 소속(memberCompany)당 가장 최신 기사 하나만 유지
    const seenCompanies = new Set<string>();
    const deduped = allNews.filter(item => {
      if (!item.memberCompany) return true;
      if (seenCompanies.has(item.memberCompany)) return false;
      seenCompanies.add(item.memberCompany);
      return true;
    });

    return NextResponse.json({
      success: true,
      news: deduped.slice(0, 500),
      totalCount: Math.min(deduped.length, 500),
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('News search error:', error);
    return NextResponse.json(
      { error: '뉴스 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

function parseTimeRange(range: string): number {
  const match = range.match(/^(\d+)([hdm])$/);
  if (!match) return 24 * 60 * 60 * 1000;

  const value = parseInt(match[1]);
  switch (match[2]) {
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'm': return value * 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

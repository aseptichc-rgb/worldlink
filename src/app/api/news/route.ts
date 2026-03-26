import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

// HTML 태그 및 특수문자 제거
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

// 뉴스 ID 생성 (중복 체크용)
function generateNewsId(link: string, pubDate: string): string {
  return Buffer.from(link + pubDate).toString('base64').slice(0, 32);
}

// Google News RSS XML 파싱
function parseGoogleNewsRSS(xml: string, query: string, memberName?: string, memberCompany?: string): NewsItem[] {
  const items: NewsItem[] = [];

  // <item> 태그 추출
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    // 각 필드 추출
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

    if (titleMatch && linkMatch) {
      const title = stripHtml(titleMatch[1]);
      const link = linkMatch[1].trim();
      const description = descMatch ? stripHtml(descMatch[1]) : '';
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      const source = sourceMatch ? stripHtml(sourceMatch[1]) : undefined;

      const id = generateNewsId(link, pubDate);

      items.push({
        id,
        title,
        link,
        description,
        pubDate,
        source,
        searchQuery: query,
        memberName,
        memberCompany,
      });
    }
  }

  return items;
}

export async function POST(request: NextRequest) {
  try {
    const { members } = await request.json();

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: '멤버 정보가 필요합니다' }, { status: 400 });
    }

    const allNews: NewsItem[] = [];
    const searchedQueries = new Set<string>();
    const seenIds = new Set<string>();

    // 각 멤버의 이름과 소속으로 검색
    for (const member of members) {
      const { name, company } = member;

      if (!name) continue;

      // 검색 쿼리 생성
      const queries: string[] = [];

      if (company) {
        // 이름 + 소속 조합
        queries.push(`${name} ${company}`);
      }
      // 이름만
      queries.push(name);

      for (const query of queries) {
        // 이미 검색한 쿼리 스킵
        if (searchedQueries.has(query)) continue;
        searchedQueries.add(query);

        try {
          // Google News RSS 피드 URL (한국어 설정)
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;

          const response = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          });

          if (!response.ok) {
            console.error(`Google News RSS error for query "${query}":`, response.status);
            continue;
          }

          const xml = await response.text();
          const newsItems = parseGoogleNewsRSS(xml, query, name, company);

          // 중복 제거하며 추가
          for (const item of newsItems) {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              allNews.push(item);
            }
          }

          // API 호출 간격 조절
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          console.error(`Error searching for "${query}":`, err);
        }
      }
    }

    // 최신순 정렬
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    // 최대 50개로 제한
    const limitedNews = allNews.slice(0, 50);

    return NextResponse.json({
      success: true,
      news: limitedNews,
      totalCount: limitedNews.length,
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

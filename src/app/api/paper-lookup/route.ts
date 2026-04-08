import { NextRequest, NextResponse } from 'next/server';

interface CrossRefAuthor {
  given?: string;
  family?: string;
  name?: string;
  affiliation?: { name: string }[];
}

interface CrossRefWork {
  title?: string[];
  author?: CrossRefAuthor[];
  'container-title'?: string[];
  published?: { 'date-parts'?: number[][] };
  'published-print'?: { 'date-parts'?: number[][] };
  'published-online'?: { 'date-parts'?: number[][] };
  abstract?: string;
  DOI?: string;
  volume?: string;
  issue?: string;
  page?: string;
  'is-referenced-by-count'?: number;
  type?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { doi } = await request.json();

    if (!doi) {
      return NextResponse.json({ success: false, error: 'DOI가 필요합니다.' }, { status: 400 });
    }

    // Clean DOI
    const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//, '').trim();

    // Fetch from CrossRef API
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`, {
      headers: {
        'User-Agent': 'ResearchNexus/1.0 (mailto:contact@researchnexus.app)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: false, error: '해당 DOI의 논문을 찾을 수 없습니다.' }, { status: 404 });
      }
      return NextResponse.json({ success: false, error: 'CrossRef API 오류가 발생했습니다.' }, { status: 500 });
    }

    const data = await response.json();
    const work: CrossRefWork = data.message;

    // Extract publication date
    const dateParts = work.published?.['date-parts']?.[0]
      || work['published-print']?.['date-parts']?.[0]
      || work['published-online']?.['date-parts']?.[0];

    const year = dateParts?.[0] || new Date().getFullYear();
    const month = dateParts?.[1];

    // Extract authors
    const authors = (work.author || []).map((a: CrossRefAuthor) => ({
      name: a.name || [a.given, a.family].filter(Boolean).join(' '),
      affiliation: a.affiliation?.[0]?.name,
    }));

    // Clean abstract (remove HTML tags)
    const abstract = work.abstract
      ? work.abstract.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      : undefined;

    const paper = {
      title: work.title?.[0] || '',
      authors,
      abstract,
      journal: work['container-title']?.[0],
      year,
      month,
      doi: work.DOI || cleanDoi,
      volume: work.volume,
      issue: work.issue,
      pages: work.page,
      citationCount: work['is-referenced-by-count'] || 0,
      type: work.type,
    };

    return NextResponse.json({ success: true, data: paper });
  } catch (error) {
    console.error('Paper lookup error:', error);
    return NextResponse.json({ success: false, error: '논문 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

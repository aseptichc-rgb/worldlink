import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuthToken } from '@/lib/firebase-admin';

interface MemberInput {
  id: string;
  name: string;
  company: string;
  position: string;
  bio: string;
  keywords: string[];
  category: string;
}

export async function POST(req: NextRequest) {
  const uid = await verifyAuthToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { query, members } = await req.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }
    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'members data is required' }, { status: 400 });
    }

    const membersContext = (members as MemberInput[]).map(m =>
      `[${m.id}] ${m.name} | ${m.company} | ${m.position} | ${m.bio} | 키워드: ${m.keywords.join(', ')} | 분야: ${m.category}`
    ).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `당신은 인맥 네트워크에서 최적의 인물을 추천하는 전문 AI 어시스턴트입니다.

아래는 네트워크에 등록된 멤버 목록입니다. 각 멤버의 이름, 소속, 직책, 소개, 전문 키워드, 분야 정보를 포함합니다:

${membersContext}

사용자의 요청: "${query}"

**핵심 지시사항:**
1. 사용자의 요청 의도를 깊이 파악하세요. 예를 들어 "의료 특허"라고 검색하면 특허 전문가(변리사), 지식재산권 변호사, 의료기기 관련 연구자 등을 추론하여 추천해야 합니다.
2. 직접적으로 키워드가 일치하지 않더라도, 맥락상 관련된 전문가를 폭넓게 추천하세요.
3. 각 추천 인물에 대해 관련성 점수(0~100)를 부여하고, 점수가 높은 순서대로 정렬하세요.

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 순수 JSON만):
{
  "summary": "추천 요약 설명 (2-3문장, 한국어, 사용자의 요청을 어떻게 해석했는지와 왜 이 사람들을 추천하는지 설명)",
  "results": [
    {
      "memberId": "member_X",
      "relevanceScore": 95,
      "reason": "이 사람을 추천하는 구체적인 이유 (2-3문장, 한국어, 사용자의 요청과 이 멤버의 전문성이 어떻게 연결되는지 명확히 설명)",
      "traits": ["핵심 전문성 1", "핵심 전문성 2", "핵심 전문성 3"]
    }
  ]
}

규칙:
- memberId는 반드시 위 목록에 존재하는 ID만 사용하세요
- relevanceScore는 사용자의 요청과의 관련성을 0~100으로 평가하세요 (100이 가장 관련성 높음)
- reason은 "이 분은 ~이기 때문에 ~에 도움을 줄 수 있습니다" 형식으로, 사용자의 요청과 연결 지어 구체적으로 작성하세요
- traits는 해당 멤버가 사용자의 요청과 관련하여 보유한 핵심 역량이나 전문 분야를 2~4개 키워드로 추출하세요
- 요청과 관련 없는 사람은 절대 추천하지 마세요
- relevanceScore가 높은 순서대로 정렬하세요
- 최소 1명, 최대 5명까지 추천하세요`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // relevanceScore 기준 내림차순 정렬
    const sortedResults = (parsed.results || [])
      .map((r: { memberId: string; relevanceScore?: number; reason: string; traits?: string[] }) => ({
        memberId: r.memberId,
        relevanceScore: r.relevanceScore ?? 50,
        reason: r.reason,
        traits: r.traits || [],
      }))
      .sort((a: { relevanceScore: number }, b: { relevanceScore: number }) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      summary: parsed.summary || '',
      results: sortedResults,
    });
  } catch (err) {
    console.error('AI Search error:', err);
    return NextResponse.json({ error: 'AI search failed' }, { status: 500 });
  }
}

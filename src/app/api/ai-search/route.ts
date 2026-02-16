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

위 멤버 목록을 종합적으로 분석하여, 사용자의 요청에 가장 적합한 사람을 1~5명 추천해주세요.
각 멤버의 소개(bio), 키워드, 분야, 직책을 깊이 분석하여 추천 이유를 구체적으로 작성해주세요.

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 순수 JSON만):
{
  "summary": "추천 요약 설명 (2-3문장, 한국어, 왜 이 사람들을 추천하는지 맥락 설명)",
  "results": [
    {
      "memberId": "member_X",
      "reason": "이 사람을 추천하는 구체적인 이유 (2-3문장, 한국어, 해당 멤버의 전문성과 경험을 바탕으로 작성)",
      "traits": ["핵심 전문성 1", "핵심 전문성 2", "핵심 전문성 3"]
    }
  ]
}

규칙:
- memberId는 반드시 위 목록에 존재하는 ID만 사용하세요
- reason은 해당 멤버의 전문성, 경력, 소속 기관의 특성을 바탕으로 사용자의 요청에 왜 적합한지 구체적으로 설명하세요
- traits는 해당 멤버가 사용자의 요청과 관련하여 보유한 핵심 역량이나 전문 분야를 2~4개 키워드로 추출하세요
- 요청과 관련 없는 사람은 절대 추천하지 마세요
- 가장 적합한 순서대로 정렬하세요`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      summary: parsed.summary || '',
      results: (parsed.results || []).map((r: { memberId: string; reason: string; traits?: string[] }) => ({
        memberId: r.memberId,
        reason: r.reason,
        traits: r.traits || [],
      })),
    });
  } catch (err) {
    console.error('AI Search error:', err);
    return NextResponse.json({ error: 'AI search failed' }, { status: 500 });
  }
}

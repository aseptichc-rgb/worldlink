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
  // 개발 환경에서는 인증을 선택적으로 처리 (Firebase Admin 설정이 없을 수 있음)
  const hasAdminConfig = process.env.FIREBASE_ADMIN_PROJECT_ID &&
                         process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
                         process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (hasAdminConfig) {
    const uid = await verifyAuthToken(req);
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

1. **한국어 복합어를 정확히 이해하세요:**
   - "국회의원"은 국회(National Assembly) + 의원(member)으로, 정치인을 의미합니다. 병원/의원(clinic)과는 완전히 다른 뜻입니다.
   - "의원"이 단독으로 쓰이면 병원(clinic)일 수 있지만, "국회의원"은 하나의 단어로 정치인을 뜻합니다.
   - 복합어를 임의로 분해하여 다른 의미로 해석하지 마세요.

2. **사용자의 요청 의도를 정확히 파악하세요:**
   - 요청의 전체 맥락을 이해하고, 그 의도에 부합하는 사람만 추천하세요.
   - 예: "의료 특허" → 특허 전문가(변리사), 지식재산권 변호사 추천
   - 예: "국회의원 인맥" → 정치인, 정책 관련 전문가 추천 (병원 의원장 추천 X)

3. **관련 인물이 없으면 솔직하게 말하세요:**
   - 네트워크에 요청에 맞는 사람이 없으면, results를 빈 배열 []로 반환하세요.
   - 억지로 관련 없는 사람을 추천하지 마세요. 관련성이 낮은 사람을 추천하는 것보다 없다고 알려주는 것이 더 좋습니다.

4. 각 추천 인물에 대해 관련성 점수(0~100)를 엄격하게 부여하고, 점수가 높은 순서대로 정렬하세요.

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 순수 JSON만):
{
  "summary": "추천 요약 설명 (2-3문장, 한국어. 적합한 인물이 있으면 왜 추천하는지, 없으면 왜 없는지 설명)",
  "results": [
    {
      "memberId": "위 목록에서 대괄호 안의 실제 ID (예: demo_1, demo_24 등)",
      "relevanceScore": 95,
      "reason": "이 사람을 추천하는 구체적인 이유 (2-3문장, 한국어, 사용자의 요청과 이 멤버의 전문성이 어떻게 연결되는지 명확히 설명)",
      "traits": ["핵심 전문성 1", "핵심 전문성 2", "핵심 전문성 3"]
    }
  ]
}

규칙:
- memberId는 반드시 위 목록에 존재하는 ID만 사용하세요
- relevanceScore는 사용자의 요청과의 관련성을 0~100으로 엄격하게 평가하세요 (직접적으로 관련된 전문가만 70점 이상)
- reason은 "이 분은 ~이기 때문에 ~에 도움을 줄 수 있습니다" 형식으로, 사용자의 요청과 연결 지어 구체적으로 작성하세요
- traits는 해당 멤버가 사용자의 요청과 관련하여 보유한 핵심 역량이나 전문 분야를 2~4개 키워드로 추출하세요
- **요청과 관련 없는 사람은 절대 추천하지 마세요. 단어가 비슷해 보여도 의미가 다르면 추천하면 안 됩니다.**
- relevanceScore가 높은 순서대로 정렬하세요
- 적합한 인물이 있으면 최대 5명까지, 없으면 빈 배열을 반환하세요`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // relevanceScore 기준 내림차순 정렬 + 낮은 점수 필터링
    const MIN_RELEVANCE_SCORE = 40;
    const sortedResults = (parsed.results || [])
      .map((r: { memberId: string; relevanceScore?: number; reason: string; traits?: string[] }) => ({
        memberId: r.memberId,
        relevanceScore: r.relevanceScore ?? 0,
        reason: r.reason,
        traits: r.traits || [],
      }))
      .filter((r: { relevanceScore: number }) => r.relevanceScore >= MIN_RELEVANCE_SCORE)
      .sort((a: { relevanceScore: number }, b: { relevanceScore: number }) => b.relevanceScore - a.relevanceScore);

    return NextResponse.json({
      summary: parsed.summary || '',
      results: sortedResults,
    });
  } catch (err) {
    const error = err as Error;
    console.error('AI Search error:', error.message, error.stack);
    return NextResponse.json({
      error: 'AI search failed',
      details: error.message
    }, { status: 500 });
  }
}

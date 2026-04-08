import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuthToken } from '@/lib/firebase-admin';

interface MemberInput {
  id: string;
  name: string;
  institution: string;
  position: string;
  researchInterests: string[];
  researchField: string;
}

export async function POST(req: NextRequest) {
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
    const { members } = await req.json();
    if (!members || !Array.isArray(members) || members.length < 4) {
      return NextResponse.json({ error: 'At least 4 members required' }, { status: 400 });
    }

    const membersContext = (members as MemberInput[]).map(m =>
      `[${m.id}] ${m.name} | ${m.institution} | ${m.position} | 연구관심사: ${m.researchInterests.join(', ')} | 분야: ${m.researchField}`
    ).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `당신은 비즈니스 네트워킹 전문 AI입니다. 아래 인맥 목록에서 서로 소개하면 시너지가 날 2인 쌍을 최대 3쌍 추천하세요.

멤버 목록:
${membersContext}

추천 기준:
1. 서로 다른 분야이지만 협업이 가능한 관계 (예: 스타트업 + 투자자, 연구자 + 변리사)
2. 키워드와 전문성이 상호 보완적인 관계
3. 실제로 소개받으면 양쪽 모두에게 이익이 되는 조합

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이 순수 JSON만):
{
  "matches": [
    {
      "person1Id": "멤버ID1",
      "person2Id": "멤버ID2",
      "reason": "소개 추천 이유 (2문장, 한국어)",
      "benefit": "양쪽에게 기대되는 이점 (짧은 구절)"
    }
  ]
}

규칙:
- person1Id, person2Id는 반드시 위 목록의 대괄호 안 ID만 사용
- 같은 사람이 중복으로 등장하지 않도록 (한 사람은 최대 1쌍에만)
- 최대 3쌍, 최소 1쌍 추천`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      matches: parsed.matches || [],
    });
  } catch (err) {
    const error = err as Error;
    console.error('AI Match error:', error.message);
    return NextResponse.json({ error: 'AI match failed', details: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const { ocrText } = await req.json();
    if (!ocrText || typeof ocrText !== 'string') {
      return NextResponse.json({ error: 'ocrText is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `다음은 명함에서 OCR로 추출한 텍스트입니다. 이 텍스트에서 아래 정보를 분류해주세요.

OCR 텍스트:
${ocrText}

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "name": "이름",
  "company": "회사명",
  "position": "직책",
  "phone": "전화번호",
  "email": "이메일"
}

규칙:
- 찾을 수 없는 항목은 빈 문자열("")로 남겨주세요
- 전화번호는 숫자와 하이픈으로 정리해주세요 (예: 010-1234-5678)
- OCR 오류로 깨진 글자가 있을 수 있으니 문맥을 고려해 보정해주세요`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      name: parsed.name || '',
      company: parsed.company || '',
      position: parsed.position || '',
      phone: parsed.phone || '',
      email: parsed.email || '',
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return NextResponse.json({ error: 'Failed to parse business card' }, { status: 500 });
  }
}

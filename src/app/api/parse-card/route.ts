import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyAuthToken } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  // Verify authenticated user
  const uid = await verifyAuthToken(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { imageBase64, ocrText } = body;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // 이미지가 있으면 Vision API 사용 (더 정확)
    if (imageBase64) {
      // Extract MIME type from data URI before stripping prefix
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `이 명함 이미지에서 다음 정보를 추출해주세요.

반드시 아래 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "name": "이름 (한글 또는 영문)",
  "company": "회사명",
  "position": "직책/직함",
  "phone": "전화번호",
  "email": "이메일 주소"
}

중요한 규칙:
1. 이름: 명함에서 가장 크게 표시된 한글 또는 영문 이름. 보통 2-4글자의 한글 이름이거나 영문 이름
2. 회사명: 로고 근처에 있거나 가장 눈에 띄는 회사/기관 이름
3. 직책: 대표, 이사, 팀장, Manager, CEO 등의 직함
4. 전화번호: 010-XXXX-XXXX 형식으로 정리. 여러 번호가 있으면 휴대폰 번호 우선
5. 이메일: @가 포함된 이메일 주소
6. 찾을 수 없는 항목은 빈 문자열("")로 남겨주세요
7. 명함의 텍스트가 흐리거나 작아도 최대한 추론해주세요`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();

      const jsonStr = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return NextResponse.json({
        name: parsed.name || '',
        institution: parsed.company || '',
        position: parsed.position || '',
        phone: formatPhoneNumber(parsed.phone || ''),
        email: parsed.email || '',
      });
    }

    // 이미지가 없으면 기존 OCR 텍스트 파싱 (폴백)
    if (!ocrText || typeof ocrText !== 'string') {
      return NextResponse.json({ error: 'imageBase64 or ocrText is required' }, { status: 400 });
    }

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
      institution: parsed.company || '',
      position: parsed.position || '',
      phone: formatPhoneNumber(parsed.phone || ''),
      email: parsed.email || '',
    });
  } catch (err) {
    console.error('Gemini API error:', err);
    return NextResponse.json({ error: 'Failed to parse business card' }, { status: 500 });
  }
}

// 전화번호 포맷팅 함수
function formatPhoneNumber(phone: string): string {
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');

  // 한국 휴대폰 번호 (010, 011 등)
  if (digits.startsWith('82')) {
    const localDigits = '0' + digits.slice(2);
    return formatKoreanPhone(localDigits);
  }

  return formatKoreanPhone(digits);
}

function formatKoreanPhone(digits: string): string {
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('02')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return digits;
}

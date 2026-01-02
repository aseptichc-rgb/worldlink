import { Member, GraphNode, GraphLink, GraphData, getCategoryColor } from '@/types';

// 키워드 추출 함수
export function extractTags(description: string): string[] {
  const keywords = [
    'AI', '3D', '프린팅', '수액', '진단', '바이오', '제약', '투자',
    '법률', '소송', '특허', '의료기기', '디지털', '헬스케어', '플랫폼',
    '솔루션', '영상', '데이터', '클라우드', '웨어러블', '로봇', '수술',
    '치료', '암', '신경', '피부', '정신', '치과', '비뇨기', '호흡기',
    '심혈관', '이비인후과', '소화기', '안과', '여성', '소아', '노인',
    '원격', '모니터링', '분석', '연구', 'VC', '펀드', '컨설팅',
    '병원', '제조', '수입', '유통', '개발', '스타트업', '글로벌'
  ];

  const found: string[] = [];
  const lowerDesc = description.toLowerCase();

  for (const keyword of keywords) {
    if (lowerDesc.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  }

  return found.slice(0, 5); // 최대 5개
}

// CSV 데이터를 Member 배열로 변환
export function parseCsvToMembers(csvData: string): Member[] {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');

  const members: Member[] = [];

  for (let i = 1; i < lines.length; i++) {
    // CSV 파싱 (쉼표 처리 고려)
    const values = parseCSVLine(lines[i]);

    if (values.length >= 7) {
      const description = values[5] || '';
      members.push({
        id: `member_${i}`,
        name: values[0]?.trim() || '',
        company: values[1]?.trim() || '',
        role: values[2]?.trim() || '',
        phone: values[3]?.trim() || '',
        email: values[4]?.trim() || '',
        description: description.trim(),
        category: values[6]?.trim() || '기타',
        tags: extractTags(description),
        photoUrl: `/faces/face_${i}.jpg`,
      });
    }
  }

  return members;
}

// CSV 라인 파싱 (쉼표가 포함된 필드 처리)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// 직급 기반 노드 크기 계산
function getNodeSize(role: string): number {
  if (role.includes('대표') || role.includes('이사장') || role.includes('원장') || role.includes('병원장')) {
    return 12;
  }
  if (role.includes('부사장') || role.includes('본부장') || role.includes('처장') || role.includes('실장')) {
    return 10;
  }
  if (role.includes('이사') || role.includes('전무') || role.includes('상무')) {
    return 9;
  }
  if (role.includes('교수') || role.includes('과장')) {
    return 8;
  }
  return 7;
}

// Member 배열을 그래프 데이터로 변환
export function membersToGraphData(members: Member[]): GraphData {
  const nodes: GraphNode[] = members.map(member => ({
    id: member.id,
    name: member.name,
    company: member.company,
    role: member.role,
    category: member.category,
    photoUrl: member.photoUrl,
    val: getNodeSize(member.role),
    color: getCategoryColor(member.category),
    member,
  }));

  const links: GraphLink[] = [];

  // 같은 카테고리 연결 (강한 연결)
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const cat1 = members[i].category;
      const cat2 = members[j].category;

      // 같은 카테고리거나 카테고리가 겹치는 경우
      if (cat1 === cat2 || cat1.includes(cat2.split('/')[0]) || cat2.includes(cat1.split('/')[0])) {
        links.push({
          source: members[i].id,
          target: members[j].id,
          type: 'category',
          strength: 0.3,
        });
      }
    }
  }

  // 키워드 공유 연결 (약한 연결)
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const sharedTags = members[i].tags.filter(tag =>
        members[j].tags.includes(tag)
      );

      if (sharedTags.length > 0 && members[i].category !== members[j].category) {
        links.push({
          source: members[i].id,
          target: members[j].id,
          type: 'keyword',
          strength: 0.1 * sharedTags.length,
        });
      }
    }
  }

  return { nodes, links };
}

// 카테고리 목록 추출
export function getCategories(members: Member[]): string[] {
  const categories = new Set<string>();
  members.forEach(m => {
    // 복합 카테고리 분리
    m.category.split('/').forEach(c => categories.add(c.trim()));
    categories.add(m.category);
  });
  return Array.from(categories).sort();
}

#!/bin/bash
# 데모 멤버 100명의 한국인 남녀 프로필 이미지 병렬 다운로드
FACES_DIR="/c/You are great/worldlink/public/faces"
BASE_URL="https://image.pollinations.ai/prompt"

download_male() {
  local id=$1
  local seed=$((id * 7 + 42))
  local prompt="korean%20man%20professional%20business%20headshot%20portrait%20photo%20clean%20background%20realistic%20high%20quality"
  curl -s -o "$FACES_DIR/demo_${id}.jpg" --max-time 30 "${BASE_URL}/${prompt}?width=400&height=400&seed=${seed}&nologo=true" 2>/dev/null && echo "OK M demo_${id}" || echo "FAIL M demo_${id}"
}

download_female() {
  local id=$1
  local seed=$((id * 7 + 2042))
  local prompt="korean%20woman%20professional%20business%20headshot%20portrait%20photo%20clean%20background%20realistic%20high%20quality"
  curl -s -o "$FACES_DIR/demo_${id}.jpg" --max-time 30 "${BASE_URL}/${prompt}?width=400&height=400&seed=${seed}&nologo=true" 2>/dev/null && echo "OK F demo_${id}" || echo "FAIL F demo_${id}"
}

echo "=== 한국인 프로필 이미지 다운로드 (100명) ==="

# 5개씩 병렬 배치로 다운로드
# 남성: 1 2 4 6 8 10 11 13 15 17 19 22 24 26 28 30 32 34 36 39 42 44 46 48 49 51 53 55 57 59 61 63 65 67 68 69 71 73 75 77 79 80 82 84 86 89 91 93 94 96 98
# 여성: 3 5 7 9 12 14 16 18 20 21 23 25 27 29 31 33 35 37 38 40 41 43 45 47 50 52 54 56 58 60 62 64 66 70 72 74 76 78 81 83 85 87 88 90 92 95 97 99 100

MALES=(1 2 4 6 8 10 11 13 15 17 19 22 24 26 28 30 32 34 36 39 42 44 46 48 49 51 53 55 57 59 61 63 65 67 68 69 71 73 75 77 79 80 82 84 86 89 91 93 94 96 98)
FEMALES=(3 5 7 9 12 14 16 18 20 21 23 25 27 29 31 33 35 37 38 40 41 43 45 47 50 52 54 56 58 60 62 64 66 70 72 74 76 78 81 83 85 87 88 90 92 95 97 99 100)

# 모든 ID를 성별과 함께 하나의 배열로
ALL_TASKS=()
for id in "${MALES[@]}"; do ALL_TASKS+=("M:$id"); done
for id in "${FEMALES[@]}"; do ALL_TASKS+=("F:$id"); done

total=${#ALL_TASKS[@]}
done_count=0
batch_size=5

for ((i=0; i<total; i+=batch_size)); do
  # 배치 시작
  for ((j=i; j<i+batch_size && j<total; j++)); do
    task="${ALL_TASKS[$j]}"
    gender="${task%%:*}"
    id="${task##*:}"
    if [ "$gender" = "M" ]; then
      download_male "$id" &
    else
      download_female "$id" &
    fi
  done
  wait
  done_count=$((done_count + batch_size))
  if [ $done_count -gt $total ]; then done_count=$total; fi
  echo "--- 진행: ${done_count}/${total} ---"
done

echo "=== 다운로드 완료 ==="

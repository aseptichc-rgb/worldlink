import fitz  # PyMuPDF
import cv2
import numpy as np
import os

def extract_faces_from_pdf(pdf_path, output_dir):
    # 출력 폴더 생성
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # OpenCV의 얼굴 인식용 Haar Cascade 분류기 로드
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # PDF 문서 열기
    doc = fitz.open(pdf_path)
    face_count = 0

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # 페이지를 고해상도 이미지로 변환 (확대 배율 3.0)
        pix = page.get_pixmap(matrix=fitz.Matrix(3.0, 3.0))
        img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
        
        # RGB인 경우 BGR로 변환 (OpenCV 사용 목적)
        if pix.n == 3:
            img = cv2.cvtColor(img_data, cv2.COLOR_RGB2BGR)
        else:
            img = cv2.cvtColor(img_data, cv2.COLOR_RGBA2BGR)

        # 얼굴 인식을 위해 그레이스케일로 변환
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 얼굴 감지
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))

        for (x, y, w, h) in faces:
            # 얼굴 영역 주위에 여백을 조금 주어 크롭
            margin = int(w * 0.2)
            y1 = max(0, y - margin)
            y2 = min(img.shape[0], y + h + margin)
            x1 = max(0, x - margin)
            x2 = min(img.shape[1], x + w + margin)
            
            face_img = img[y1:y2, x1:x2]
            
            # 파일 저장 (예: face_1.jpg)
            face_count += 1
            file_name = f"face_{face_count}.jpg"
            cv2.imwrite(os.path.join(output_dir, file_name), face_img)
            print(f"저장됨: {file_name} (페이지 {page_num + 1})")

    doc.close()
    print(f"총 {face_count}개의 얼굴 사진을 추출했습니다.")

# 실행
pdf_file = "헬스케어퓨처포럼_최고위과정_제2기_멤버명단.pdf" # 파일 경로 확인 필요
extract_faces_from_pdf(pdf_file, "extracted_faces")
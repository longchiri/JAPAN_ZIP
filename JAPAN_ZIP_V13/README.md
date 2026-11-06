# JAPAN ZIP V13

일본 47개 도도부현 여행·맛집 도감. 정적 사이트(GitHub Pages)이며, 유료 API나 API 키는 쓰지 않습니다.

## 폴더 구조
```
index.html                  앱 화면
data/places.js              선별 도감 1,129곳 (직접 수정해서 추가 가능)
data/osm/*.json             전국 음식점 DB (자동 생성, 직접 수정 X)
js/v13.js, css/v13.css      V13 기능 (장소 찾기 통합, 여행 도구, PWA)
sw.js, manifest.webmanifest 오프라인·앱 설치
scripts/build_osm.py        OSM 데이터 → 도도부현별 JSON 변환
.github/workflows/build-osm.yml  매월 자동 갱신
```

## 업로드할 때 주의
맥 Finder는 점(.)으로 시작하는 폴더를 숨깁니다. `.github` 폴더가 빠지지 않게 Finder에서 Cmd + Shift + . 로 숨김 파일을 보이게 한 뒤 올리세요.
`scripts/build_osm.py`도 꼭 있어야 합니다.

## 처음 한 번만 할 일
1. 이 폴더 내용을 저장소 루트에 그대로 올리기 (기존 index.html 교체)
2. 저장소 **Actions** 탭 → **Build OSM restaurant DB** → **Run workflow**
   - 20~40분 뒤 `data/osm/`에 전국 데이터가 커밋됩니다.
   - 권한 오류(403)가 나면: Settings → Actions → General → Workflow permissions → **Read and write** 선택
3. 그 다음부터는 매월 2일 자동으로 최신 데이터로 갱신됩니다.

GitHub Pages를 "Deploy from a branch"로 쓰면 데이터 커밋 후 자동 재배포됩니다.
별도 배포 워크플로를 쓰는 경우 Actions가 만든 커밋으로는 배포가 자동 실행되지 않으니, 배포 워크플로를 한 번 수동 실행하세요.

## 로컬에서 확인
`file://`로 열면 브라우저 보안 때문에 음식점 DB를 읽을 수 없습니다.
```
python3 -m http.server 8000   # 이 폴더에서 실행 후 http://localhost:8000
```

## 데이터 라이선스
전국 음식점 DB: © OpenStreetMap contributors, ODbL 1.0 (화면과 출처 페이지에 표기되어 있음, 지우지 마세요)

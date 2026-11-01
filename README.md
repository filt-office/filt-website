# FILT 웹사이트 게시본 (filt-website, 공개)

filt.kr(아임웹)이 실제로 불러오는 **게시본**입니다. 이 저장소는 사람이 직접 고치지 않습니다.
원본은 비공개 저장소 **filt-office/filt-website-editor**에 있고, 그쪽의 게시 워크플로가 이곳에 커밋합니다.
구조, 사용법, 에이전트 작업 규칙은 원본 저장소의 `README.md`와 `AGENTS.md`를 보세요.

## 저장소 관계

| 저장소 | 역할 |
|---|---|
| filt-office/filt-website-editor (비공개) | 원본: 빌더, 템플릿, 데이터, 원본 이미지, 게시 스크립트 |
| **filt-office/filt-website** (여기) | 게시본: 템플릿 JS·CSS, 공개용 JSON, `version.json`, 빌더 화면 사본(`builder/`) |
| [filt-office/filt-website-images](https://github.com/filt-office/filt-website-images) | 웹용으로 줄인 사진 (GitHub Pages) |
| filt-office/imweb | 옛 아임웹 코드 위젯 백업 (읽기 전용) |

## 무엇이 어떻게 쓰이나

```
아임웹 위젯 → loader.js@<고정 sha> → raw.githubusercontent.com/…/main/version.json (최대 5분 캐시)
           → jsDelivr @<version.json의 sha> 의 템플릿 JS·CSS + JSON → 사진은 filt-website-images에서
```

| 파일 | 내용 |
|---|---|
| `loader.js` | 아임웹 위젯이 부르는 진입점. `version.json`이 가리키는 게시본을 불러옴 |
| `project-template.js/.css` | 프로젝트 상세 페이지 (`/project?id=<id>`) |
| `works.js/.css` | WORKS 목록·갤러리 |
| `pages.js/.css` | HOME · OFFICE · NEWS |
| `common-menu-v2.js`, `home-button.js`, `design.js` | 공통 메뉴, 홈 버튼(모바일은 FILT 로고), 디자인 시스템 값 |
| `projects/<id>.json` | 게시된 상세 페이지 데이터 |
| `works.json`, `pages/*.json` | WORKS 목록, HOME·OFFICE·NEWS·디자인 데이터 |
| `version.json` | 지금 사이트에 나가는 게시본의 커밋 sha |
| `builder/` | 빌더 화면 사본 → https://filt-office.github.io/filt-website/builder/ (데이터는 원본 저장소에서 각자의 토큰으로 읽음) |

## 커밋 종류

- `release: <메모> (@누가)` + `publish <sha> · <메모>`: 빌더의 **게시**. 템플릿과 공개용 JSON을 복사하고 `version.json`을 그 커밋으로 옮김
- `rollback <sha> · 되돌리기`: 게시 기록에서 되돌림. `version.json`만 옮김
- `builder: deploy from editor@<sha>`: 빌더 화면 배포. `builder/`만 바뀌고 사이트에는 영향 없음

## 주의

- 아임웹 위젯은 `@main`을 가리키면 안 됩니다(jsDelivr가 브라우저에 7일 캐시). 고정된 sha의 `loader.js`를 쓰고, 그 로더가 `version.json`을 따라갑니다.
- 게시 후 사이트에 보이기까지 최대 5분 걸립니다.
- jsDelivr 150MB 제한 때문에 사진은 이 저장소가 아니라 filt-website-images에 있습니다.

# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)를 위한 가이드입니다.

## 프로젝트 개요

쿠버네티스 매니페스트(YAML) 작성을 돕는 단일 페이지 도구입니다. 오브젝트를 선택하면 속성이 트리로 나타나고, 각 필드의 필수/권장/선택 여부와 설명을 보여주며, 값을 입력하는 즉시 오른쪽에 완성된 YAML이 실시간으로 생성됩니다.

자세한 제품 요구사항은 `docs/PRD.md`를 참고하세요. 이 문서와 내용이 어긋나면 PRD.md가 우선합니다.

## 산출물 & 실행 방법

- 산출물은 프로젝트 루트의 `index.html`(마크업) / `style.css`(스타일) / `app.js`(로직) 3개 파일입니다. 빌드 도구, 패키지 매니저, 백엔드가 없습니다 — 3개 파일이 같은 디렉터리에 있으면 브라우저에서 `index.html`을 직접 열면 동작합니다(상대 경로 `<link>`/`<script src>`는 file:// 에서도 정상 로드됩니다).
- 로컬 확인: `open index.html` 또는 `python3 -m http.server 8934`로 서빙 후 `http://localhost:8934/index.html` 접속.
- 별도 빌드/린트/테스트 명령이 없습니다. 변경 후에는 반드시 브라우저(또는 Chrome 자동화 도구)로 직접 열어 동작을 확인하세요.
  - JS 문법만 빠르게 검사하려면: `node --check app.js`.
- 세 파일 중 하나만 수정해도 되는 경우가 대부분입니다 — 마크업/구조는 `index.html`, 색상·레이아웃 등 스타일은 `style.css`, 동작 로직은 전부 `app.js`에 있습니다.

## 아키텍처 (`app.js` 내부 구조)

`app.js` 안에서 아래 순서로 구성되어 있습니다.

1. **필드 트리 스키마 헬퍼** — `F(key, type, level, extra)`로 필드를 정의합니다.
   - `type`: `'string' | 'number' | 'boolean' | 'select' | 'map' | 'list-string' | 'group' | 'list-group'`
   - `level`: `'req'`(필수) | `'rec'`(권장) | `'opt'`(선택)
   - `extra`: `{ desc, placeholder, options, default, children }`
   - `metadataFields(opts)` — 공용 `metadata` 블록. cluster-scoped 오브젝트는 `{ noNamespace: true }` 전달.
   - `podSpecChildren()`, `containerListGroupChildren()`, `podTemplateField()`, `selectorField()`, `rbacRuleChildren()` — 여러 오브젝트가 공유하는 하위 필드 묶음.
2. **`OBJECTS`** — 오브젝트별 `{ label, desc, apiVersion, kind, clusterScoped, fields }` 정의. 키는 소문자(예: `persistentvolumeclaim`).
3. **`FREQ_ORDER`** — 사용 빈도순 표시 순서(수동 배열). `NAME_ORDER`는 `OBJECTS` 키를 라벨 기준으로 자동 정렬해 생성되므로 별도 수정 불필요.
4. **상태 트리** — `createState(field)`가 필드 트리와 1:1 대응하는 상태 노드를 생성합니다. 각 노드는 `included`(포함 여부), 타입별 값(`value`/`entries`/`items`/`children`), group·list-group은 `uiCollapsed`를 가집니다.
5. **YAML 직렬화** — `buildFieldLines(fields, stateChildren, indent, ctx)`가 상태 트리를 재귀 순회하며 YAML 라인을 만듭니다. 값이 비어 있으면(필수 포함) 해당 필드/그룹을 생략합니다. `ctx.namespaceDefault`로 상단바 네임스페이스를 `metadata.namespace`가 비어 있을 때만 채워 넣습니다.
6. **렌더링** — `renderTree()` → `renderNode(field, state, depth)` → `renderControl(field, state, depth)`가 타입별 입력 UI를 만듭니다. `renderYAML()`이 `generateYAML()` 결과를 `highlightYAML()`로 하이라이팅해 출력합니다.

**리렌더링 규칙**: 텍스트/숫자/셀렉트 입력의 `input`/`change`는 상태 값만 갱신하고 `renderYAML()`만 호출합니다(트리 DOM은 그대로 두어 포커스 유지). 체크박스 토글, 펼침/접힘, 항목 추가·삭제처럼 구조가 바뀌는 동작만 `renderTree()`를 다시 호출합니다.

## 새 오브젝트를 추가할 때 (PRD 12절과 동일)

1. `OBJECTS` 객체에 `label`, `desc`, `apiVersion`, `kind`, `clusterScoped`, `fields` 추가.
2. `metadataFields()`를 재사용하되, cluster-scoped 오브젝트면 `{ noNamespace: true }` 전달.
3. `FREQ_ORDER` 배열에 적절한 위치로 키를 추가(`NAME_ORDER`는 자동 정렬되므로 수정 불필요).
4. 실제 쿠버네티스 스키마와 동일한 계층 구조로 필드를 중첩하세요(평탄화 금지). 기존 헬퍼(`podSpecChildren`, `containerListGroupChildren`, `podTemplateField`, `selectorField`, `rbacRuleChildren`)로 커버되는 부분은 재사용하고, 없으면 유사한 패턴으로 새 헬퍼를 만드세요.
5. 새로운 필드 **타입**이 필요한 경우에만 `createState`, `renderNode`/`renderControl`, `buildFieldLines` 세 함수에 분기를 동시에 추가해야 합니다(상태·렌더링·직렬화가 각각 분리되어 있음). 기존 4가지 타입(`string`/`number`/`boolean`/`select`/`map`/`list-string`/`group`/`list-group`)으로 표현 가능하면 새 타입을 만들지 마세요.

## 범위 밖 (PRD 4절)

`kubectl apply` 등 실제 배포, 멀티 도큐먼트 내보내기, YAML 가져오기(역파싱), 서버 저장/로그인/협업, 클러스터 실시간 조회는 이 도구의 범위가 아닙니다. 관련 요청이 오면 `docs/PRD.md`의 "향후 개선 백로그"를 참고해 별도 확인 후 진행하세요.

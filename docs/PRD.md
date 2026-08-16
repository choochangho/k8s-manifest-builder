# K8s Manifest Builder — PRD

## 1. 개요

**문제**
쿠버네티스 매니페스트(YAML)를 작성할 때마다 개발자·클러스터 관리자는 공식 API 문서를 오가며 각 오브젝트 필드가 필수인지, 권장인지, 그 의미가 무엇인지 매번 다시 찾아봐야 한다. 이는 반복적이고 비효율적이며, 초보자에게는 진입 장벽이 된다.

**해결책**
쿠버네티스 오브젝트를 선택하면 속성이 트리 구조로 나타나고, 각 속성마다 필수/권장/선택 여부와 의미 설명을 바로 보여주며, 값을 입력하는 즉시 오른쪽에 완성된 YAML이 실시간으로 생성되는 단일 페이지 도구를 제공한다.

**현재 구현 형태**
외부 의존성 없는 순수 HTML/CSS/JavaScript로 구현되어 있으며(`index.html` + `style.css` + `app.js`), 브라우저에서 `index.html`을 여는 것만으로 동작한다. 백엔드, 빌드 과정, 패키지 매니저가 필요 없다.

---

## 2. 목표

- API 문서를 오가지 않고도 화면 안에서 각 필드의 필수 여부·의미를 확인하며 매니페스트를 작성할 수 있게 한다.
- 실수로 필수 필드를 빠뜨리거나 권장 필드(리소스 요청/제한 등)를 놓치는 일을 줄인다.
- 값을 입력하는 즉시 정확한 YAML을 눈으로 확인하고 클립보드로 바로 복사해 사용할 수 있게 한다.

## 3. 타깃 사용자

- 쿠버네티스 매니페스트를 직접 작성하는 애플리케이션 개발자
- 클러스터 운영·정책(RBAC, 쿼터, 네트워크 정책 등)을 관리하는 클러스터 관리자
- 쿠버네티스를 처음 배우는 주니어 엔지니어

## 4. 범위 밖 (Out of scope)

- 실제 클러스터에 대한 `kubectl apply` 등 배포 기능 (읽기 전용 생성 도구)
- 여러 오브젝트를 하나의 멀티 도큐먼트 YAML로 묶어 내보내기
- 기존 YAML 파일을 불러와 역으로 트리에 채우는 기능(가져오기)
- 서버 저장/공유, 로그인, 협업 기능
- 클러스터 실시간 조회(현재 존재하는 리소스 목록 등)

---

## 5. 정보 구조 / 화면 레이아웃

```
┌───────────────────────────────────────────────────────────────────┐
│ 상단바: 클러스터 버전 선택 · 네임스페이스 입력                          │
├───────────┬───────────────────────────────┬─────────────────────────┤
│ 사이드바   │ 속성 트리 패널                    │ YAML 미리보기 패널        │
│ (오브젝트  │ - 선택 오브젝트 제목/설명          │ - 실시간 생성된 YAML      │
│  목록,     │ - 모두 펼치기 / 모두 접기 버튼      │ - 문법 하이라이팅         │
│  정렬 선택)│ - 필드별 체크박스 · 배지 · 설명 · 입력 │ - 복사 버튼               │
└───────────┴───────────────────────────────┴─────────────────────────┘
```

---

## 6. 기능 요구사항

### 6.1 상단바
- **클러스터 버전 선택** — 참고용 표시(현재 apiVersion 값 자체를 변경하지는 않음).
- **네임스페이스 입력** — 값을 입력하면, 개별 오브젝트에서 `metadata.namespace`를 비워둔 경우 이 값이 자동으로 채워진다. Namespace, ClusterRole, ClusterRoleBinding, StorageClass, PersistentVolume, CustomResourceDefinition처럼 클러스터 범위(cluster-scoped) 오브젝트는 이 필드 자체가 나타나지 않는다.

### 6.2 사이드바 (오브젝트 목록)
- 지원하는 모든 쿠버네티스 오브젝트 종류를 버튼 목록으로 나열한다.
- **정렬 기준**: "사용 빈도순"(기본값) / "이름순" 드롭다운으로 전환 가능. 순번은 정렬 기준에 따라 다시 매겨진다.
- 클릭 시 해당 오브젝트의 트리 상태가 초기화되어 로드된다(다른 오브젝트로 전환 시 입력값은 유지되지 않음).

### 6.3 속성 트리 패널
각 속성(필드) 노드는 다음 요소로 구성된다.

| 요소 | 설명 |
|---|---|
| 체크박스 | 필드를 YAML에 포함할지 여부. **필수** 필드는 체크 해제 불가(항상 포함). **권장** 필드는 기본 체크. **선택** 필드는 기본 미체크. |
| 펼침/접힘 아이콘 (+/−) | object·list 타입 필드에만 표시. 클릭 시 하위 필드를 접거나 펼친다. |
| 필드명 | camelCase 원본 키 이름을 그대로 표기 (예: `imagePullPolicy`). |
| 배지 | 필수(빨강) / 권장(노랑) / 선택(회색) 중 하나. |
| 타입 태그 | string / number / boolean / enum / object / map / list / list\<string\> 등. |
| 설명 텍스트 | 해당 필드가 무엇을 의미하는지 1~2문장으로 서술. |
| 입력 컨트롤 | 타입에 맞는 UI(텍스트, 숫자, select, map의 key-value 행, list의 항목 추가/삭제, list-group의 카드형 항목 추가/삭제). |

- **모두 펼치기 / 모두 접기** 버튼으로 현재 오브젝트의 모든 object·list 필드를 일괄 펼치거나 접을 수 있다.
- map, list-string, list-group 타입은 "+ 항목 추가" 버튼으로 행/항목을 추가하고, 각 행/항목의 "삭제" 버튼으로 제거한다.

### 6.4 YAML 미리보기 패널
- 입력값이 바뀔 때마다 즉시 재계산되어 표시된다(디바운스 없이 즉시 반영).
- 실제 쿠버네티스 스키마 구조와 동일하게 중첩된 YAML을 생성한다(가짜 평탄화 없이, 예: PVC의 `spec.resources.requests.storage`처럼 실제 계층 구조 그대로 출력).
- 값이 비어 있는 선택/권장 필드는 YAML에서 생략된다. 필수 필드라도 값이 비어 있으면 출력에서 생략한다(사용자가 잊지 않도록 트리에서는 계속 "필수" 배지로 표시).
- 상단에 파일명 라벨(`{Kind}.yaml`)과 **복사** 버튼을 제공하며, 복사 시 클립보드 API로 전체 YAML 텍스트를 복사하고 버튼 텍스트가 일시적으로 "복사됨"으로 바뀐다.
- 키(`yk`), 값(`yv`), 리스트 대시(`yc`)에 대해 최소한의 문법 하이라이팅을 적용한다.

---

## 7. 데이터 모델 (필드 트리 스키마)

내부적으로 각 오브젝트는 `F(key, type, level, extra)` 헬퍼로 정의된 필드 트리로 표현된다.

```js
F(key, type, level, extra)
// type:  'string' | 'number' | 'boolean' | 'select' | 'map' | 'list-string' | 'group' | 'list-group'
// level: 'req' (필수) | 'rec' (권장) | 'opt' (선택)
// extra: { desc, placeholder, options, children }
```

- `group` — 하위 필드를 가진 객체 (예: `spec`, `metadata`, `resources`)
- `list-group` — 반복 가능한 객체 배열 (예: `containers`, `ports`, `rules`). 각 항목은 `children`에 정의된 필드 집합을 가진다.
- `map` — 자유 형식의 key-value 쌍 (예: `labels`, `data`)
- `list-string` — 단순 문자열 배열 (예: `command`, `hosts`)

상태(state) 트리는 필드 트리와 1:1로 대응하며, 각 노드는 `included`(포함 여부), `uiCollapsed`(펼침 상태), 그리고 타입별 값(`value` / `entries` / `items` / `children`)을 가진다.

YAML 생성은 상태 트리를 재귀 순회(`buildFieldLines`)하며 들여쓰기 레벨에 맞춰 라인을 조립하는 방식으로 동작한다.

---

## 8. 지원 오브젝트 목록 (사용 빈도순, 현재 26종)

1. Pod
2. Deployment
3. Service
4. ConfigMap
5. Secret
6. Ingress
7. Namespace
8. PersistentVolumeClaim
9. Job
10. CronJob
11. StatefulSet
12. DaemonSet
13. ServiceAccount
14. HorizontalPodAutoscaler
15. ReplicaSet
16. Role
17. RoleBinding
18. ClusterRole
19. ClusterRoleBinding
20. NetworkPolicy
21. ResourceQuota
22. LimitRange
23. PodDisruptionBudget
24. StorageClass
25. PersistentVolume
26. CustomResourceDefinition

각 오브젝트는 `apiVersion`, `kind`가 고정되어 있으며, `metadata`(이름/네임스페이스/라벨/어노테이션)를 공통으로 포함한다. 클러스터 범위 오브젝트(Namespace, ClusterRole, ClusterRoleBinding, StorageClass, PersistentVolume, CustomResourceDefinition)는 `metadata.namespace` 필드를 갖지 않는다.

---

## 9. 비기능 요구사항

- **정적 파일 배포**: `index.html`/`style.css`/`app.js` 3개 파일로 구성되며, 외부 CDN·서버 호출이 없어야 한다(오프라인에서도 동작). 같은 디렉터리에 3개 파일만 있으면 브라우저에서 `index.html`을 여는 것만으로 동작해야 한다(별도 서버·빌드 불필요).
- **성능**: 입력 변경 시 트리 재렌더링과 YAML 재생성이 체감 지연 없이(수십 ms 이내) 이루어져야 한다.
- **브라우저 호환성**: 최신 Chrome/Edge/Safari/Firefox에서 별도 폴리필 없이 동작해야 한다.
- **접근성**: 체크박스·버튼·입력 요소는 표준 HTML 폼 요소를 사용해 키보드 포커스가 가능해야 한다.
- **다크 테마 고정**: 현재는 다크 테마 단일 톤으로 고정되어 있음(라이트 모드는 범위 밖).

---

## 10. 향후 개선 백로그 (우선순위 순)

1. **누락된 실무 필드 보강**
   - Deployment/Pod: `affinity`, `tolerations`, `imagePullSecrets`, `readinessProbe`, `securityContext`
   - Ingress: 규칙당 다중 path 지원(현재는 규칙당 path 1개로 단순화됨)
   - ConfigMap/Secret → 컨테이너 `envFrom` 연동
2. **YAML 가져오기(Import)**: 기존 YAML을 붙여넣으면 트리 상태로 역파싱해서 채워주는 기능
3. **멀티 도큐먼트 내보내기**: 여러 오브젝트를 `---`로 구분한 하나의 YAML로 묶어 다운로드
4. **오브젝트별 값 프리셋 저장/불러오기**: 자주 쓰는 구성을 로컬에 템플릿으로 저장
5. **유효성 검증 강화**: 라벨 셀렉터 불일치(예: `selector.matchLabels`와 `template.metadata.labels` 다름) 등을 화면에서 경고
6. **다국어 지원**: 현재 한국어 UI만 지원, 영어 토글 추가
7. **EndpointSlice, MutatingWebhookConfiguration 등 저빈도 오브젝트 확장**

---

## 11. 수용 기준 (Acceptance Criteria) 예시

- [ ] 좌측에서 오브젝트를 클릭하면 이전 오브젝트의 입력값이 초기화되고 새 오브젝트의 트리가 로드된다.
- [ ] 필수 필드는 체크박스가 비활성화된 채로 항상 선택 상태를 유지한다.
- [ ] 권장 필드는 기본적으로 체크되어 있고 해제 가능하다.
- [ ] 선택 필드를 체크하면 해당 입력 컨트롤이 나타나고, 값을 입력하면 즉시 YAML에 반영된다.
- [ ] "모두 접기" 클릭 시 모든 object/list 필드의 하위 항목이 숨겨지고, "모두 펼치기" 클릭 시 모두 다시 보인다.
- [ ] 네임스페이스 입력값은 `metadata.namespace`를 비워둔 모든 네임스페이스 오브젝트에 자동 반영되며, 클러스터 범위 오브젝트에는 영향을 주지 않는다.
- [ ] "복사" 버튼 클릭 시 현재 트리 상태 기준으로 생성된 YAML 전체가 클립보드에 복사된다.
- [ ] 정렬 드롭다운을 "이름순"으로 바꾸면 좌측 목록이 알파벳 순으로 재정렬되고 순번도 다시 매겨진다.

---

## 12. 기술 노트 (Claude Code 작업 시 참고)

- 산출물 경로: `index.html` / `style.css` / `app.js` (프로젝트 루트, 3개 파일)
- 프레임워크/빌드 도구 없음 — 순수 vanilla JS. React/Vue 등을 도입할 경우 이 PRD의 "정적 파일 배포" 요구사항을 재검토해야 함.
- 오브젝트 추가 시 체크리스트:
  1. `OBJECTS` 객체에 `label`, `desc`, `apiVersion`, `kind`, `fields` 추가
  2. `metadataFields()` 재사용 시 cluster-scoped 여부에 따라 `{noNamespace:true}` 옵션 전달
  3. `FREQ_ORDER` 배열에 적절한 위치로 키 추가 (NAME_ORDER는 자동 정렬되므로 별도 수정 불필요)
  4. 새 필드 타입이 필요하면 `createState`, `renderNode`, `buildFieldLines` 세 함수에 분기를 동시에 추가해야 함(트리 상태·렌더링·YAML 직렬화가 각각 별도 함수로 분리되어 있음)
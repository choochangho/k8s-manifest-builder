"use strict";

/* =========================================================
   1. 필드 트리 스키마 헬퍼
   ========================================================= */
function F(key, type, level, extra) {
  return Object.assign({ key, type, level }, extra || {});
}

function metadataFields(opts) {
  opts = opts || {};
  var children = [
    F('name', 'string', 'req', { desc: '오브젝트의 고유 이름입니다. 같은 네임스페이스(또는 클러스터) 범위 내에서 유일해야 합니다.', placeholder: 'my-app' }),
  ];
  if (!opts.noNamespace) {
    children.push(F('namespace', 'string', 'rec', { desc: '오브젝트가 속한 네임스페이스입니다. 비워두면 상단바의 네임스페이스 값이 자동으로 채워집니다.', placeholder: 'default' }));
  }
  children.push(F('labels', 'map', 'rec', { desc: '오브젝트를 분류하고 셀렉터로 선택하는 데 사용되는 키-값 쌍입니다.' }));
  children.push(F('annotations', 'map', 'opt', { desc: '도구나 라이브러리가 참조하는 임의의 비식별 메타데이터입니다.' }));
  return F('metadata', 'group', 'req', { desc: '오브젝트를 식별하는 데이터(이름, 네임스페이스, 라벨 등)입니다.', children: children });
}

function selectorField(desc) {
  return F('selector', 'group', 'req', { desc: desc, children: [
    F('matchLabels', 'map', 'req', { desc: '대상 Pod가 가지고 있어야 하는 라벨 키-값 쌍입니다.' }),
  ]});
}

function containerListGroupChildren() {
  return [
    F('name', 'string', 'req', { desc: '컨테이너의 이름입니다. Pod 내에서 고유해야 합니다.', placeholder: 'app' }),
    F('image', 'string', 'req', { desc: '실행할 컨테이너 이미지입니다.', placeholder: 'nginx:1.25' }),
    F('imagePullPolicy', 'select', 'opt', { desc: '이미지를 가져오는 정책입니다.', options: ['Always', 'IfNotPresent', 'Never'] }),
    F('command', 'list-string', 'opt', { desc: '컨테이너의 ENTRYPOINT를 덮어씁니다.' }),
    F('args', 'list-string', 'opt', { desc: '컨테이너의 CMD를 덮어씁니다.' }),
    F('workingDir', 'string', 'opt', { desc: '컨테이너 프로세스가 실행될 작업 디렉터리입니다.' }),
    F('ports', 'list-group', 'opt', { desc: '컨테이너가 노출하는 포트 목록입니다.', children: [
      F('containerPort', 'number', 'req', { desc: '컨테이너 내부에서 노출할 포트 번호입니다.', placeholder: '8080' }),
      F('protocol', 'select', 'opt', { desc: '포트가 사용하는 프로토콜입니다.', options: ['TCP', 'UDP', 'SCTP'] }),
      F('name', 'string', 'opt', { desc: '포트의 이름입니다. Service에서 이름으로 참조할 때 사용됩니다.' }),
    ]}),
    F('env', 'list-group', 'opt', { desc: '컨테이너에 주입할 환경 변수 목록입니다.', children: [
      F('name', 'string', 'req', { desc: '환경 변수의 이름입니다.' }),
      F('value', 'string', 'opt', { desc: '환경 변수의 값입니다.' }),
    ]}),
    F('resources', 'group', 'rec', { desc: '컨테이너에 할당할 CPU/메모리 요청 및 제한입니다.', children: [
      F('requests', 'group', 'rec', { desc: '스케줄링 시 이 컨테이너에 보장되는 최소 리소스양입니다.', children: [
        F('cpu', 'string', 'rec', { desc: '요청 CPU 양입니다.', placeholder: '100m' }),
        F('memory', 'string', 'rec', { desc: '요청 메모리 양입니다.', placeholder: '128Mi' }),
      ]}),
      F('limits', 'group', 'opt', { desc: '컨테이너가 사용할 수 있는 최대 리소스양입니다.', children: [
        F('cpu', 'string', 'opt', { desc: '제한 CPU 양입니다.', placeholder: '500m' }),
        F('memory', 'string', 'opt', { desc: '제한 메모리 양입니다.', placeholder: '256Mi' }),
      ]}),
    ]}),
    F('volumeMounts', 'list-group', 'opt', { desc: '컨테이너에 마운트할 볼륨 목록입니다.', children: [
      F('name', 'string', 'req', { desc: '마운트할 볼륨의 이름입니다. spec.volumes에 정의된 이름과 일치해야 합니다.' }),
      F('mountPath', 'string', 'req', { desc: '컨테이너 내부에서 볼륨이 마운트될 경로입니다.', placeholder: '/data' }),
      F('readOnly', 'boolean', 'opt', { desc: '읽기 전용으로 마운트할지 여부입니다.' }),
    ]}),
  ];
}

function podSpecChildren(opts) {
  opts = opts || {};
  var restartOptions = opts.restartOptions || ['Always', 'OnFailure', 'Never'];
  var restartDefault = opts.restartPolicyDefault || '';
  return [
    F('containers', 'list-group', 'req', { desc: 'Pod 내에서 실행할 컨테이너 목록입니다.', children: containerListGroupChildren() }),
    F('restartPolicy', 'select', 'opt', { desc: '컨테이너 재시작 정책입니다.', options: restartOptions, default: restartDefault }),
    F('volumes', 'list-group', 'opt', { desc: 'Pod에서 사용할 볼륨 목록입니다.', children: [
      F('name', 'string', 'req', { desc: '볼륨의 이름입니다. containers[].volumeMounts.name과 일치해야 합니다.' }),
      F('configMap', 'group', 'opt', { desc: 'ConfigMap을 볼륨 소스로 사용합니다.', children: [
        F('name', 'string', 'req', { desc: '참조할 ConfigMap의 이름입니다.' }),
      ]}),
      F('secret', 'group', 'opt', { desc: 'Secret을 볼륨 소스로 사용합니다.', children: [
        F('secretName', 'string', 'req', { desc: '참조할 Secret의 이름입니다.' }),
      ]}),
      F('persistentVolumeClaim', 'group', 'opt', { desc: 'PersistentVolumeClaim을 볼륨 소스로 사용합니다.', children: [
        F('claimName', 'string', 'req', { desc: '참조할 PersistentVolumeClaim의 이름입니다.' }),
      ]}),
      F('emptyDir', 'group', 'opt', { desc: 'Pod 생명주기 동안만 유지되는 빈 디렉터리입니다.', children: [
        F('medium', 'select', 'opt', { desc: '저장 매체입니다. Memory 선택 시 tmpfs를 사용합니다.', options: ['Memory'] }),
      ]}),
    ]}),
    F('serviceAccountName', 'string', 'opt', { desc: 'Pod가 사용할 ServiceAccount의 이름입니다.' }),
    F('nodeSelector', 'map', 'opt', { desc: 'Pod가 스케줄될 노드를 제한하는 라벨 셀렉터입니다.' }),
    F('dnsPolicy', 'select', 'opt', { desc: 'Pod의 DNS 정책입니다.', options: ['ClusterFirst', 'Default', 'ClusterFirstWithHostNet', 'None'] }),
  ];
}

function podTemplateField(opts) {
  return F('template', 'group', 'req', { desc: '생성할 Pod의 템플릿입니다.', children: [
    F('metadata', 'group', 'rec', { desc: '생성될 Pod에 붙일 메타데이터입니다.', children: [
      F('labels', 'map', 'rec', { desc: 'Pod에 붙일 라벨입니다. selector.matchLabels와 일치해야 스케줄링이 정상 동작합니다.' }),
    ]}),
    F('spec', 'group', 'req', { desc: '생성될 Pod의 스펙입니다.', children: podSpecChildren(opts) }),
  ]});
}

function rbacRuleChildren() {
  return [
    F('apiGroups', 'list-string', 'req', { desc: '규칙이 적용되는 API 그룹입니다. core 그룹은 빈 문자열("")로 표기합니다.', placeholder: 'apps' }),
    F('resources', 'list-string', 'req', { desc: '규칙이 적용되는 리소스 종류입니다.', placeholder: 'pods' }),
    F('verbs', 'list-string', 'req', { desc: '허용할 동작입니다.', placeholder: 'get' }),
  ];
}

/* =========================================================
   2. 오브젝트 정의
   ========================================================= */
var OBJECTS = {
  pod: {
    label: 'Pod', clusterScoped: false,
    desc: '클러스터에서 실행되는 가장 작은 배포 단위로, 하나 이상의 컨테이너 그룹입니다.',
    apiVersion: 'v1', kind: 'Pod',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'Pod가 실행할 컨테이너와 런타임 설정을 정의합니다.', children: podSpecChildren({ restartOptions: ['Always', 'OnFailure', 'Never'], restartPolicyDefault: 'Always' }) }) ],
  },
  deployment: {
    label: 'Deployment', clusterScoped: false,
    desc: '무상태(stateless) 애플리케이션의 선언적 배포와 롤링 업데이트를 관리합니다.',
    apiVersion: 'apps/v1', kind: 'Deployment',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'Deployment가 유지해야 할 원하는 상태를 정의합니다.', children: [
      F('replicas', 'number', 'rec', { desc: '유지할 Pod 복제본 수입니다.', default: 1, placeholder: '3' }),
      selectorField('template.metadata.labels와 일치해야 하는 라벨 셀렉터입니다.'),
      podTemplateField({ restartOptions: ['Always'], restartPolicyDefault: 'Always' }),
      F('strategy', 'group', 'opt', { desc: '기존 Pod를 새 Pod로 교체하는 전략입니다.', children: [
        F('type', 'select', 'opt', { desc: '업데이트 전략 종류입니다.', options: ['RollingUpdate', 'Recreate'] }),
      ]}),
    ]}) ],
  },
  service: {
    label: 'Service', clusterScoped: false,
    desc: 'Pod 집합에 접근할 수 있는 안정적인 네트워크 엔드포인트를 제공합니다.',
    apiVersion: 'v1', kind: 'Service',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'Service가 트래픽을 라우팅하는 방식을 정의합니다.', children: [
      F('type', 'select', 'rec', { desc: 'Service의 노출 방식입니다.', options: ['ClusterIP', 'NodePort', 'LoadBalancer', 'ExternalName'], default: 'ClusterIP' }),
      F('selector', 'map', 'rec', { desc: '트래픽을 전달할 대상 Pod를 선택하는 라벨입니다.' }),
      F('ports', 'list-group', 'req', { desc: 'Service가 노출하는 포트 목록입니다.', children: [
        F('port', 'number', 'req', { desc: 'Service가 노출할 포트 번호입니다.', placeholder: '80' }),
        F('targetPort', 'number', 'opt', { desc: '트래픽이 전달될 Pod 컨테이너의 포트입니다.', placeholder: '8080' }),
        F('protocol', 'select', 'opt', { desc: '포트의 프로토콜입니다.', options: ['TCP', 'UDP'] }),
        F('nodePort', 'number', 'opt', { desc: 'NodePort 타입일 때 각 노드에 열리는 포트입니다.', placeholder: '30080' }),
        F('name', 'string', 'opt', { desc: '포트의 이름입니다. 포트가 여러 개일 때 필요합니다.' }),
      ]}),
      F('clusterIP', 'string', 'opt', { desc: '고정으로 할당할 클러스터 내부 IP입니다. 헤드리스 서비스는 "None"을 입력합니다.' }),
    ]}) ],
  },
  configmap: {
    label: 'ConfigMap', clusterScoped: false,
    desc: '설정 데이터를 키-값 쌍으로 저장해 Pod에 주입할 수 있게 합니다.',
    apiVersion: 'v1', kind: 'ConfigMap',
    fields: [ metadataFields(),
      F('data', 'map', 'rec', { desc: 'UTF-8 문자열 형태의 설정 데이터입니다.' }),
      F('immutable', 'boolean', 'opt', { desc: 'true로 설정하면 생성 후 데이터를 수정할 수 없습니다.' }),
    ],
  },
  secret: {
    label: 'Secret', clusterScoped: false,
    desc: '비밀번호, 토큰, 키 등 민감한 정보를 저장합니다.',
    apiVersion: 'v1', kind: 'Secret',
    fields: [ metadataFields(),
      F('type', 'select', 'rec', { desc: 'Secret의 종류입니다.', options: ['Opaque', 'kubernetes.io/tls', 'kubernetes.io/dockerconfigjson', 'kubernetes.io/basic-auth'], default: 'Opaque' }),
      F('data', 'map', 'rec', { desc: 'base64로 인코딩된 값입니다.' }),
      F('stringData', 'map', 'opt', { desc: '인코딩되지 않은 평문 값입니다. 저장 시 자동으로 base64 인코딩됩니다.' }),
    ],
  },
  ingress: {
    label: 'Ingress', clusterScoped: false,
    desc: '클러스터 외부에서 내부 Service로의 HTTP(S) 라우팅 규칙을 정의합니다.',
    apiVersion: 'networking.k8s.io/v1', kind: 'Ingress',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'Ingress 라우팅 규칙을 정의합니다.', children: [
      F('ingressClassName', 'string', 'rec', { desc: '이 Ingress를 처리할 IngressClass의 이름입니다.', placeholder: 'nginx' }),
      F('rules', 'list-group', 'req', { desc: '호스트/경로별 라우팅 규칙 목록입니다.', children: [
        F('host', 'string', 'req', { desc: '규칙이 적용되는 도메인입니다.', placeholder: 'app.example.com' }),
        F('http', 'group', 'req', { desc: 'HTTP 경로 라우팅 정보입니다.', children: [
          F('paths', 'list-group', 'req', { desc: '이 호스트에서 매칭할 경로 목록입니다.', children: [
            F('path', 'string', 'rec', { desc: '매칭할 URL 경로입니다.', default: '/' }),
            F('pathType', 'select', 'rec', { desc: '경로 매칭 방식입니다.', options: ['Prefix', 'Exact', 'ImplementationSpecific'], default: 'Prefix' }),
            F('backend', 'group', 'req', { desc: '트래픽을 전달할 대상입니다.', children: [
              F('service', 'group', 'req', { desc: '전달 대상 Service입니다.', children: [
                F('name', 'string', 'req', { desc: '대상 Service의 이름입니다.' }),
                F('port', 'group', 'req', { desc: '대상 Service의 포트입니다.', children: [
                  F('number', 'number', 'req', { desc: '대상 Service의 포트 번호입니다.', placeholder: '80' }),
                ]}),
              ]}),
            ]}),
          ]}),
        ]}),
      ]}),
      F('tls', 'list-group', 'opt', { desc: 'TLS 종료에 사용할 인증서 설정 목록입니다.', children: [
        F('hosts', 'list-string', 'opt', { desc: '이 인증서가 적용되는 호스트 목록입니다.' }),
        F('secretName', 'string', 'opt', { desc: 'TLS 인증서/키를 담고 있는 Secret의 이름입니다.' }),
      ]}),
    ]}) ],
  },
  namespace: {
    label: 'Namespace', clusterScoped: true,
    desc: '리소스를 논리적으로 격리하는 가상 클러스터 단위입니다.',
    apiVersion: 'v1', kind: 'Namespace',
    fields: [ metadataFields({ noNamespace: true }) ],
  },
  persistentvolumeclaim: {
    label: 'PersistentVolumeClaim', clusterScoped: false,
    desc: '사용자가 요청하는 스토리지 자원으로, PersistentVolume에 바인딩됩니다.',
    apiVersion: 'v1', kind: 'PersistentVolumeClaim',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: '요청할 스토리지의 조건을 정의합니다.', children: [
      F('accessModes', 'list-string', 'req', { desc: '볼륨 접근 모드입니다.', placeholder: 'ReadWriteOnce' }),
      F('storageClassName', 'string', 'opt', { desc: '사용할 StorageClass의 이름입니다. 비워두면 기본 StorageClass가 사용됩니다.' }),
      F('resources', 'group', 'req', { desc: '요청할 리소스 양입니다.', children: [
        F('requests', 'group', 'req', { desc: '요청할 스토리지 용량입니다.', children: [
          F('storage', 'string', 'req', { desc: '요청할 스토리지 용량입니다.', placeholder: '1Gi' }),
        ]}),
      ]}),
      F('volumeMode', 'select', 'opt', { desc: '볼륨을 파일시스템으로 마운트할지, 블록 디바이스로 사용할지 결정합니다.', options: ['Filesystem', 'Block'] }),
    ]}) ],
  },
  job: {
    label: 'Job', clusterScoped: false,
    desc: '하나 이상의 Pod를 실행해 작업을 완료할 때까지 관리하는 일회성 작업입니다.',
    apiVersion: 'batch/v1', kind: 'Job',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'Job이 실행할 Pod와 완료 조건을 정의합니다.', children: [
      podTemplateField({ restartOptions: ['OnFailure', 'Never'], restartPolicyDefault: 'Never' }),
      F('backoffLimit', 'number', 'opt', { desc: 'Job을 실패로 표시하기 전까지의 재시도 횟수입니다.', placeholder: '6' }),
      F('completions', 'number', 'opt', { desc: 'Job이 성공으로 간주되기 위해 완료되어야 하는 Pod 수입니다.' }),
      F('parallelism', 'number', 'opt', { desc: '동시에 실행할 수 있는 Pod 수입니다.' }),
    ]}) ],
  },
  cronjob: {
    label: 'CronJob', clusterScoped: false,
    desc: '정해진 스케줄에 따라 주기적으로 Job을 생성합니다.',
    apiVersion: 'batch/v1', kind: 'CronJob',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'CronJob의 스케줄과 Job 템플릿을 정의합니다.', children: [
      F('schedule', 'string', 'req', { desc: 'Cron 형식의 실행 스케줄입니다.', placeholder: '*/5 * * * *' }),
      F('concurrencyPolicy', 'select', 'opt', { desc: '이전 실행이 끝나지 않았을 때의 동작 방식입니다.', options: ['Allow', 'Forbid', 'Replace'] }),
      F('suspend', 'boolean', 'opt', { desc: 'true로 설정하면 이후 스케줄된 실행을 일시 중지합니다.' }),
      F('jobTemplate', 'group', 'req', { desc: '스케줄마다 생성할 Job의 템플릿입니다.', children: [
        F('spec', 'group', 'req', { desc: '생성될 Job의 스펙입니다.', children: [
          podTemplateField({ restartOptions: ['OnFailure', 'Never'], restartPolicyDefault: 'OnFailure' }),
        ]}),
      ]}),
      F('successfulJobsHistoryLimit', 'number', 'opt', { desc: '보관할 성공한 Job 기록 수입니다.', placeholder: '3' }),
      F('failedJobsHistoryLimit', 'number', 'opt', { desc: '보관할 실패한 Job 기록 수입니다.', placeholder: '1' }),
    ]}) ],
  },
  statefulset: {
    label: 'StatefulSet', clusterScoped: false,
    desc: '고유한 네트워크 식별자와 안정적인 스토리지를 갖는 상태 유지(stateful) 애플리케이션을 관리합니다.',
    apiVersion: 'apps/v1', kind: 'StatefulSet',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'StatefulSet의 원하는 상태를 정의합니다.', children: [
      F('serviceName', 'string', 'req', { desc: '각 Pod에 안정적인 DNS를 제공하는 헤드리스 Service의 이름입니다.' }),
      F('replicas', 'number', 'rec', { desc: '유지할 Pod 복제본 수입니다.', default: 1 }),
      selectorField('template.metadata.labels와 일치해야 하는 라벨 셀렉터입니다.'),
      podTemplateField({ restartOptions: ['Always'], restartPolicyDefault: 'Always' }),
      F('volumeClaimTemplates', 'list-group', 'opt', { desc: '각 Pod마다 자동 생성될 PVC 템플릿 목록입니다.', children: [
        F('metadata', 'group', 'req', { desc: '생성될 PVC의 메타데이터입니다.', children: [
          F('name', 'string', 'req', { desc: '생성될 PVC 이름의 접두사입니다.' }),
        ]}),
        F('spec', 'group', 'req', { desc: '생성될 PVC의 스펙입니다.', children: [
          F('accessModes', 'list-string', 'req', { desc: '볼륨 접근 모드입니다.', placeholder: 'ReadWriteOnce' }),
          F('resources', 'group', 'req', { desc: '요청할 리소스 양입니다.', children: [
            F('requests', 'group', 'req', { desc: '요청할 스토리지 용량입니다.', children: [
              F('storage', 'string', 'req', { desc: '요청할 스토리지 용량입니다.', placeholder: '1Gi' }),
            ]}),
          ]}),
        ]}),
      ]}),
    ]}) ],
  },
  daemonset: {
    label: 'DaemonSet', clusterScoped: false,
    desc: '클러스터의 모든(또는 일부) 노드마다 정확히 하나의 Pod 사본을 실행합니다.',
    apiVersion: 'apps/v1', kind: 'DaemonSet',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'DaemonSet의 원하는 상태를 정의합니다.', children: [
      selectorField('template.metadata.labels와 일치해야 하는 라벨 셀렉터입니다.'),
      podTemplateField({ restartOptions: ['Always'], restartPolicyDefault: 'Always' }),
    ]}) ],
  },
  serviceaccount: {
    label: 'ServiceAccount', clusterScoped: false,
    desc: 'Pod 내 프로세스가 쿠버네티스 API에 접근할 때 사용하는 신원(identity)입니다.',
    apiVersion: 'v1', kind: 'ServiceAccount',
    fields: [ metadataFields(),
      F('automountServiceAccountToken', 'boolean', 'opt', { desc: 'Pod에 이 ServiceAccount의 토큰을 자동으로 마운트할지 여부입니다.' }),
      F('imagePullSecrets', 'list-group', 'opt', { desc: '이 ServiceAccount로 실행되는 Pod가 사용할 이미지 pull secret 목록입니다.', children: [
        F('name', 'string', 'req', { desc: '참조할 Secret의 이름입니다.' }),
      ]}),
    ],
  },
  horizontalpodautoscaler: {
    label: 'HorizontalPodAutoscaler', clusterScoped: false,
    desc: '메트릭을 기반으로 워크로드의 Pod 복제본 수를 자동으로 조절합니다.',
    apiVersion: 'autoscaling/v2', kind: 'HorizontalPodAutoscaler',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: '오토스케일링 대상과 조건을 정의합니다.', children: [
      F('scaleTargetRef', 'group', 'req', { desc: '스케일링할 대상 워크로드입니다.', children: [
        F('apiVersion', 'string', 'req', { desc: '대상 리소스의 apiVersion입니다.', default: 'apps/v1' }),
        F('kind', 'string', 'req', { desc: '대상 리소스의 종류입니다.', default: 'Deployment' }),
        F('name', 'string', 'req', { desc: '대상 리소스의 이름입니다.' }),
      ]}),
      F('minReplicas', 'number', 'rec', { desc: '유지할 최소 복제본 수입니다.', default: 1 }),
      F('maxReplicas', 'number', 'req', { desc: '허용할 최대 복제본 수입니다.', placeholder: '10' }),
      F('metrics', 'list-group', 'opt', { desc: '스케일링 기준이 되는 메트릭 목록입니다.', children: [
        F('type', 'select', 'req', { desc: '메트릭 종류입니다.', options: ['Resource'], default: 'Resource' }),
        F('resource', 'group', 'req', { desc: '리소스 기반 메트릭 설정입니다.', children: [
          F('name', 'select', 'req', { desc: '기준이 되는 리소스입니다.', options: ['cpu', 'memory'] }),
          F('target', 'group', 'req', { desc: '목표 값 설정입니다.', children: [
            F('type', 'select', 'req', { desc: '목표 값의 종류입니다.', options: ['Utilization', 'AverageValue'], default: 'Utilization' }),
            F('averageUtilization', 'number', 'opt', { desc: '목표 평균 사용률(%)입니다.', placeholder: '80' }),
          ]}),
        ]}),
      ]}),
    ]}) ],
  },
  replicaset: {
    label: 'ReplicaSet', clusterScoped: false,
    desc: '지정된 수만큼의 동일한 Pod 복제본이 항상 실행되도록 보장합니다.',
    apiVersion: 'apps/v1', kind: 'ReplicaSet',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: 'ReplicaSet의 원하는 상태를 정의합니다.', children: [
      F('replicas', 'number', 'rec', { desc: '유지할 Pod 복제본 수입니다.', default: 1 }),
      selectorField('template.metadata.labels와 일치해야 하는 라벨 셀렉터입니다.'),
      podTemplateField({ restartOptions: ['Always'], restartPolicyDefault: 'Always' }),
    ]}) ],
  },
  role: {
    label: 'Role', clusterScoped: false,
    desc: '네임스페이스 범위 내에서 허용할 API 동작 규칙 집합을 정의합니다.',
    apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'Role',
    fields: [ metadataFields(),
      F('rules', 'list-group', 'req', { desc: '허용할 권한 규칙 목록입니다.', children: rbacRuleChildren() }),
    ],
  },
  rolebinding: {
    label: 'RoleBinding', clusterScoped: false,
    desc: 'Role이 정의한 권한을 사용자·그룹·ServiceAccount에 부여합니다.',
    apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'RoleBinding',
    fields: [ metadataFields(),
      F('subjects', 'list-group', 'req', { desc: '권한을 부여받을 대상 목록입니다.', children: [
        F('kind', 'select', 'req', { desc: '대상의 종류입니다.', options: ['ServiceAccount', 'User', 'Group'], default: 'ServiceAccount' }),
        F('name', 'string', 'req', { desc: '대상의 이름입니다.' }),
        F('namespace', 'string', 'opt', { desc: '대상 ServiceAccount가 속한 네임스페이스입니다.' }),
      ]}),
      F('roleRef', 'group', 'req', { desc: '부여할 권한을 정의한 Role(또는 ClusterRole)입니다.', children: [
        F('apiGroup', 'string', 'req', { desc: '참조 대상의 API 그룹입니다.', default: 'rbac.authorization.k8s.io' }),
        F('kind', 'select', 'req', { desc: '참조 대상의 종류입니다.', options: ['Role', 'ClusterRole'], default: 'Role' }),
        F('name', 'string', 'req', { desc: '참조할 Role(또는 ClusterRole)의 이름입니다.' }),
      ]}),
    ],
  },
  clusterrole: {
    label: 'ClusterRole', clusterScoped: true,
    desc: '클러스터 범위(또는 모든 네임스페이스)에서 허용할 API 동작 규칙 집합을 정의합니다.',
    apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole',
    fields: [ metadataFields({ noNamespace: true }),
      F('rules', 'list-group', 'req', { desc: '허용할 권한 규칙 목록입니다.', children: rbacRuleChildren() }),
    ],
  },
  clusterrolebinding: {
    label: 'ClusterRoleBinding', clusterScoped: true,
    desc: 'ClusterRole이 정의한 권한을 클러스터 범위에서 사용자·그룹·ServiceAccount에 부여합니다.',
    apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRoleBinding',
    fields: [ metadataFields({ noNamespace: true }),
      F('subjects', 'list-group', 'req', { desc: '권한을 부여받을 대상 목록입니다.', children: [
        F('kind', 'select', 'req', { desc: '대상의 종류입니다.', options: ['ServiceAccount', 'User', 'Group'], default: 'ServiceAccount' }),
        F('name', 'string', 'req', { desc: '대상의 이름입니다.' }),
        F('namespace', 'string', 'opt', { desc: '대상 ServiceAccount가 속한 네임스페이스입니다.' }),
      ]}),
      F('roleRef', 'group', 'req', { desc: '부여할 권한을 정의한 ClusterRole입니다.', children: [
        F('apiGroup', 'string', 'req', { desc: '참조 대상의 API 그룹입니다.', default: 'rbac.authorization.k8s.io' }),
        F('kind', 'select', 'req', { desc: '참조 대상의 종류입니다.', options: ['ClusterRole'], default: 'ClusterRole' }),
        F('name', 'string', 'req', { desc: '참조할 ClusterRole의 이름입니다.' }),
      ]}),
    ],
  },
  networkpolicy: {
    label: 'NetworkPolicy', clusterScoped: false,
    desc: 'Pod 간 또는 Pod와 외부 간 네트워크 트래픽을 제어하는 규칙을 정의합니다.',
    apiVersion: 'networking.k8s.io/v1', kind: 'NetworkPolicy',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: '정책이 적용될 대상과 허용 규칙을 정의합니다.', children: [
      F('podSelector', 'group', 'req', { desc: '이 정책이 적용될 대상 Pod를 선택하는 라벨 셀렉터입니다. 비워두면 네임스페이스 내 모든 Pod에 적용됩니다.', children: [
        F('matchLabels', 'map', 'opt', { desc: '대상 Pod가 가지고 있어야 하는 라벨 키-값 쌍입니다.' }),
      ]}),
      F('policyTypes', 'list-string', 'opt', { desc: '이 정책이 제어하는 트래픽 방향입니다.', placeholder: 'Ingress' }),
      F('ingress', 'list-group', 'opt', { desc: '허용할 인바운드 트래픽 규칙 목록입니다.', children: [
        F('from', 'list-group', 'opt', { desc: '트래픽을 허용할 출발지 목록입니다.', children: [
          F('ipBlock', 'group', 'opt', { desc: 'CIDR 대역 기준으로 출발지를 제한합니다.', children: [
            F('cidr', 'string', 'req', { desc: '허용할 IP 대역입니다.', placeholder: '10.0.0.0/24' }),
          ]}),
        ]}),
        F('ports', 'list-group', 'opt', { desc: '허용할 포트 목록입니다.', children: [
          F('protocol', 'select', 'opt', { desc: '허용할 프로토콜입니다.', options: ['TCP', 'UDP', 'SCTP'] }),
          F('port', 'number', 'opt', { desc: '허용할 포트 번호입니다.' }),
        ]}),
      ]}),
      F('egress', 'list-group', 'opt', { desc: '허용할 아웃바운드 트래픽 규칙 목록입니다.', children: [
        F('to', 'list-group', 'opt', { desc: '트래픽을 허용할 목적지 목록입니다.', children: [
          F('ipBlock', 'group', 'opt', { desc: 'CIDR 대역 기준으로 목적지를 제한합니다.', children: [
            F('cidr', 'string', 'req', { desc: '허용할 IP 대역입니다.', placeholder: '0.0.0.0/0' }),
          ]}),
        ]}),
        F('ports', 'list-group', 'opt', { desc: '허용할 포트 목록입니다.', children: [
          F('protocol', 'select', 'opt', { desc: '허용할 프로토콜입니다.', options: ['TCP', 'UDP', 'SCTP'] }),
          F('port', 'number', 'opt', { desc: '허용할 포트 번호입니다.' }),
        ]}),
      ]}),
    ]}) ],
  },
  resourcequota: {
    label: 'ResourceQuota', clusterScoped: false,
    desc: '네임스페이스 안에서 사용할 수 있는 리소스 총량을 제한합니다.',
    apiVersion: 'v1', kind: 'ResourceQuota',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: '적용할 리소스 제한을 정의합니다.', children: [
      F('hard', 'map', 'req', { desc: '리소스별 최대 허용치입니다.', }),
      F('scopes', 'list-string', 'opt', { desc: '쿼터가 적용될 범위를 제한합니다.', placeholder: 'BestEffort' }),
    ]}) ],
  },
  limitrange: {
    label: 'LimitRange', clusterScoped: false,
    desc: '네임스페이스 내 각 오브젝트가 사용할 수 있는 리소스의 기본값/최소/최대값을 제한합니다.',
    apiVersion: 'v1', kind: 'LimitRange',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: '적용할 제한 규칙 목록을 정의합니다.', children: [
      F('limits', 'list-group', 'req', { desc: '대상 종류별 제한 규칙입니다.', children: [
        F('type', 'select', 'req', { desc: '제한이 적용될 대상 종류입니다.', options: ['Container', 'Pod', 'PersistentVolumeClaim'], default: 'Container' }),
        F('default', 'map', 'opt', { desc: '값을 지정하지 않았을 때 적용되는 기본 제한(limit)값입니다.' }),
        F('defaultRequest', 'map', 'opt', { desc: '값을 지정하지 않았을 때 적용되는 기본 요청(request)값입니다.' }),
        F('max', 'map', 'opt', { desc: '허용되는 최대값입니다.' }),
        F('min', 'map', 'opt', { desc: '허용되는 최소값입니다.' }),
      ]}),
    ]}) ],
  },
  poddisruptionbudget: {
    label: 'PodDisruptionBudget', clusterScoped: false,
    desc: '자발적 중단(예: 노드 드레인) 상황에서 최소한으로 유지되어야 할 Pod 가용성을 보장합니다.',
    apiVersion: 'policy/v1', kind: 'PodDisruptionBudget',
    fields: [ metadataFields(), F('spec', 'group', 'req', { desc: '허용 가능한 중단 범위를 정의합니다.', children: [
      F('minAvailable', 'string', 'opt', { desc: '항상 유지되어야 하는 최소 Pod 수(또는 비율)입니다.', placeholder: '1' }),
      F('maxUnavailable', 'string', 'opt', { desc: '동시에 중단될 수 있는 최대 Pod 수(또는 비율)입니다.', placeholder: '25%' }),
      selectorField('보호 대상 Pod를 선택하는 라벨 셀렉터입니다.'),
    ]}) ],
  },
  storageclass: {
    label: 'StorageClass', clusterScoped: true,
    desc: '동적 프로비저닝 시 사용할 스토리지의 종류와 정책을 정의합니다.',
    apiVersion: 'storage.k8s.io/v1', kind: 'StorageClass',
    fields: [ metadataFields({ noNamespace: true }),
      F('provisioner', 'string', 'req', { desc: '볼륨을 프로비저닝할 드라이버입니다.', placeholder: 'kubernetes.io/aws-ebs' }),
      F('reclaimPolicy', 'select', 'opt', { desc: 'PVC 삭제 시 실제 볼륨을 어떻게 처리할지 결정합니다.', options: ['Delete', 'Retain'], default: 'Delete' }),
      F('volumeBindingMode', 'select', 'opt', { desc: '볼륨 바인딩 및 프로비저닝 시점을 결정합니다.', options: ['Immediate', 'WaitForFirstConsumer'], default: 'Immediate' }),
      F('allowVolumeExpansion', 'boolean', 'opt', { desc: 'PVC 생성 후 용량 확장을 허용할지 여부입니다.' }),
      F('parameters', 'map', 'opt', { desc: '프로비저너별 추가 파라미터입니다.' }),
    ],
  },
  persistentvolume: {
    label: 'PersistentVolume', clusterScoped: true,
    desc: '클러스터 관리자가 프로비저닝한 실제 스토리지 자원입니다.',
    apiVersion: 'v1', kind: 'PersistentVolume',
    fields: [ metadataFields({ noNamespace: true }), F('spec', 'group', 'req', { desc: '스토리지의 용량과 접근 방식을 정의합니다.', children: [
      F('capacity', 'group', 'req', { desc: '볼륨의 총 용량입니다.', children: [
        F('storage', 'string', 'req', { desc: '볼륨의 총 용량입니다.', placeholder: '10Gi' }),
      ]}),
      F('accessModes', 'list-string', 'req', { desc: '볼륨 접근 모드입니다.', placeholder: 'ReadWriteOnce' }),
      F('persistentVolumeReclaimPolicy', 'select', 'opt', { desc: 'PVC 해제 시 볼륨 처리 정책입니다.', options: ['Retain', 'Delete', 'Recycle'], default: 'Retain' }),
      F('storageClassName', 'string', 'opt', { desc: '이 PV가 속하는 StorageClass의 이름입니다.' }),
      F('hostPath', 'group', 'opt', { desc: '노드의 로컬 경로를 볼륨으로 사용합니다(테스트 용도).', children: [
        F('path', 'string', 'req', { desc: '노드에서 마운트할 디렉터리 경로입니다.', placeholder: '/mnt/data' }),
      ]}),
    ]}) ],
  },
  customresourcedefinition: {
    label: 'CustomResourceDefinition', clusterScoped: true,
    desc: '쿠버네티스 API를 확장해 사용자 정의 리소스 종류를 등록합니다.',
    apiVersion: 'apiextensions.k8s.io/v1', kind: 'CustomResourceDefinition',
    fields: [ metadataFields({ noNamespace: true }), F('spec', 'group', 'req', { desc: '커스텀 리소스의 그룹, 이름, 버전을 정의합니다.', children: [
      F('group', 'string', 'req', { desc: '커스텀 리소스가 속할 API 그룹입니다.', placeholder: 'example.com' }),
      F('scope', 'select', 'req', { desc: '커스텀 리소스가 네임스페이스 범위인지 클러스터 범위인지 결정합니다.', options: ['Namespaced', 'Cluster'], default: 'Namespaced' }),
      F('names', 'group', 'req', { desc: '커스텀 리소스의 이름 규칙입니다.', children: [
        F('plural', 'string', 'req', { desc: 'URL에 사용될 복수형 이름입니다.', placeholder: 'widgets' }),
        F('singular', 'string', 'opt', { desc: '단수형 이름입니다.', placeholder: 'widget' }),
        F('kind', 'string', 'req', { desc: '오브젝트를 참조할 때 사용하는 Kind 이름입니다.', placeholder: 'Widget' }),
        F('shortNames', 'list-string', 'opt', { desc: 'kubectl에서 사용할 축약 이름 목록입니다.', placeholder: 'wd' }),
      ]}),
      F('versions', 'list-group', 'req', { desc: '지원할 API 버전 목록입니다.', children: [
        F('name', 'string', 'req', { desc: '버전 이름입니다.', placeholder: 'v1' }),
        F('served', 'boolean', 'rec', { desc: 'API 서버가 이 버전을 제공할지 여부입니다.', default: true }),
        F('storage', 'boolean', 'rec', { desc: 'etcd에 저장될 때 사용할 버전인지 여부입니다. 정확히 하나만 true여야 합니다.', default: true }),
      ]}),
    ]}) ],
  },
};

var FREQ_ORDER = [
  'pod', 'deployment', 'service', 'configmap', 'secret', 'ingress', 'namespace',
  'persistentvolumeclaim', 'job', 'cronjob', 'statefulset', 'daemonset', 'serviceaccount',
  'horizontalpodautoscaler', 'replicaset', 'role', 'rolebinding', 'clusterrole', 'clusterrolebinding',
  'networkpolicy', 'resourcequota', 'limitrange', 'poddisruptionbudget', 'storageclass',
  'persistentvolume', 'customresourcedefinition',
];
var NAME_ORDER = Object.keys(OBJECTS).slice().sort(function (a, b) {
  return OBJECTS[a].label.localeCompare(OBJECTS[b].label);
});

var TYPE_LABEL = {
  string: 'string', number: 'number', boolean: 'boolean', select: 'enum',
  map: 'map', 'list-string': 'list<string>', group: 'object', 'list-group': 'list',
};
var LEVEL_LABEL = { req: '필수', rec: '권장', opt: '선택' };

/* =========================================================
   3. 상태 트리
   ========================================================= */
function makeGroupChildren(fields) {
  var children = {};
  for (var i = 0; i < fields.length; i++) children[fields[i].key] = createState(fields[i]);
  return { children: children };
}

function createState(field) {
  switch (field.type) {
    case 'group':
      return { included: field.level !== 'opt', uiCollapsed: false, children: (function () {
        var c = {};
        for (var i = 0; i < field.children.length; i++) c[field.children[i].key] = createState(field.children[i]);
        return c;
      })() };
    case 'list-group':
      return { included: field.level !== 'opt', uiCollapsed: false, items: field.level === 'req' ? [makeGroupChildren(field.children)] : [] };
    case 'map':
      return { included: field.level !== 'opt', entries: field.level === 'req' ? [{ key: '', value: '' }] : [] };
    case 'list-string':
      return { included: field.level !== 'opt', items: field.level === 'req' ? [''] : [] };
    case 'boolean':
      return { included: field.level !== 'opt', value: field.default === undefined ? false : field.default };
    default: // string, number, select
      return { included: field.level !== 'opt', value: field.default === undefined ? '' : field.default };
  }
}

function setAllCollapsed(fields, stateChildren, val) {
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i], st = stateChildren[f.key];
    if (f.type === 'group') {
      st.uiCollapsed = val;
      setAllCollapsed(f.children, st.children, val);
    } else if (f.type === 'list-group') {
      st.uiCollapsed = val;
      for (var j = 0; j < st.items.length; j++) setAllCollapsed(f.children, st.items[j].children, val);
    }
  }
}

/* =========================================================
   4. YAML 직렬화
   ========================================================= */
function needsQuote(v) {
  if (v === '') return false;
  if (/^(true|false|null|~)$/i.test(v)) return true;
  if (/^-?\d+(\.\d+)?$/.test(v)) return true;
  if (/[:#{}\[\],&*!|>'"%@`]/.test(v)) return true;
  if (/^\s|\s$/.test(v)) return true;
  return false;
}
function quoteIfNeeded(v) {
  return needsQuote(v) ? JSON.stringify(v) : v;
}
function formatScalar(f, v) {
  if (f.type === 'number') return String(v);
  return quoteIfNeeded(String(v));
}

function buildFieldLines(fields, stateChildren, indent, ctx) {
  var lines = [];
  var pad = '  '.repeat(indent);
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    var st = stateChildren[f.key];
    if (!st || !st.included) continue;

    if (f.type === 'string' || f.type === 'number') {
      var v = st.value;
      if ((v === '' || v === null || v === undefined) && f.key === 'namespace' && ctx && ctx.namespaceDefault) {
        v = ctx.namespaceDefault;
      }
      if (v === '' || v === null || v === undefined) continue;
      lines.push(pad + f.key + ': ' + formatScalar(f, v));
    } else if (f.type === 'boolean') {
      lines.push(pad + f.key + ': ' + (st.value ? 'true' : 'false'));
    } else if (f.type === 'select') {
      if (!st.value) continue;
      lines.push(pad + f.key + ': ' + st.value);
    } else if (f.type === 'map') {
      var entries = st.entries.filter(function (e) { return e.key.trim() !== ''; });
      if (!entries.length) continue;
      lines.push(pad + f.key + ':');
      for (var e = 0; e < entries.length; e++) {
        var ent = entries[e];
        var val = ent.value === '' ? '""' : quoteIfNeeded(ent.value);
        lines.push(pad + '  ' + quoteIfNeeded(ent.key) + ': ' + val);
      }
    } else if (f.type === 'list-string') {
      var items = st.items.filter(function (s) { return s.trim() !== ''; });
      if (!items.length) continue;
      lines.push(pad + f.key + ':');
      for (var s = 0; s < items.length; s++) lines.push(pad + '- ' + quoteIfNeeded(items[s]));
    } else if (f.type === 'group') {
      var inner = buildFieldLines(f.children, st.children, indent + 1, ctx);
      if (!inner.length) continue;
      lines.push(pad + f.key + ':');
      lines.push.apply(lines, inner);
    } else if (f.type === 'list-group') {
      if (!st.items || !st.items.length) continue;
      var block = [];
      for (var it = 0; it < st.items.length; it++) {
        var itemInner = buildFieldLines(f.children, st.items[it].children, indent + 1, ctx);
        if (!itemInner.length) continue;
        var firstPrefix = pad + '  ';
        var first = itemInner[0].indexOf(firstPrefix) === 0 ? itemInner[0].slice(firstPrefix.length) : itemInner[0];
        block.push(pad + '- ' + first);
        for (var k = 1; k < itemInner.length; k++) block.push(itemInner[k]);
      }
      if (!block.length) continue;
      lines.push(pad + f.key + ':');
      lines.push.apply(lines, block);
    }
  }
  return lines;
}

function generateYAML() {
  var obj = OBJECTS[currentKey];
  var ctx = { namespaceDefault: namespaceInputValue.trim() };
  var lines = ['apiVersion: ' + obj.apiVersion, 'kind: ' + obj.kind];
  lines.push.apply(lines, buildFieldLines(obj.fields, state.children, 0, ctx));
  return lines.join('\n');
}

/* =========================================================
   5. YAML 문법 하이라이팅
   ========================================================= */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function renderIndentGuides(indent) {
  var out = '';
  var i = 0;
  for (; i + 2 <= indent.length; i += 2) {
    out += '<span class="ind">  </span>';
  }
  if (i < indent.length) out += esc(indent.slice(i));
  return out;
}
function highlightLine(line) {
  var indentMatch = line.match(/^(\s*)/);
  var indent = indentMatch[1];
  var rest = line.slice(indent.length);
  var out = renderIndentGuides(indent);
  if (rest === '') return out;
  if (rest.slice(0, 2) === '- ') {
    out += '<span class="yc">-</span> ';
    rest = rest.slice(2);
  } else if (rest === '-') {
    return out + '<span class="yc">-</span>';
  }
  if (rest === '') return out;
  var sepIdx = rest.indexOf(': ');
  var isBareColon = false;
  if (sepIdx === -1 && rest.charAt(rest.length - 1) === ':') { sepIdx = rest.length - 1; isBareColon = true; }
  if (sepIdx !== -1) {
    var key = rest.slice(0, sepIdx);
    var value = isBareColon ? '' : rest.slice(sepIdx + 2);
    out += '<span class="yk">' + esc(key) + '</span>:';
    if (value !== '') out += ' <span class="yv">' + esc(value) + '</span>';
    return out;
  }
  out += '<span class="yv">' + esc(rest) + '</span>';
  return out;
}
function highlightYAML(text) {
  return text.split('\n').map(highlightLine).join('\n');
}

/* =========================================================
   6. 렌더링
   ========================================================= */
var currentKey = FREQ_ORDER[0];
var sortMode = 'freq';
var namespaceInputValue = '';
var state = null;
var lastYamlText = '';

function selectObject(key) {
  currentKey = key;
  state = makeGroupChildren(OBJECTS[key].fields);
  renderSidebar();
  renderTree();
  renderYAML();
}

function renderSidebar() {
  var listEl = document.getElementById('objList');
  listEl.innerHTML = '';
  var order = sortMode === 'freq' ? FREQ_ORDER : NAME_ORDER;
  order.forEach(function (key, idx) {
    var obj = OBJECTS[key];
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'obj-btn' + (key === currentKey ? ' active' : '');
    var idxSpan = document.createElement('span');
    idxSpan.className = 'obj-idx';
    idxSpan.textContent = String(idx + 1);
    var labelSpan = document.createElement('span');
    labelSpan.className = 'obj-label';
    labelSpan.textContent = obj.label;
    btn.appendChild(idxSpan);
    btn.appendChild(labelSpan);
    btn.addEventListener('click', function () { selectObject(key); });
    listEl.appendChild(btn);
  });
}

function renderTree() {
  var obj = OBJECTS[currentKey];
  document.getElementById('objTitle').textContent = obj.label;
  document.getElementById('objDesc').textContent = obj.desc;
  var scopeNote = document.getElementById('scopeNote');
  scopeNote.innerHTML = obj.clusterScoped ? '<span class="scope-note">클러스터 범위 오브젝트 (네임스페이스 없음)</span>' : '';

  var root = document.getElementById('treeRoot');
  root.innerHTML = '';
  var fieldsRoot = document.createElement('div');
  fieldsRoot.className = 'fields-root';
  for (var i = 0; i < obj.fields.length; i++) {
    fieldsRoot.appendChild(renderNode(obj.fields[i], state.children[obj.fields[i].key], 0));
  }
  root.appendChild(fieldsRoot);
}

function renderNode(field, st, depth) {
  var wrap = document.createElement('div');
  wrap.className = 'node lvl-' + depth;
  if (depth > 0) wrap.style.marginLeft = '18px';

  var row = document.createElement('div');
  row.className = 'node-row';

  if (field.type === 'group' || field.type === 'list-group') {
    var icon = document.createElement('button');
    icon.type = 'button';
    icon.className = 'icon-toggle';
    icon.textContent = st.uiCollapsed ? '+' : String.fromCharCode(8722);
    icon.title = st.uiCollapsed ? '펼치기' : '접기';
    icon.addEventListener('click', function () { st.uiCollapsed = !st.uiCollapsed; renderTree(); });
    row.appendChild(icon);
  } else {
    var spacer = document.createElement('span');
    spacer.className = 'icon-spacer';
    row.appendChild(spacer);
  }

  var cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'field-include';
  cb.checked = st.included;
  cb.disabled = field.level === 'req';
  cb.addEventListener('change', function () { st.included = cb.checked; renderTree(); renderYAML(); });
  row.appendChild(cb);

  var nameSpan = document.createElement('span');
  nameSpan.className = 'field-name';
  nameSpan.textContent = field.key;
  row.appendChild(nameSpan);

  var badge = document.createElement('span');
  badge.className = 'badge badge-' + field.level;
  badge.textContent = LEVEL_LABEL[field.level];
  row.appendChild(badge);

  var typeTag = document.createElement('span');
  typeTag.className = 'type-tag';
  typeTag.textContent = TYPE_LABEL[field.type];
  row.appendChild(typeTag);

  wrap.appendChild(row);

  if (field.desc) {
    var descEl = document.createElement('div');
    descEl.className = 'field-desc';
    descEl.textContent = field.desc;
    wrap.appendChild(descEl);
  }

  if (st.included) {
    var controlWrap = document.createElement('div');
    controlWrap.className = 'field-control';
    controlWrap.appendChild(renderControl(field, st, depth));
    wrap.appendChild(controlWrap);
  }

  return wrap;
}

function renderControl(field, st, depth) {
  switch (field.type) {
    case 'string':
    case 'number': {
      var input = document.createElement('input');
      input.type = field.type === 'number' ? 'number' : 'text';
      input.className = 'text-input';
      input.placeholder = field.placeholder || '';
      input.value = st.value;
      input.addEventListener('input', function () { st.value = input.value; renderYAML(); });
      return input;
    }
    case 'boolean': {
      var label = document.createElement('label');
      label.className = 'bool-label';
      var bInput = document.createElement('input');
      bInput.type = 'checkbox';
      bInput.checked = !!st.value;
      bInput.addEventListener('change', function () { st.value = bInput.checked; renderYAML(); });
      label.appendChild(bInput);
      label.appendChild(document.createTextNode('true'));
      return label;
    }
    case 'select': {
      var select = document.createElement('select');
      select.className = 'value-select';
      var emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = '(선택 안 함)';
      select.appendChild(emptyOpt);
      (field.options || []).forEach(function (opt) {
        var o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        select.appendChild(o);
      });
      select.value = st.value || '';
      select.addEventListener('change', function () { st.value = select.value; renderYAML(); });
      return select;
    }
    case 'map': {
      var box = document.createElement('div');
      box.className = 'map-box';
      st.entries.forEach(function (entry, idx) {
        var row = document.createElement('div');
        row.className = 'map-row';
        var kInput = document.createElement('input');
        kInput.type = 'text'; kInput.placeholder = 'key'; kInput.value = entry.key;
        kInput.addEventListener('input', function () { entry.key = kInput.value; renderYAML(); });
        var vInput = document.createElement('input');
        vInput.type = 'text'; vInput.placeholder = 'value'; vInput.value = entry.value;
        vInput.addEventListener('input', function () { entry.value = vInput.value; renderYAML(); });
        var delBtn = document.createElement('button');
        delBtn.type = 'button'; delBtn.className = 'del-btn'; delBtn.textContent = '삭제';
        delBtn.addEventListener('click', function () { st.entries.splice(idx, 1); renderTree(); renderYAML(); });
        row.appendChild(kInput); row.appendChild(vInput); row.appendChild(delBtn);
        box.appendChild(row);
      });
      var addBtn = document.createElement('button');
      addBtn.type = 'button'; addBtn.className = 'add-btn'; addBtn.textContent = '+ 항목 추가';
      addBtn.addEventListener('click', function () { st.entries.push({ key: '', value: '' }); renderTree(); renderYAML(); });
      box.appendChild(addBtn);
      return box;
    }
    case 'list-string': {
      var lbox = document.createElement('div');
      lbox.className = 'list-box';
      st.items.forEach(function (val, idx) {
        var row = document.createElement('div');
        row.className = 'list-row';
        var vInput = document.createElement('input');
        vInput.type = 'text'; vInput.placeholder = field.placeholder || ''; vInput.value = val;
        vInput.addEventListener('input', function () { st.items[idx] = vInput.value; renderYAML(); });
        var delBtn = document.createElement('button');
        delBtn.type = 'button'; delBtn.className = 'del-btn'; delBtn.textContent = '삭제';
        delBtn.addEventListener('click', function () { st.items.splice(idx, 1); renderTree(); renderYAML(); });
        row.appendChild(vInput); row.appendChild(delBtn);
        lbox.appendChild(row);
      });
      var laddBtn = document.createElement('button');
      laddBtn.type = 'button'; laddBtn.className = 'add-btn'; laddBtn.textContent = '+ 항목 추가';
      laddBtn.addEventListener('click', function () { st.items.push(''); renderTree(); renderYAML(); });
      lbox.appendChild(laddBtn);
      return lbox;
    }
    case 'group': {
      var gbox = document.createElement('div');
      gbox.className = 'group-box';
      if (!st.uiCollapsed) {
        field.children.forEach(function (c) {
          gbox.appendChild(renderNode(c, st.children[c.key], depth + 1));
        });
      }
      return gbox;
    }
    case 'list-group': {
      var lgbox = document.createElement('div');
      lgbox.className = 'list-group-box';
      if (!st.uiCollapsed) {
        st.items.forEach(function (item, idx) {
          var card = document.createElement('div');
          card.className = 'item-card';
          var head = document.createElement('div');
          head.className = 'item-card-head';
          var title = document.createElement('span');
          title.textContent = '#' + (idx + 1);
          var delBtn = document.createElement('button');
          delBtn.type = 'button'; delBtn.className = 'del-btn'; delBtn.textContent = '삭제';
          delBtn.addEventListener('click', function () { st.items.splice(idx, 1); renderTree(); renderYAML(); });
          head.appendChild(title); head.appendChild(delBtn);
          card.appendChild(head);
          field.children.forEach(function (c) {
            card.appendChild(renderNode(c, item.children[c.key], depth + 1));
          });
          lgbox.appendChild(card);
        });
      }
      var addItemBtn = document.createElement('button');
      addItemBtn.type = 'button'; addItemBtn.className = 'add-btn'; addItemBtn.textContent = '+ 항목 추가';
      addItemBtn.addEventListener('click', function () { st.items.push(makeGroupChildren(field.children)); renderTree(); renderYAML(); });
      lgbox.appendChild(addItemBtn);
      return lgbox;
    }
  }
}

function renderYAML() {
  var obj = OBJECTS[currentKey];
  document.getElementById('yamlFileName').textContent = obj.kind + '.yaml';
  var text = generateYAML();
  lastYamlText = text;
  document.getElementById('yamlOutput').innerHTML = highlightYAML(text);
}

/* =========================================================
   7. 이벤트 바인딩 & 초기화
   ========================================================= */
document.getElementById('namespaceInput').addEventListener('input', function (e) {
  namespaceInputValue = e.target.value;
  renderYAML();
});
document.getElementById('sortSelect').addEventListener('change', function (e) {
  sortMode = e.target.value;
  renderSidebar();
});
document.getElementById('expandAllBtn').addEventListener('click', function () {
  setAllCollapsed(OBJECTS[currentKey].fields, state.children, false);
  renderTree();
});
document.getElementById('collapseAllBtn').addEventListener('click', function () {
  setAllCollapsed(OBJECTS[currentKey].fields, state.children, true);
  renderTree();
});
document.getElementById('copyBtn').addEventListener('click', function () {
  var btn = document.getElementById('copyBtn');
  navigator.clipboard.writeText(lastYamlText).then(function () {
    var orig = btn.textContent;
    btn.textContent = '복사됨';
    setTimeout(function () { btn.textContent = orig; }, 1200);
  });
});

selectObject(currentKey);

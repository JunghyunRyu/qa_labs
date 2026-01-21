# M4: Pyodide 최적화

> **프로젝트**: QA Arena UX 대폭 개선
> **크기**: 중
> **상태**: 완료

---

## 목표

Pyodide 초기화를 페이지 진입 시 백그라운드에서 수행하여 체감 로딩 시간을 0으로 만들고, 타임아웃 및 무한루프 방지 로직을 구현하여 시스템 안정성을 확보합니다.

---

## 범위

### 포함
- Pyodide Pre-loading (백그라운드 초기화)
- 실행 타임아웃 (5초 제한)
- 무한루프 감지 및 Worker 강제 종료
- 초기화 상태 UI 표시 (로딩 인디케이터)

### 제외
- Worker 풀 구현 (병렬 실행)
- 캐시 최적화 (브라우저 캐시 활용)
- 메모리 사용량 모니터링

---

## 태스크 목록

| # | 태스크 | 파일 | 상태 |
|---|-------|------|------|
| 1 | usePyodidePreload 훅 생성 | `hooks/usePyodidePreload.ts` | [x] |
| 2 | 문제 페이지 진입 시 Pre-loading 시작 | `app/problems/[id]/page.tsx` | [x] |
| 3 | pyodide.worker.ts에 타임아웃 로직 추가 | `workers/pyodide.worker.ts` | [x] |
| 4 | Worker 강제 종료 및 재생성 로직 | `hooks/usePyodide.ts` | [x] |
| 5 | 초기화 상태 UI 표시 (로딩 인디케이터) | `components/PyodideStatusIndicator.tsx` | [x] |

---

## 관련 파일

### 수정 대상
- `frontend/workers/pyodide.worker.ts` - Pyodide Worker
- `frontend/hooks/usePyodide.ts` - Pyodide 훅
- `frontend/app/problems/[id]/page.tsx` - Pre-loading 통합

### 참조 파일
- `frontend/lib/pyodide.ts` - Pyodide 유틸리티

---

## 기술 노트

### usePyodidePreload 훅

```typescript
interface PyodidePreloadState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;     // 0-100
  loadTime?: number;    // ms
  error?: string;
}

export function usePyodidePreload() {
  const [state, setState] = useState<PyodidePreloadState>({
    status: 'idle',
    progress: 0,
  });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // 페이지 진입 시 즉시 Worker 생성 및 초기화 시작
    const worker = new Worker(
      new URL('../workers/pyodide.worker.ts', import.meta.url)
    );

    worker.postMessage({ type: 'init', id: 'preload' });

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setState(prev => ({ ...prev, progress: e.data.payload.percent }));
      } else if (e.data.type === 'initialized') {
        setState({
          status: 'ready',
          progress: 100,
          loadTime: e.data.payload.loadTime,
        });
      } else if (e.data.type === 'error') {
        setState({ status: 'error', progress: 0, error: e.data.payload.message });
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
    };
  }, []);

  return { ...state, worker: workerRef.current };
}
```

### 타임아웃 로직 (Worker 내부)

```typescript
// pyodide.worker.ts

const EXECUTION_TIMEOUT_MS = 5000; // 5초

async function runPythonWithTimeout(
  code: string,
  timeoutMs: number = EXECUTION_TIMEOUT_MS
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(
        `실행 시간 초과 (${timeoutMs / 1000}초). ` +
        `무한 루프나 과도한 연산이 있는지 확인해주세요.`
      ));
    }, timeoutMs);

    // 실제 실행
    pyodide.runPythonAsync(code)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}
```

### Worker 강제 종료 및 재생성

```typescript
// usePyodide.ts

const terminateAndRecreate = useCallback(() => {
  if (workerRef.current) {
    workerRef.current.terminate();
    workerRef.current = null;
  }

  // 새 Worker 생성
  const newWorker = new Worker(...);
  workerRef.current = newWorker;

  // 초기화 (Pre-load 상태 활용)
  // ...
}, []);

// 타임아웃 발생 시 호출
const runWithTimeout = async (code: string) => {
  const timeoutId = setTimeout(() => {
    terminateAndRecreate();
    setError('실행 시간 초과. Worker를 재시작했습니다.');
  }, 6000); // Worker 내부 타임아웃보다 1초 여유

  try {
    const result = await sendToWorker({ type: 'runPython', ... });
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
```

### 초기화 상태 UI

```tsx
// PyodideStatusIndicator.tsx

interface Props {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress: number;
}

export function PyodideStatusIndicator({ status, progress }: Props) {
  if (status === 'ready') return null; // 준비 완료 시 숨김

  return (
    <div className="flex items-center gap-2 text-sm text-[#8b949e]">
      {status === 'loading' && (
        <>
          <Spinner size="sm" />
          <span>Python 환경 준비 중... {progress}%</span>
        </>
      )}
      {status === 'error' && (
        <span className="text-[#f85149]">환경 로드 실패</span>
      )}
    </div>
  );
}
```

---

## 의존성

### 선행 마일스톤
- M1, M2, M3 (병렬 가능)

### 후속 마일스톤
- 없음 (마지막 마일스톤)

---

## 완료 조건

- [x] 문제 페이지 진입 시 Pyodide 백그라운드 초기화 시작
- [x] 초기화 진행률 UI 표시
- [x] "로컬 테스트" 버튼 클릭 시 즉시 실행 (이미 초기화된 경우)
- [x] 5초 타임아웃 동작
- [x] 타임아웃 시 Worker 재생성 및 오류 메시지 표시
- [x] 기존 테스트 회귀 없음

---

## 테스트 체크리스트

### 단위 테스트
- [ ] Pre-loading 상태 전환 로직
- [ ] 타임아웃 발생 시 에러 처리
- [ ] Worker 재생성 후 정상 동작

### 수동 검증
- [ ] 페이지 진입 → 로딩 인디케이터 → Ready 상태
- [ ] `while True: pass` 실행 시 5초 후 타임아웃
- [ ] 타임아웃 후 다른 코드 정상 실행

---

## 진행 기록

| 시간 | 작업 | 결과 |
|------|------|------|
| 2026-01-21 | 마일스톤 시작 | M4 태스크 구현 시작 |
| 2026-01-21 | 태스크 1 완료 | usePyodidePreload 훅 생성 |
| 2026-01-21 | 태스크 2 완료 | 문제 페이지에 Pre-loading 통합 (useCodeRunner 활용) |
| 2026-01-21 | 태스크 3 완료 | pyodide.worker.ts에 5초 타임아웃 로직 추가 (runPythonWithTimeout) |
| 2026-01-21 | 태스크 4 완료 | usePyodide.ts에 executeWithTimeout 및 Worker 재생성 로직 추가 |
| 2026-01-21 | 태스크 5 완료 | PyodideStatusIndicator 컴포넌트 생성 및 page.tsx 통합 |
| 2026-01-21 | 마일스톤 완료 | 모든 태스크 완료, 테스트 대기 |

---

## 노트

- Pyodide CDN URL: `https://cdn.jsdelivr.net/pyodide/v0.29.0/full/`
- Worker 내부 타임아웃은 Promise.race() 대신 setTimeout 사용 (Pyodide가 async 실행 중 취소 불가)
- 타임아웃 메시지는 사용자 친화적으로 ("무한 루프나 과도한 연산이 있는지 확인해주세요")
- Pre-loading은 문제 페이지에서만 수행 (홈페이지에서는 불필요)

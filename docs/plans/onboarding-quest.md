# Onboarding Quest: Rookie 탈출 시나리오

> **상태**: 계획됨 (TODO)
> **우선순위**: Medium
> **예상 작업량**: 2-3일

---

## 배경

"회원가입 즉시 승급"보다 **"아주 작은 노력에 대한 확실한 즉시 보상"**이 사용자의 도파민을 더 크게 자극함 (Gamification 이론).

**핵심 아이디어**: 가입 축하가 아니라 **"입단 테스트(Tutorial) 통과"**라는 명분을 주는 것.

---

## 변경된 랭크 시스템 (초반부)

| Level | 이름 | 조건 | 비고 |
|-------|------|------|------|
| 0 | Visitor/Trainee | 가입 직후 | 아무것도 증명되지 않음 |
| 1 | Rookie | 튜토리얼 1문제 해결 | +50 토큰 Welcome Gift |
| 2 | Junior SDET | 문제 5개 해결 | 기존과 동일 |

---

## UX 시나리오

### Step 1. 가입 직후 (메인 대시보드)

텅 빈 대시보드 대신 **"긴급 미션"** 표시:

```
[입단 테스트]
QA Arena에 오신 것을 환영합니다.
"정식 요원(Rookie)으로 활동하려면 테스트 자격 증명이 필요합니다.
지금 바로 간단한 버그를 잡고 라이선스를 획득하세요!"

[테스트 시작하기]
```

### Step 2. 문제 풀이 (Tutorial)

- 아주 쉬운 Easy 문제 (예: 정수 덧셈기)
- 이미 정답 코드가 적혀있고, "제출" 버튼만 누르면 되는 수준
- **성공 경험 주입**이 목적

### Step 3. 승급 연출 (The "Wow" Moment)

테스트 통과 시 **화려한 모달**:

- 화면 전체에 컨페티(Confetti) 효과
- 문구:
  ```
  🎉 승급을 축하합니다!
  Guest ➔ 🌱 Rookie
  "이제 정식으로 QA Arena의 미션을 수행할 수 있습니다."
  보상: 💰 50 토큰 지급됨
  ```
- 액션: [내 명찰(프로필) 확인하기]

---

## 구현 가이드

### 1. 추천 방식 (쉬운 구현)

시스템 복잡도를 낮추기 위해:

- **가입 시**: DB상 Rookie (기본)
- **UI 트릭**: 화면에는 🌱 수습생(Trainee)으로 표시
- **첫 문제 해결 시**:
  - DB 업데이트 없이 UI에서만 ✨ Rookie (정식)으로 변경 연출
  - Welcome Token 트랜잭션 생성 (+50 토큰)

### 2. LevelUpModal 컴포넌트

```typescript
// components/LevelUpModal.tsx (개념)
export default function LevelUpModal({ rank, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-amber-500/50 p-8 rounded-2xl flex flex-col items-center gap-6 animate-bounce-in">
        <LottieAnimation name="confetti" /> {/* 폭죽 효과 */}

        <div className="text-4xl">🎉</div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Level Up!</h2>
          <p className="text-slate-400">당신의 등급이 상승했습니다.</p>
        </div>

        <div className="flex items-center gap-4 text-xl font-bold">
           <span className="text-slate-600 line-through">Trainee</span>
           <span>→</span>
           <span className="text-emerald-400">Rookie</span>
        </div>

        <Button onClick={onClose}>멋지네요!</Button>
      </div>
    </div>
  );
}
```

### 3. 필요한 작업

- [ ] 튜토리얼 문제 생성 (매우 쉬운 Easy 문제)
- [ ] LevelUpModal 컴포넌트 구현
- [ ] Confetti/Lottie 애니메이션 추가
- [ ] 첫 문제 해결 감지 로직
- [ ] Welcome Token 지급 로직
- [ ] 대시보드 "긴급 미션" UI 추가
- [ ] rank.ts에 Trainee 레벨 추가 (UI 전용)

---

## 핵심 원칙

> "공짜 점심은 없다(No Free Lunch)"는 인식을 심어주되, "밥상은 차려져 있다"는 느낌을 주십시오.

가입하자마자 "Rookie"가 되는 것보다, **"버튼 하나 눌러서(튜토리얼) Rookie를 쟁취"**하게 만드는 것이 사용자의 애착(Ownership)을 훨씬 높여줍니다.

이것이 바로 **"첫 번째 성취감(First Victory)"** 설계입니다.

---

## 참고

- Gamification 이론: 작은 노력 + 즉시 보상 = 도파민 분비
- 게임 튜토리얼 디자인 패턴
- 현재 랭크 시스템: `frontend/lib/rank.ts`

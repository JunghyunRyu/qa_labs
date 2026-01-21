# M2: 리다이렉트 로직 수정

> **상태**: ✅ 완료
> **예상 크기**: 소 (~30줄)
> **실제 크기**: ~10줄 변경

---

## 목표

로그인 콜백에서 온보딩 문제로 리다이렉트하도록 수정

---

## 태스크

### 2.1 신규 사용자 리다이렉트 수정
- [x] `handleAcceptTerms` 수정
- [x] `/problems?welcome=true` → `/problems/problem-ve03?onboarding=new`

### 2.2 기존 사용자 리다이렉트 수정
- [x] `handleCallback` 수정
- [x] sessionStorage.auth_redirect가 없는 경우만
- [x] `/` → `/problems/problem-ve03?onboarding=returning`

---

## 파일 변경

- `frontend/app/auth/callback/page.tsx`

---

## 완료 조건

- [x] 신규 가입자: 약관 동의 → VE03 + `?onboarding=new`
- [x] 기존 사용자 (redirect 없음): VE03 + `?onboarding=returning`
- [x] 재방문 사용자 (redirect 있음): 기존 동작 유지

---

## 구현 내용

**변경 포인트**:

1. **신규 사용자** (61-63줄):
   ```typescript
   // 기존: router.push("/problems?welcome=true");
   router.push("/problems/problem-ve03?onboarding=new");
   ```

2. **기존 사용자** (40-45줄):
   ```typescript
   const savedRedirect = sessionStorage.getItem("auth_redirect");
   // redirect가 없으면 온보딩 문제로 이동
   const destination = savedRedirect || "/problems/problem-ve03?onboarding=returning";
   ```

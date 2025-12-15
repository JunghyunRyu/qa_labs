# --- 빌드 단계 ---
    FROM node:20-alpine AS builder

    WORKDIR /app

    # 빌드 인자 받기 (Next.js는 빌드 시점에 NEXT_PUBLIC_* 환경 변수를 번들에 포함)
    ARG NEXT_PUBLIC_API_URL=/api
    ARG NEXT_PUBLIC_SENTRY_DSN=
    ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}

    # 패키지 정보 먼저 복사 후 설치
    COPY package.json package-lock.json ./
    RUN npm ci --legacy-peer-deps

    # 나머지 소스 복사
    COPY . .

    # Next.js 프로덕션 빌드 (Alpine 권한 이슈 우회)
    RUN npx next build
    
    # --- 실행 단계 ---
    FROM node:20-alpine AS runner

    WORKDIR /app
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1

    # standalone 서버 복사
    COPY --from=builder /app/.next/standalone ./
    # static 파일 복사 (standalone/.next/static 위치에)
    COPY --from=builder /app/.next/static ./.next/static
    # public 폴더 복사 (standalone/public 위치에)
    COPY --from=builder /app/public ./public

    EXPOSE 3000

    # standalone 서버 직접 실행
    CMD ["node", "server.js"]
    
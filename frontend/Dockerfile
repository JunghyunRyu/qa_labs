# --- 빌드 단계 ---
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    # 패키지 정보 먼저 복사 후 설치
    COPY package.json package-lock.json ./
    RUN npm ci
    
    # 나머지 소스 복사
    COPY . .
    
    # Next.js 프로덕션 빌드
    RUN npm run build
    
    # --- 실행 단계 ---
    FROM node:20-alpine AS runner
    
    WORKDIR /app
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # 빌드 결과물만 복사
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/next.config.* ./
    
    EXPOSE 3000
    
    # 프로덕션 서버 실행 (package.json의 "start" 스크립트 사용)
    CMD ["npm", "start"]
    
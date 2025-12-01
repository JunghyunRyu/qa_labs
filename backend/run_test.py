"""Quick test script that writes results to file."""
import sys
import json

# 결과를 파일에 기록 (절대 경로 사용)
import os
script_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(script_dir, "test_output.log")

def log(message):
    with open(output_file, "a", encoding="utf-8") as f:
        f.write(message + "\n")
    print(message)

# 파일 초기화
with open(output_file, "w", encoding="utf-8") as f:
    f.write("=" * 60 + "\n")
    f.write("GPT-5.1 LLM 테스트 시작\n")
    f.write("=" * 60 + "\n\n")

try:
    log("1. LLM 클라이언트 가져오기...")
    from app.core.llm_client import llm_client
    
    log(f"   - 기본 모델: {llm_client.model}")
    log(f"   - Reasoning 모델: {llm_client.reasoning_model}")
    log(f"   - Reasoning Effort: {llm_client.reasoning_effort}")
    
    if llm_client.client:
        log("[OK] LLM 클라이언트 초기화 성공")
    else:
        log("[ERROR] LLM 클라이언트 없음 - OPENAI_API_KEY 확인 필요")
        sys.exit(1)
    
    log("\n2. GPT-5.1 기본 호출 테스트 (reasoning=none)...")
    response = llm_client.generate_completion(
        system_prompt="You are a helpful assistant.",
        user_prompt="Say 'Hello' in one word.",
        reasoning_effort="none",  # 빠른 응답
    )
    log(f"[OK] 응답: {response[:100]}")
    
    log("\n3. GPT-5.1 Responses API 테스트...")
    try:
        response = llm_client.generate_with_reasoning(
            system_prompt="You are a helpful assistant.",
            user_prompt="What is 2 + 2? Answer briefly.",
            reasoning_effort="low",
        )
        log(f"[OK] Reasoning 응답: {response[:100]}")
    except Exception as e:
        log(f"[WARNING] Reasoning API 에러 (fallback 가능): {e}")
    
    log("\n" + "=" * 60)
    log("테스트 완료!")
    log("=" * 60)

except Exception as e:
    log(f"\n[ERROR] 테스트 실패: {e}")
    import traceback
    log(traceback.format_exc())
    sys.exit(1)


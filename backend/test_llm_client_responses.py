"""Test updated LLM client with Responses API"""
import sys
sys.path.insert(0, '.')

from app.core.llm_client import llm_client
import json

print("Testing updated LLM client with Responses API...")
print("=" * 80)

# Test 1: Simple text generation
print("\n[Test 1] Simple text generation with Responses API:")
try:
    response = llm_client.generate_with_responses_api(
        system_prompt="You are a helpful assistant.",
        user_prompt="Say hello in one sentence.",
    )
    print(f"[SUCCESS] Response: {response}")
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)

# Test 2: JSON generation
print("\n[Test 2] JSON generation with Responses API:")
try:
    response = llm_client.generate_json_with_responses_api(
        system_prompt="You are a helpful assistant. Return JSON only.",
        user_prompt='Generate JSON with fields: summary (string), items (array of 2 strings)',
    )
    print(f"[SUCCESS] Response type: {type(response)}")
    print(f"Response: {json.dumps(response, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)

# Test 3: JSON generation with reasoning (GPT-5.1)
print("\n[Test 3] JSON generation with reasoning (GPT-5.1):")
try:
    response = llm_client.generate_json_with_responses_api(
        system_prompt="You are a QA coach. Provide feedback in JSON format only.",
        user_prompt='''Provide feedback on this test code:
```python
def test_example():
    assert 1 + 1 == 2
```

Return JSON with fields:
- summary: string
- strengths: array of strings (at least 1)
- weaknesses: array of strings (at least 1)
- suggested_tests: array of strings (at least 2)
- score_adjustment: integer (default 0)
''',
        reasoning_effort="medium",
    )
    print(f"[SUCCESS] Response type: {type(response)}")
    print(f"Response: {json.dumps(response, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"[ERROR] {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("\n[DONE] All tests completed!")

"""Test OpenAI Responses API"""
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

print("Testing Responses API...")
print("-" * 80)

try:
    # Test 1: Simple text response
    print("\n[Test 1] Simple text response:")
    response = client.responses.create(
        model="gpt-4o",
        input="Hello, how are you?",
    )

    print(f"Type: {type(response)}")
    print(f"Response object: {response}")
    print(f"Dir: {[attr for attr in dir(response) if not attr.startswith('_')]}")

except Exception as e:
    print(f"Error in Test 1: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)

try:
    # Test 2: Response with instructions (like system prompt)
    print("\n[Test 2] Response with instructions:")
    response = client.responses.create(
        model="gpt-4o",
        instructions="You are a helpful QA coach. Respond in JSON format.",
        input='Return JSON: {"test": true, "message": "Hello"}',
    )

    print(f"Type: {type(response)}")
    print(f"Response object: {response}")

except Exception as e:
    print(f"Error in Test 2: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)

try:
    # Test 3: Using gpt-5.1 (reasoning model)
    print("\n[Test 3] Using gpt-5.1 reasoning model:")
    response = client.responses.create(
        model="gpt-5.1",
        instructions="You are a helpful assistant. Return JSON only.",
        input='Generate JSON with fields: summary, items (array)',
        reasoning={"effort": "medium"},
    )

    print(f"Type: {type(response)}")
    print(f"Response: {response}")

except Exception as e:
    print(f"Error in Test 3: {e}")
    import traceback
    traceback.print_exc()

print("\nDone!")

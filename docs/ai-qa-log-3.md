# [AI QA Log #3] LLM + pytest로 QA 코딩 테스트 문제 자동 생성하기

> 이 글은 회사 업무와는 완전히 별개로 진행 중인  
> **개인 학습용 AI · 테스트 자동화 프로젝트**의 일부를 정리한 기록입니다.  
> 이번 편의 주제는: _LLM + pytest로 QA 코딩 테스트 문제를 자동 생성하는 파이프라인_입니다.

---

## 1. 목표: “AI가 만드는 QA 코딩 테스트 문제”의 요구사항

내가 만들고 싶었던 것은 단순한 알고리즘 문제가 아니었다.  
목표는 **QA 엔지니어의 관점**에서 의미 있는 코딩 테스트였다.

구체적으로는:

1. **Python + pytest 기반의 문제**
   - 함수 시그니처가 명확하고,
   - 현실적인 비즈니스/유틸리티 로직 형태를 가질 것
2. **여러 개의 buggy implementation**
   - 같은 함수에 대해 서로 다른 유형의 버그를 가진 구현들을 생성
   - 경계값, 예외 케이스, 형식 오류 등 다양한 패턴
3. **pytest 테스트 코드**
   - 정상 구현은 통과하고,
   - buggy 구현들은 적절히 _적발_될 수 있을 것
4. **기계가 읽을 수 있는 구조화된 결과**
   - JSON 형태로 저장해서,  
     웹 서비스에서 쉽게 로딩하고, judge 컨테이너에서 자동으로 실행 가능할 것

이걸 수작업으로 만들면 시간이 너무 오래 걸린다.  
그래서 LLM을 앞단에 세워서:

> “문제 설계 + buggy 코드 + pytest 테스트 코드”를 한 번에 생성하는 **생산 라인**을 만들고,  
> QA 엔지니어인 나는 그 위에서 **품질 관리·검증자** 역할을 하기로 했다.

---

## 2. 전체 파이프라인 개요

지금까지 구축한 파이프라인을 단계별로 정리하면 대략 이런 구조다.

1. **프롬프트 입력**
   - 내가 정의한 목표(`goal`), 평가하려는 스킬(`skills_to_assess`), 난이도, 함수 형태 등을 LLM에 전달
2. **문제 생성 (Model: `o3-mini`)**
   - LLM이 아래 항목을 포함한 JSON을 생성
     - `function_signature`
     - `description` (문제 설명)
     - `buggy_implementations` (여러 개)
     - `test_code` (pytest)
3. **JSON 파싱 & 저장**
   - 스키마에 맞게 파싱하고, 문제 ID를 부여하여 파일/DB에 저장
4. **pytest 검증 (Docker 내부)**
   - judge 컨테이너에서:
     - 각 buggy 구현 + 테스트 코드 조합을 실행
     - _정상 구현 템플릿_이 있는 경우, 그것도 함께 실행해 비교
5. **LLM 기반 피드백 (Model: `gpt-5-nano`)**
   - 생성된 문제/테스트를 요약해서 넘기고,
   - 모호한 부분, 놓친 엣지 케이스, 더 나은 테스트 아이디어 등에 대한 코멘트 요청
6. **최종 승인 or 재생성**
   - 사람이 마지막으로 한 번 검토한 뒤,
   - 문제 뱅크에 편입하거나, 프롬프트를 조정해서 재생성

여기서 핵심은 **모델 역할 분리**다.

- 문제 생성: `o3-mini`
- 문제 검증/피드백: `gpt-5-nano`

단일 모델에 모든 걸 맡기지 않고,  
성격이 다른 두 모델을 _역할별로_ 사용하는 구조로 가져갔다.

---

## 3. 모델 선택 전략 – 왜 `o3-mini` + `gpt-5-nano` 조합인가

모델을 고를 때 고민했던 포인트는 세 가지였다.

1. **추론 품질** – 문제 설계와 코드/테스트 생성은 생각보다 복잡하다.
2. **비용** – 문제를 많이 생성하려면 토큰당 비용을 무시할 수 없다.
3. **응답 속도** – 반복 실험을 할 수 있을 정도의 latency.

### 3.1 `o3-mini` – 문제 생성용

`o3-mini`는:

- 구조화된 JSON을 만들 때 안정적이고,
- 코드 + 설명 + 테스트를 한 번에 다루는 **멀티 파트 텍스트 구조**에도 강하고,
- “버그 유형”, “경계값”, “엣지 케이스” 같은 QA 용어를 프롬프트에 넣었을 때  
  제법 그럴듯한 결과를 내준다.

그래서 **문제 정의 + buggy 구현 + 테스트 코드**처럼  
“처음부터 설계를 잘 해야 하는 작업”은 `o3-mini`에게 맡겼다.

### 3.2 `gpt-5-nano` – 검증/리뷰용

반대로 `gpt-5-nano`는:

- 상대적으로 저렴하고,
- 짧은 텍스트 요약, 간단한 평가/분류, 피드백에 적합하다.

여기서는 이런 용도로 쓴다.

- 생성된 문제/테스트 코드에 대해:
  - 명확성: “이 설명만 보고도 사용자가 요구사항을 이해할 수 있는가?”
  - 커버리지 감각: “테스트가 너무 약하지는 않은가?”
  - 난이도 감각: “easy/medium/hard 태깅이 적절한가?”
- 짧은 코멘트/리뷰를 받아서,  
  내가 최종 리뷰할 때 참고자료로 사용

즉, `o3-mini`는 **“생성 담당 모델”**,  
`gpt-5-nano`는 **“품질 리뷰 담당 모델”**이라는 롤로 분리했다.

---

## 4. OpenAI Python SDK 버전 지옥 – gpt-5.1 Responses API가 안 되던 이유

이 프로젝트에서 가장 황당하게 시간을 잡아먹은 문제는,  
아이러니하게도 **모델 프롬프트 설계가 아니라 SDK 버전**이었다.

### 4.1 증상: 문서대로 했는데 코드가 안 돌아간다

나는 OpenAI 문서를 보고 아래처럼 코드를 작성했다.

```python
from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="gpt-5.1-mini",
    input=[ ... ]
)
```

문서 상으로는 이게 정석이었다.  
그런데 실제로 코드를 실행하자마자 이런 류의 에러가 터졌다.

- `AttributeError: module 'openai' has no attribute 'OpenAI'`
- 또는
- `AttributeError: 'OpenAI' object has no attribute 'responses'`

처음에는:

- 내 코드가 잘못됐나?
- 패키지가 제대로 설치가 안 됐나?
- venv가 꼬였나?

이런 의심만 하면서 시간을 보냈다.

### 4.2 원인: `openai` 패키지 버전이 1.4에 묶여 있었다

결국 천천히 확인해보니,  
내 환경의 `openai` 패키지 버전이 **1.4대**에 묶여 있었다.

```bash
pip show openai | grep Version
# Version: 1.4.x
```

이 버전에서는:

- `from openai import OpenAI`
- `client.responses.create(...)`

같은 **새로운 Responses API 스타일**이 아예 존재하지 않는다.  
당연히 `OpenAI` 클래스도 없고, `responses` 엔드포인트도 없다.

문제는, 패키지를 아주 예전에 한 번 설치해두고,  
그 이후로 **업그레이드를 한 번도 안 했다는 것**이었다.

### 4.3 해결: 패키지를 최신 버전으로 업그레이드

해결은 단순했다.  
그런데 이 단순함을 깨닫기까지 시간이 꽤 걸렸다.

```bash
pip install --upgrade openai
```

다시 버전을 확인해보면:

```bash
pip show openai | grep Version
# Version: (최신 버전 숫자)
```

이 상태에서 다시 아래 코드를 실행하니,  
이번에는 아무 에러 없이 잘 동작했다.

```python
from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="o3-mini",
    input=[
        {
            "role": "system",
            "content": "너는 테스트 자동화/QA 교육용 문제를 설계하는 시니어 SDET이다. ..."
        },
        {
            "role": "user",
            "content": "다음 조건에 맞는 Python + pytest 기반 QA 코딩 테스트 문제를 JSON으로 생성해줘. ..."
        }
    ]
)

print(resp.output[0].content[0].text)
```

여기서 얻은 교훈은 단순하지만 중요하다.

> **LLM API를 쓸 때는, 코드 예제만 볼 게 아니라  
> 실제 내 환경의 SDK 버전도 항상 같이 확인하자.**

특히 Docker 이미지나 서버 환경에서는  
로컬과 버전이 어긋나기 쉽기 때문에,  
`pip freeze` / `requirements.txt`를 통해 버전을 명시적으로 관리하는 것이 필수다.

---

## 5. 프롬프트 설계 – 함수, 버그, 테스트를 한 번에 뽑기

Responses API가 돌아가기 시작한 뒤에는,  
이제 **프롬프트 설계**가 핵심 이슈가 되었다.

내가 사용한 구조는 대략 이런 느낌이다.

### 5.1 System 프롬프트 (요약 버전)

```text
너는 테스트 자동화/QA 교육용 문제를 설계하는 시니어 SDET이다.

입력으로 주어진 목표(goal), 평가하려는 기술(skills_to_assess)을 바탕으로,
Python + pytest 기반의 QA 코딩 테스트 문제를 생성하라.

출력은 반드시 JSON 형식으로 반환한다.

생성해야 할 항목:
1. function_signature: 테스트 대상 함수의 시그니처
2. description: 문제 설명 (한글로 작성)
3. buggy_implementations: 서로 다른 버그를 가진 구현 3~4개
4. test_code: pytest 기반 테스트 코드
...
```

### 5.2 User 프롬프트 (예시)

```text
goal: 문자열 길이 검증 로직에 대한 경계값 테스트를 설계하게 하고 싶다.
skills_to_assess:
- boundary value analysis
- string validation
- pytest fixture 활용

난이도: easy ~ medium

제약:
- 함수 이름은 is_valid_length(value: str, min_length: int, max_length: int) -> bool
- description은 실무 QA 문맥에 맞게 작성
- buggy_implementations에는 서로 다른 유형의 버그를 포함
- test_code에는 최소/최대 경계, 비정상 입력을 모두 포함
...
```

### 5.3 응답 포맷 검증

`o3-mini`의 응답은 Responses API 형태로 들어오므로,  
실제로는 다음과 같이 텍스트만 추출해서 JSON 파싱을 한다.

```python
import json
from openai import OpenAI

client = OpenAI()

resp = client.responses.create(
    model="o3-mini",
    input=[...]
)

raw_text = resp.output[0].content[0].text
data = json.loads(raw_text)
```

여기서 자주 겪는 이슈는:

- JSON 앞뒤에 ```json 코드 블록 마크다운이 붙어 나오는 경우
- 트레일링 콤마, 주석 등으로 인해 `json.loads`가 실패하는 경우

그래서 실제 코드에서는:

- ``` 코드 블록 제거
- 약간의 전처리 로직을 추가해 파싱 성공률을 높였다.

---

## 6. pytest + `gpt-5-nano` 조합으로 생성 결과 검증하기

문제가 생성되었다고 해서 바로 쓸 수 있는 것은 아니다.  
**QA 관점의 검증 단계**가 필요하다.

### 6.1 pytest로 기술적 유효성 검증

먼저, judge 컨테이너 안에서 각 문제에 대해 다음을 확인한다.

1. **테스트 코드 자체가 실행되는지**
   - import 에러, 문법 에러, 경로 문제 등
2. **buggy 구현이 실제로 실패하는지**
   - 모든 buggy 구현이 모두 통과해 버리면, 테스트가 너무 약한 것
3. **(있다면) 레퍼런스 구현은 모든 테스트를 통과하는지**
   - 정상 구현이 실패한다면, 테스트가 지나치게 엄격하거나 잘못 설계된 것

pytest 실행은 대략 이런 식으로 구성했다.

```bash
docker run --rm   -v /tmp/judge-test:/workdir   qa-arena-judge   pytest -q
```

컨테이너 내부에서는:

- `target.py`에 buggy 구현 또는 레퍼런스 구현을 기록하고,
- `test_user.py`에 LLM이 생성한 pytest 코드를 넣은 뒤,
- pytest를 실행해서 결과를 수집한다.

### 6.2 `gpt-5-nano`로 휴먼 리뷰를 보조하기

기술적으로는 pytest를 통과해도,  
문제 설명이 모호하거나, 학습 목적에 맞지 않을 수 있다.

이때 `gpt-5-nano`를 간단한 리뷰어로 사용한다.

예시 코드:

```python
from openai import OpenAI

client = OpenAI()

summary_prompt = f'''
다음은 QA 교육용 Python 코딩 테스트 문제입니다.

[문제 설명]
{data["description"]}

[함수 시그니처]
{data["function_signature"]}

[pytest 테스트 코드]
{data["test_code"]}

이 문제가 QA 관점에서 적절한지 간단히 평가해줘.
- 요구사항이 충분히 명확한지
- 테스트가 너무 약하거나, 빠진 케이스가 보이는지
- 난이도(easy/medium/hard) 태깅이 적절한지

응답은 한국어로 짧게 bullet 위주로 작성.
'''

review = client.responses.create(
    model="gpt-5-nano",
    input=[
        {"role": "user", "content": summary_prompt}
    ]
)

print(review.output[0].content[0].text)
```

이렇게 받은 피드백 중에서:

- 명백한 모호성 지적
- 빠져 있는 엣지 케이스 제안

등을 참고해서, 다음과 같은 결정을 내린다.

- 문제를 그대로 사용
- 프롬프트를 약간 수정해서 다시 생성
- 생성된 테스트 코드만 부분적으로 수정

---

## 7. AI QA 관점에서 얻은 인사이트

이 파이프라인을 구축하면서,  
AI QA 엔지니어 관점에서 몇 가지 중요한 포인트를 정리하게 됐다.

1. **AI는 문제 “공장”이 될 수 있지만, 품질 기준을 정하는 건 사람이다.**
   - 어떤 유형의 버그를 넣을지,
   - 어느 수준의 난이도를 목표로 할지,
   - 어떤 테스팅 기법(경계값, 동등분할, 상태 전이 등)에 초점을 둘지  
   를 결정하는 건 여전히 QA의 역할이다.

2. **모델 역할 분리는 생각보다 중요하다.**
   - `o3-mini`로 생성하고, `gpt-5-nano`로 리뷰하는 구조처럼  
     “생성 모델 vs 리뷰 모델”을 분리하면,  
     품질 관리 전략을 더 유연하게 가져갈 수 있다.

3. **SDK/환경 버전 관리도 QA의 중요한 관심사다.**
   - gpt-5.1 Responses API 이슈처럼,  
     _도구 버전 불일치_ 때문에 전체 파이프라인이 막힐 수 있다.
   - 버전 고정, 의존성 관리, 환경 간 일관성은  
     결국 테스트 전략의 일부다.

4. **pytest는 여전히 강력한 ‘현실 세계의 오라클’이다.**
   - LLM이 무엇을 생성하든,
   - 최종적으로는 pytest 결과가 _사실_을 말해 준다.
   - 이 점에서 LLM + pytest 조합은,  
     “AI가 만든 가설을 테스트가 검증하는 구조”라고 볼 수 있다.

---

## 8. 다음 글 예고 – Celery + Docker로 채점 파이프라인 구성하기

지금까지는:

- LLM으로 문제/코드/테스트를 생성하고,
- pytest로 문제의 기술적 유효성을 검증하는  
**컨텐츠 파이프라인**에 집중했다.

다음 편에서는 이 컨텐츠를 실제 웹 서비스에서 사용하기 위해,

- 사용자가 웹에서 코드를 제출하면,
- Celery worker가 Docker 컨테이너에서 pytest를 실행하고,
- 결과를 다시 웹으로 되돌려주는

**채점 파이프라인(judge 시스템) 아키텍처와 삽질기**를 정리해 볼 예정이다.

> AI가 문제를 만들고,  
> pytest가 그 문제를 검증하고,  
> Celery가 사용자 코드를 채점하는 구조.  
> 그 사이에서 QA 엔지니어는  
> “품질 기준을 설계하는 사람”으로 남는다.

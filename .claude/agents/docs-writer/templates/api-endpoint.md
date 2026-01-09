# API 엔드포인트 문서 템플릿

> 새 API 엔드포인트 문서화 시 사용

---

## 기본 템플릿

```markdown
### [METHOD] /api/v1/[resource]/[path]

**설명**: [엔드포인트가 하는 일을 한 문장으로]

**인증**: Required | Optional | None

**Rate Limit**: [제한이 있다면 명시]

---

#### 요청

**Path 파라미터**:
| 이름 | 타입 | 설명 |
|------|------|------|
| id | int | [설명] |

**Query 파라미터**:
| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| page | int | N | 1 | 페이지 번호 |
| limit | int | N | 20 | 페이지당 항목 수 |

**요청 본문** (Content-Type: application/json):
```json
{
  "field1": "string",
  "field2": 123,
  "nested": {
    "key": "value"
  }
}
```

---

#### 응답

**성공 (200)**:
```json
{
  "id": 1,
  "status": "success",
  "data": { ... }
}
```

**에러 응답**:
| 상태 코드 | 에러 코드 | 설명 |
|---------|---------|------|
| 400 | INVALID_REQUEST | 잘못된 요청 형식 |
| 401 | UNAUTHORIZED | 인증 필요 |
| 403 | FORBIDDEN | 권한 없음 |
| 404 | NOT_FOUND | 리소스 없음 |
| 422 | VALIDATION_ERROR | 유효성 검사 실패 |
| 500 | INTERNAL_ERROR | 서버 오류 |

---

#### 예시

**요청**:
```bash
curl -X POST "https://qa-arena.qalabs.kr/api/v1/[resource]" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

**응답**:
```json
{
  "id": 1,
  "created_at": "2026-01-09T12:00:00Z"
}
```
```

---

## 리소스별 예시

### GET (목록 조회)
```markdown
### GET /api/v1/problems

**설명**: 문제 목록을 페이지네이션하여 조회

**인증**: Optional (비회원도 조회 가능)

#### 요청

**Query 파라미터**:
| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| page | int | N | 1 | 페이지 번호 |
| limit | int | N | 20 | 페이지당 항목 (최대 100) |
| difficulty | string | N | - | easy, medium, hard |
| category | string | N | - | 카테고리 필터 |

#### 응답 (200)
```json
{
  "items": [
    {
      "id": 1,
      "title": "나이 검증 함수",
      "difficulty": "easy",
      "category": "validation"
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3
}
```
```

### POST (생성)
```markdown
### POST /api/v1/submissions

**설명**: 새 코드 제출 생성

**인증**: Required

#### 요청

**요청 본문**:
```json
{
  "problem_id": 1,
  "code": "def test_example():\n    assert True"
}
```

#### 응답 (200)
```json
{
  "submission_id": "uuid-...",
  "status": "pending",
  "created_at": "2026-01-09T12:00:00Z"
}
```

#### 에러
| 상태 | 코드 | 설명 |
|------|------|------|
| 400 | EMPTY_CODE | 코드가 비어있음 |
| 404 | PROBLEM_NOT_FOUND | 문제 없음 |
```

### PUT/PATCH (수정)
```markdown
### PATCH /api/v1/users/me

**설명**: 현재 사용자 정보 수정

**인증**: Required

#### 요청

**요청 본문** (부분 수정 가능):
```json
{
  "username": "newname",
  "avatar_url": "https://..."
}
```

#### 응답 (200)
```json
{
  "id": 1,
  "username": "newname",
  "updated_at": "2026-01-09T12:00:00Z"
}
```
```

### DELETE (삭제)
```markdown
### DELETE /api/v1/bookmarks/{problem_id}

**설명**: 문제 북마크 삭제

**인증**: Required

#### 요청

**Path 파라미터**:
| 이름 | 타입 | 설명 |
|------|------|------|
| problem_id | int | 북마크 해제할 문제 ID |

#### 응답 (204)
내용 없음

#### 에러
| 상태 | 코드 | 설명 |
|------|------|------|
| 404 | BOOKMARK_NOT_FOUND | 북마크 없음 |
```

---

## 체크리스트

새 API 문서 작성 시 확인:

- [ ] METHOD와 경로 정확
- [ ] 인증 요구사항 명시
- [ ] 모든 파라미터 문서화
- [ ] 요청 본문 JSON 예시
- [ ] 성공 응답 JSON 예시
- [ ] 에러 코드 및 설명
- [ ] curl 예시 포함

---

*API 엔드포인트 문서 템플릿 v1.0*

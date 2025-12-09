# 기술 스택

## Backend
- **Python**: 3.11+
- **Web Framework**: FastAPI 0.104.1
- **Server**: Uvicorn 0.24.0
- **Database ORM**: SQLAlchemy 2.0.23
- **Migration**: Alembic 1.12.1
- **Database**: PostgreSQL 15 (Docker)
- **Cache/Queue**: Redis 7 (Docker)
- **Task Queue**: Celery 5.3.4
- **Testing**: pytest 7.4.3, pytest-asyncio, httpx
- **Docker SDK**: docker 6.1.3, requests-unixsocket
- **AI/LLM**: OpenAI API 1.12.0
- **Validation**: Pydantic 2.5.0

## Frontend
- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript 5
- **UI Framework**: React 19.2.0
- **Styling**: Tailwind CSS 4, @tailwindcss/postcss
- **Code Editor**: Monaco Editor (@monaco-editor/react 4.7.0)
- **Markdown**: react-markdown 10.1.0
- **Icons**: lucide-react
- **Testing**: Jest 30.2.0, React Testing Library 16.3.0
- **Linting**: ESLint 9, eslint-config-next

## Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx (프로덕션)
- **Cloud**: AWS EC2 (Ubuntu 22.04 LTS)

## Development Tools
- **Backend Formatter**: black (권장)
- **Backend Linter**: flake8 또는 pylint (권장)
- **Frontend Formatter**: prettier
- **Frontend Linter**: ESLint
- **Version Control**: Git

## Key Dependencies
- `psycopg2-binary`: PostgreSQL adapter
- `python-dotenv`: Environment variable management
- `python-multipart`: Multipart form data
- `requests==2.31.0`: HTTP library (unix socket 호환성)

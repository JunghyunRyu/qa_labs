// OSS 라이브러리 라이선스 정보
// 이 파일은 프로젝트에서 사용하는 오픈소스 라이브러리의 라이선스 정보를 담고 있습니다.

export interface OSSLibrary {
  name: string;
  version?: string;
  license: string;
  licenseUrl?: string;
  repository?: string;
  description?: string;
}

export interface OSSCategory {
  category: string;
  libraries: OSSLibrary[];
}

// Frontend Dependencies
export const frontendDependencies: OSSLibrary[] = [
  {
    name: "React",
    version: "19.2.0",
    license: "MIT",
    licenseUrl: "https://github.com/facebook/react/blob/main/LICENSE",
    repository: "https://github.com/facebook/react",
    description: "A JavaScript library for building user interfaces",
  },
  {
    name: "React DOM",
    version: "19.2.0",
    license: "MIT",
    licenseUrl: "https://github.com/facebook/react/blob/main/LICENSE",
    repository: "https://github.com/facebook/react",
    description: "React package for working with the DOM",
  },
  {
    name: "Next.js",
    version: "16.0.3",
    license: "MIT",
    licenseUrl: "https://github.com/vercel/next.js/blob/canary/license.md",
    repository: "https://github.com/vercel/next.js",
    description: "The React Framework for the Web",
  },
  {
    name: "@monaco-editor/react",
    version: "4.7.0",
    license: "MIT",
    licenseUrl: "https://github.com/suren-atoyan/monaco-react/blob/master/LICENSE",
    repository: "https://github.com/suren-atoyan/monaco-react",
    description: "Monaco Editor for React",
  },
  {
    name: "@sentry/nextjs",
    version: "8.55.0",
    license: "MIT",
    licenseUrl: "https://github.com/getsentry/sentry-javascript/blob/master/LICENSE",
    repository: "https://github.com/getsentry/sentry-javascript",
    description: "Official Sentry SDK for Next.js",
  },
  {
    name: "Framer Motion",
    version: "12.23.26",
    license: "MIT",
    licenseUrl: "https://github.com/framer/motion/blob/main/LICENSE.md",
    repository: "https://github.com/framer/motion",
    description: "A production-ready motion library for React",
  },
  {
    name: "Lucide React",
    version: "0.468.0",
    license: "ISC",
    licenseUrl: "https://github.com/lucide-icons/lucide/blob/main/LICENSE",
    repository: "https://github.com/lucide-icons/lucide",
    description: "Beautiful & consistent icon toolkit",
  },
  {
    name: "next-themes",
    version: "0.4.6",
    license: "MIT",
    licenseUrl: "https://github.com/pacocoursey/next-themes/blob/main/LICENSE",
    repository: "https://github.com/pacocoursey/next-themes",
    description: "Perfect dark mode in Next.js",
  },
  {
    name: "react-markdown",
    version: "10.1.0",
    license: "MIT",
    licenseUrl: "https://github.com/remarkjs/react-markdown/blob/main/license",
    repository: "https://github.com/remarkjs/react-markdown",
    description: "Markdown component for React",
  },
  {
    name: "react-resizable-panels",
    version: "3.0.6",
    license: "MIT",
    licenseUrl: "https://github.com/bvaughn/react-resizable-panels/blob/main/LICENSE.md",
    repository: "https://github.com/bvaughn/react-resizable-panels",
    description: "Resizable panel groups/layouts for React",
  },
  {
    name: "Recharts",
    version: "3.6.0",
    license: "MIT",
    licenseUrl: "https://github.com/recharts/recharts/blob/master/LICENSE",
    repository: "https://github.com/recharts/recharts",
    description: "A composable charting library built on React components",
  },
  {
    name: "remark-breaks",
    version: "4.0.0",
    license: "MIT",
    licenseUrl: "https://github.com/remarkjs/remark-breaks/blob/main/license",
    repository: "https://github.com/remarkjs/remark-breaks",
    description: "remark plugin to add break elements",
  },
  {
    name: "remark-gfm",
    version: "4.0.1",
    license: "MIT",
    licenseUrl: "https://github.com/remarkjs/remark-gfm/blob/main/license",
    repository: "https://github.com/remarkjs/remark-gfm",
    description: "remark plugin to support GFM",
  },
  {
    name: "Zustand",
    version: "5.0.9",
    license: "MIT",
    licenseUrl: "https://github.com/pmndrs/zustand/blob/main/LICENSE",
    repository: "https://github.com/pmndrs/zustand",
    description: "Bear necessities for state management in React",
  },
  {
    name: "Tailwind CSS",
    version: "4.x",
    license: "MIT",
    licenseUrl: "https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE",
    repository: "https://github.com/tailwindlabs/tailwindcss",
    description: "A utility-first CSS framework",
  },
  {
    name: "TypeScript",
    version: "5.x",
    license: "Apache-2.0",
    licenseUrl: "https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt",
    repository: "https://github.com/microsoft/TypeScript",
    description: "TypeScript is a superset of JavaScript",
  },
  {
    name: "ESLint",
    version: "9.x",
    license: "MIT",
    licenseUrl: "https://github.com/eslint/eslint/blob/main/LICENSE",
    repository: "https://github.com/eslint/eslint",
    description: "Find and fix problems in your JavaScript code",
  },
  {
    name: "Jest",
    version: "30.2.0",
    license: "MIT",
    licenseUrl: "https://github.com/jestjs/jest/blob/main/LICENSE",
    repository: "https://github.com/jestjs/jest",
    description: "Delightful JavaScript Testing",
  },
  {
    name: "Playwright",
    version: "1.57.0",
    license: "Apache-2.0",
    licenseUrl: "https://github.com/microsoft/playwright/blob/main/LICENSE",
    repository: "https://github.com/microsoft/playwright",
    description: "Playwright is a framework for Web Testing and Automation",
  },
  {
    name: "Testing Library",
    version: "various",
    license: "MIT",
    licenseUrl: "https://github.com/testing-library/react-testing-library/blob/main/LICENSE",
    repository: "https://github.com/testing-library",
    description: "Simple and complete testing utilities",
  },
];

// Backend Dependencies
export const backendDependencies: OSSLibrary[] = [
  {
    name: "FastAPI",
    version: "0.104.1",
    license: "MIT",
    licenseUrl: "https://github.com/tiangolo/fastapi/blob/master/LICENSE",
    repository: "https://github.com/tiangolo/fastapi",
    description: "FastAPI framework, high performance, easy to learn",
  },
  {
    name: "Uvicorn",
    version: "0.24.0",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/encode/uvicorn/blob/master/LICENSE.md",
    repository: "https://github.com/encode/uvicorn",
    description: "The lightning-fast ASGI server",
  },
  {
    name: "SQLAlchemy",
    version: "2.0.23",
    license: "MIT",
    licenseUrl: "https://github.com/sqlalchemy/sqlalchemy/blob/main/LICENSE",
    repository: "https://github.com/sqlalchemy/sqlalchemy",
    description: "The Python SQL Toolkit and Object Relational Mapper",
  },
  {
    name: "Alembic",
    version: "1.12.1",
    license: "MIT",
    licenseUrl: "https://github.com/sqlalchemy/alembic/blob/main/LICENSE",
    repository: "https://github.com/sqlalchemy/alembic",
    description: "A database migration tool for SQLAlchemy",
  },
  {
    name: "Pydantic",
    version: "2.5.0",
    license: "MIT",
    licenseUrl: "https://github.com/pydantic/pydantic/blob/main/LICENSE",
    repository: "https://github.com/pydantic/pydantic",
    description: "Data validation using Python type hints",
  },
  {
    name: "Celery",
    version: "5.3.4",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/celery/celery/blob/main/LICENSE",
    repository: "https://github.com/celery/celery",
    description: "Distributed Task Queue",
  },
  {
    name: "Redis (Python client)",
    version: "5.0.1",
    license: "MIT",
    licenseUrl: "https://github.com/redis/redis-py/blob/master/LICENSE",
    repository: "https://github.com/redis/redis-py",
    description: "The Python interface to Redis",
  },
  {
    name: "Docker SDK for Python",
    version: "6.1.3",
    license: "Apache-2.0",
    licenseUrl: "https://github.com/docker/docker-py/blob/main/LICENSE",
    repository: "https://github.com/docker/docker-py",
    description: "Python library for the Docker Engine API",
  },
  {
    name: "OpenAI Python",
    version: "latest",
    license: "MIT",
    licenseUrl: "https://github.com/openai/openai-python/blob/main/LICENSE",
    repository: "https://github.com/openai/openai-python",
    description: "The official Python library for the OpenAI API",
  },
  {
    name: "python-jose",
    version: "3.3.0",
    license: "MIT",
    licenseUrl: "https://github.com/mpdavis/python-jose/blob/master/LICENSE",
    repository: "https://github.com/mpdavis/python-jose",
    description: "JOSE implementation in Python",
  },
  {
    name: "Sentry SDK",
    version: "1.39.1",
    license: "MIT",
    licenseUrl: "https://github.com/getsentry/sentry-python/blob/master/LICENSE",
    repository: "https://github.com/getsentry/sentry-python",
    description: "Official Sentry SDK for Python",
  },
  {
    name: "SlowAPI",
    version: "0.1.9",
    license: "MIT",
    licenseUrl: "https://github.com/laurentS/slowapi/blob/master/LICENSE",
    repository: "https://github.com/laurentS/slowapi",
    description: "A rate limiting library for Starlette and FastAPI",
  },
  {
    name: "APScheduler",
    version: "3.10.0+",
    license: "MIT",
    licenseUrl: "https://github.com/agronholm/apscheduler/blob/master/LICENSE.txt",
    repository: "https://github.com/agronholm/apscheduler",
    description: "Advanced Python Scheduler",
  },
  {
    name: "Requests",
    version: "2.31.0",
    license: "Apache-2.0",
    licenseUrl: "https://github.com/psf/requests/blob/main/LICENSE",
    repository: "https://github.com/psf/requests",
    description: "Python HTTP library for humans",
  },
  {
    name: "HTTPX",
    version: "0.25.2",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/encode/httpx/blob/master/LICENSE.md",
    repository: "https://github.com/encode/httpx",
    description: "A next generation HTTP client for Python",
  },
  {
    name: "pytest",
    version: "7.4.3",
    license: "MIT",
    licenseUrl: "https://github.com/pytest-dev/pytest/blob/main/LICENSE",
    repository: "https://github.com/pytest-dev/pytest",
    description: "The pytest framework makes it easy to write small tests",
  },
  {
    name: "psycopg2",
    version: "2.9.9",
    license: "LGPL-3.0",
    licenseUrl: "https://github.com/psycopg/psycopg2/blob/master/LICENSE",
    repository: "https://github.com/psycopg/psycopg2",
    description: "PostgreSQL adapter for Python",
  },
  {
    name: "python-dotenv",
    version: "1.0.0",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/theskumar/python-dotenv/blob/main/LICENSE",
    repository: "https://github.com/theskumar/python-dotenv",
    description: "Read key-value pairs from .env file",
  },
];

// Infrastructure
export const infrastructureDependencies: OSSLibrary[] = [
  {
    name: "Docker",
    license: "Apache-2.0",
    licenseUrl: "https://github.com/moby/moby/blob/master/LICENSE",
    repository: "https://github.com/moby/moby",
    description: "The open-source application container engine",
  },
  {
    name: "PostgreSQL",
    license: "PostgreSQL License",
    licenseUrl: "https://www.postgresql.org/about/licence/",
    repository: "https://github.com/postgres/postgres",
    description: "The most advanced open source relational database",
  },
  {
    name: "Redis",
    license: "BSD-3-Clause",
    licenseUrl: "https://github.com/redis/redis/blob/unstable/COPYING",
    repository: "https://github.com/redis/redis",
    description: "In-memory data structure store",
  },
  {
    name: "Nginx",
    license: "BSD-2-Clause",
    licenseUrl: "https://nginx.org/LICENSE",
    repository: "https://github.com/nginx/nginx",
    description: "High-performance HTTP server",
  },
];

// 라이선스 전문 (주요 라이선스)
export const licenseTexts: Record<string, string> = {
  MIT: `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,

  "Apache-2.0": `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,

  "BSD-3-Clause": `BSD 3-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

  ISC: `ISC License

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.`,

  "LGPL-3.0": `GNU LESSER GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

This library is free software; you can redistribute it and/or modify it under
the terms of the GNU Lesser General Public License as published by the Free
Software Foundation; either version 3 of the License, or (at your option) any
later version.

This library is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
details.

You should have received a copy of the GNU Lesser General Public License along
with this library. If not, see <https://www.gnu.org/licenses/>.`,

  "BSD-2-Clause": `BSD 2-Clause License

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`,

  "PostgreSQL License": `PostgreSQL License

Permission to use, copy, modify, and distribute this software and its
documentation for any purpose, without fee, and without a written agreement is
hereby granted, provided that the above copyright notice and this paragraph
and the following two paragraphs appear in all copies.

IN NO EVENT SHALL THE UNIVERSITY OF CALIFORNIA BE LIABLE TO ANY PARTY FOR
DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, INCLUDING
LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION,
EVEN IF THE UNIVERSITY OF CALIFORNIA HAS BEEN ADVISED OF THE POSSIBILITY OF
SUCH DAMAGE.

THE UNIVERSITY OF CALIFORNIA SPECIFICALLY DISCLAIMS ANY WARRANTIES, INCLUDING,
BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE. THE SOFTWARE PROVIDED HEREUNDER IS ON AN "AS IS" BASIS,
AND THE UNIVERSITY OF CALIFORNIA HAS NO OBLIGATIONS TO PROVIDE MAINTENANCE,
SUPPORT, UPDATES, ENHANCEMENTS, OR MODIFICATIONS.`,
};

// 전체 OSS 데이터
export const ossCategories: OSSCategory[] = [
  {
    category: "Frontend",
    libraries: frontendDependencies,
  },
  {
    category: "Backend",
    libraries: backendDependencies,
  },
  {
    category: "Infrastructure",
    libraries: infrastructureDependencies,
  },
];

// 라이선스별 라이브러리 그룹화
export function getLibrariesByLicense(): Record<string, OSSLibrary[]> {
  const allLibraries = [
    ...frontendDependencies,
    ...backendDependencies,
    ...infrastructureDependencies,
  ];

  return allLibraries.reduce((acc, lib) => {
    if (!acc[lib.license]) {
      acc[lib.license] = [];
    }
    acc[lib.license].push(lib);
    return acc;
  }, {} as Record<string, OSSLibrary[]>);
}

// 고유 라이선스 목록
export function getUniqueLicenses(): string[] {
  const allLibraries = [
    ...frontendDependencies,
    ...backendDependencies,
    ...infrastructureDependencies,
  ];

  return [...new Set(allLibraries.map(lib => lib.license))].sort();
}

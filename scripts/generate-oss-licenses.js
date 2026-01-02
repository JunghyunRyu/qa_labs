#!/usr/bin/env node
/**
 * OSS 라이선스 정보 생성 스크립트
 *
 * 이 스크립트는 package.json과 requirements.txt에서 의존성을 읽어
 * 라이선스 정보를 자동으로 업데이트하는 데 도움을 줍니다.
 *
 * 사용법:
 *   node scripts/generate-oss-licenses.js
 *
 * 출력:
 *   - 콘솔에 현재 의존성 목록을 출력합니다.
 *   - frontend/lib/oss-licenses.ts 파일은 수동으로 업데이트해야 합니다.
 *
 * 참고:
 *   - npm 패키지의 라이선스 정보는 npm view <package> license 명령으로 확인 가능합니다.
 *   - PyPI 패키지의 라이선스 정보는 pip show <package> 명령으로 확인 가능합니다.
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');
const BACKEND_PATH = path.join(__dirname, '..', 'backend');

// package.json 읽기
function readPackageJson() {
  const packageJsonPath = path.join(FRONTEND_PATH, 'package.json');
  try {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    return null;
  }
}

// requirements.txt 읽기
function readRequirements() {
  const requirementsPath = path.join(BACKEND_PATH, 'requirements.txt');
  try {
    const content = fs.readFileSync(requirementsPath, 'utf-8');
    const lines = content.split('\n');
    const dependencies = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // 주석과 빈 줄 스킵
      if (!trimmed || trimmed.startsWith('#')) continue;

      // 패키지명과 버전 추출
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)(\[.*?\])?([>=<~!].*)?$/);
      if (match) {
        dependencies.push({
          name: match[1],
          extras: match[2] || '',
          version: match[3] || 'latest',
        });
      }
    }

    return dependencies;
  } catch (error) {
    console.error('Error reading requirements.txt:', error.message);
    return [];
  }
}

// 메인 실행
function main() {
  console.log('='.repeat(60));
  console.log('OSS 라이선스 정보 생성 도우미');
  console.log('='.repeat(60));
  console.log('');

  // Frontend 의존성
  console.log('[Frontend Dependencies - package.json]');
  console.log('-'.repeat(60));
  const packageJson = readPackageJson();
  if (packageJson) {
    console.log('\n프로덕션 의존성:');
    for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
      console.log(`  ${name}: ${version}`);
    }

    console.log('\n개발 의존성:');
    for (const [name, version] of Object.entries(packageJson.devDependencies || {})) {
      console.log(`  ${name}: ${version}`);
    }
  }

  console.log('');
  console.log('[Backend Dependencies - requirements.txt]');
  console.log('-'.repeat(60));
  const requirements = readRequirements();
  for (const dep of requirements) {
    console.log(`  ${dep.name}${dep.extras}: ${dep.version}`);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('');
  console.log('다음 단계:');
  console.log('1. 위 목록에서 새로 추가된 라이브러리를 확인하세요.');
  console.log('2. 각 라이브러리의 라이선스를 확인하세요:');
  console.log('   - npm: npm view <package> license');
  console.log('   - pip: pip show <package> | grep License');
  console.log('3. frontend/lib/oss-licenses.ts 파일을 수동으로 업데이트하세요.');
  console.log('');
  console.log('라이선스 정보 확인 예시:');
  console.log('  npm view react license        # MIT');
  console.log('  npm view next license         # MIT');
  console.log('  pip show fastapi | grep -i license   # MIT License');
  console.log('');
}

main();

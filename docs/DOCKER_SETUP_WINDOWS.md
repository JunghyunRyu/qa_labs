# Windows 환경 Docker 설치 가이드

이 문서는 Windows 환경에서 QA-Arena 프로젝트를 실행하기 위한 Docker Desktop 설치 가이드입니다.

> 참고: [Docker Desktop Windows 설치 공식 문서](https://docs.docker.com/desktop/setup/install/windows-install/)

## 시스템 요구 사항

- Windows 10 64-bit: Pro, Enterprise, 또는 Education (빌드 19041 이상)
- Windows 11 64-bit: Home 또는 Pro 버전 (빌드 22000 이상)
- WSL 2 기능 활성화
- 가상화 기능 활성화 (BIOS에서)

## 설치 전 확인 사항

### 1. WSL 2 확인 및 설치

Docker Desktop은 WSL 2를 사용합니다. 먼저 WSL 2가 설치되어 있는지 확인하세요.

#### PowerShell에서 확인 (관리자 권한)

```powershell
wsl --status
```

#### WSL 2가 설치되지 않은 경우

**방법 1: 터미널에서 설치 (권장)**

PowerShell을 관리자 권한으로 실행하고 다음 명령어를 실행:

```powershell
wsl --install
```

또는 업데이트가 필요한 경우:

```powershell
wsl --update
```

설치 후 컴퓨터를 재시작해야 할 수 있습니다.

**방법 2: MSI 패키지로 설치**

Microsoft Store 접근이 제한된 경우:

1. [WSL GitHub Releases 페이지](https://github.com/microsoft/WSL/releases)로 이동
2. 최신 안정 버전의 `.msi` 설치 파일 다운로드
3. 다운로드한 설치 파일을 실행하고 설치 지침 따르기

## Docker Desktop 설치

### 방법 1: 대화형 설치 (권장)

1. [Docker Desktop 다운로드 페이지](https://docs.docker.com/desktop/setup/install/windows-install/)에서 다운로드 버튼 클릭
   - 또는 [릴리스 노트](https://docs.docker.com/desktop/release-notes/)에서 다운로드
2. `Docker Desktop Installer.exe` 파일을 더블클릭하여 실행
3. 설치 마법사에서 **Use WSL 2 instead of Hyper-V** 옵션 선택 (시스템이 지원하는 경우)
4. 설치 마법사의 지시에 따라 설치 진행
5. 설치 완료 후 **Close** 클릭
6. Docker Desktop 시작

### 방법 2: 명령줄 설치

다운로드한 `Docker Desktop Installer.exe` 파일이 있는 위치에서 PowerShell 실행:

```powershell
Start-Process 'Docker Desktop Installer.exe' -Wait install
```

또는 Windows 명령 프롬프트:

```cmd
start /w "" "Docker Desktop Installer.exe" install
```

#### 추가 옵션 (명령줄 설치)

라이선스 자동 수락:

```powershell
Start-Process 'Docker Desktop Installer.exe' -Wait -ArgumentList 'install', '--accept-license'
```

설치 경로 변경:

```powershell
Start-Process 'Docker Desktop Installer.exe' -Wait -ArgumentList 'install', '--installation-dir=C:\CustomPath\Docker'
```

### 관리자 권한 설정

관리자 계정이 사용자 계정과 다른 경우, 사용자를 `docker-users` 그룹에 추가해야 합니다:

1. **컴퓨터 관리**를 관리자 권한으로 실행
2. **로컬 사용자 및 그룹** > **그룹** > **docker-users**로 이동
3. 사용자를 그룹에 추가
4. 변경 사항 적용을 위해 로그아웃 후 다시 로그인

또는 명령줄에서:

```cmd
net localgroup docker-users <사용자명> /add
```

## Docker Desktop 시작

1. Windows 시작 메뉴에서 "Docker" 검색
2. **Docker Desktop** 선택
3. Docker 구독 서비스 약관이 표시되면 **Accept** 클릭
   - Docker Desktop은 소규모 기업(직원 250명 미만 및 연매출 1천만 달러 미만), 개인 사용, 교육, 비상업적 오픈소스 프로젝트에 무료입니다
   - 그 외의 경우 유료 구독이 필요합니다
4. Docker Desktop이 시작됩니다

## 설치 확인

### Docker 버전 확인

PowerShell 또는 명령 프롬프트에서:

```powershell
docker --version
docker-compose --version
```

### Docker 실행 테스트

```powershell
docker run hello-world
```

정상적으로 실행되면 설치가 완료된 것입니다.

## QA-Arena 프로젝트에서 Docker 사용

### 1. PostgreSQL 및 Redis 컨테이너 실행

프로젝트 루트 디렉토리에서:

```powershell
docker-compose up -d
```

### 2. 컨테이너 상태 확인

```powershell
docker-compose ps
```

또는

```powershell
docker ps
```

### 3. 컨테이너 로그 확인

```powershell
docker-compose logs postgres
docker-compose logs redis
```

### 4. 컨테이너 중지

```powershell
docker-compose down
```

### 5. 데이터 볼륨까지 삭제 (주의: 데이터가 삭제됩니다)

```powershell
docker-compose down -v
```

## 문제 해결

### WSL 2 관련 문제

- WSL 2가 제대로 설치되지 않은 경우: `wsl --update` 실행 후 재시작
- WSL 2 배포판이 없는 경우: Microsoft Store에서 Ubuntu 설치

### 가상화 문제

- BIOS에서 가상화 기능(VT-x 또는 AMD-V)이 활성화되어 있는지 확인
- Windows 기능에서 "Hyper-V" 또는 "Windows 하이퍼바이저 플랫폼" 활성화

### Docker Desktop이 시작되지 않는 경우

1. Docker Desktop 재시작
2. Windows 재시작
3. Docker Desktop 로그 확인: `%LOCALAPPDATA%\Docker\log.txt`

### 포트 충돌 문제

PostgreSQL(5432) 또는 Redis(6379) 포트가 이미 사용 중인 경우:

1. 다른 애플리케이션이 해당 포트를 사용하고 있는지 확인:

```powershell
netstat -ano | findstr :5432
netstat -ano | findstr :6379
```

2. `docker-compose.yml`에서 포트 매핑 변경:

```yaml
ports:
  - "5433:5432"  # PostgreSQL 포트를 5433으로 변경
```

## 추가 리소스

- [Docker Desktop 공식 문서](https://docs.docker.com/desktop/)
- [Docker Desktop 문제 해결 가이드](https://docs.docker.com/desktop/troubleshoot/overview/)
- [WSL 2 공식 문서](https://learn.microsoft.com/windows/wsl/)

## 다음 단계

Docker 설치가 완료되면 [README.md](../README.md)의 "Docker 설정" 섹션을 참고하여 프로젝트를 실행하세요.


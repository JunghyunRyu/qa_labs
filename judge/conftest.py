"""Security restrictions for pytest execution.

이 conftest.py는 사용자 테스트 코드에서 위험한 모듈 임포트를 차단합니다.
pytest 자체의 동작에는 영향을 주지 않습니다.
"""

import sys

# 재귀 깊이 제한 (스택 오버플로우 방지)
sys.setrecursionlimit(200)

# 테스트 실행 타임아웃 (초)
TEST_TIMEOUT_SECONDS = 4

# target.py를 테스트 수집에서 제외 (test_로 시작하는 함수가 있어도 테스트로 인식하지 않음)
collect_ignore = ["target.py"]

# 보안 제한은 pytest_collection_modifyitems hook을 통해 적용됩니다.
# 이렇게 하면 pytest 자체의 내부 모듈 임포트는 허용하면서
# 사용자 테스트 코드의 위험한 임포트만 차단할 수 있습니다.

BLOCKED_MODULES = [
    # 기존 차단 모듈
    'os',
    'sys',
    'subprocess',
    'socket',
    'shutil',
    'multiprocessing',
    'threading',
    'ctypes',
    'imp',
    # 추가 차단: 시스템 접근 가능 모듈
    'pty',
    'fcntl',
    'pipes',
    'posix',
    'pwd',
    'grp',
    'resource',
    'syslog',
    'signal',
    # 추가 차단: 코드 실행/동적 로딩
    'code',
    'codeop',
    'pkgutil',
]


def pytest_collection_modifyitems(config, items):
    """테스트 수집 후 각 테스트 항목을 검사하여 위험한 모듈 임포트를 차단합니다."""
    import builtins
    import importlib.util
    
    # 원본 __import__ 저장
    _original_import = builtins.__import__
    
    def _blocked_import(name, globals=None, locals=None, fromlist=(), level=0):
        """위험한 모듈 임포트를 차단합니다."""
        # 모듈 이름 추출
        base_name = name.split('.')[0]
        
        # pytest 내부 모듈은 허용
        if base_name.startswith('_pytest') or base_name.startswith('pytest'):
            return _original_import(name, globals, locals, fromlist, level)
        
        # 위험한 모듈 차단
        if base_name in BLOCKED_MODULES:
            raise ImportError(f"Import of '{name}' is not allowed for security reasons")
        
        return _original_import(name, globals, locals, fromlist, level)
    
    # 각 테스트 항목에 대해 임포트 제한 적용
    # 실제로는 테스트 실행 시점에 적용되므로, 여기서는 설정만 합니다.
    # 실제 차단은 pytest_runtest_setup hook에서 수행됩니다.


def pytest_runtest_setup(item):
    """각 테스트 실행 전에 보안 제한을 적용합니다."""
    import builtins
    import signal as _signal  # 내부용으로만 사용 (사용자 코드에서는 차단됨)

    # 타임아웃 설정 (Unix 시스템만 - Docker/Linux 환경)
    def timeout_handler(signum, frame):
        raise TimeoutError(f"Test execution timeout ({TEST_TIMEOUT_SECONDS}s)")

    if hasattr(_signal, 'SIGALRM'):
        _signal.signal(_signal.SIGALRM, timeout_handler)
        _signal.alarm(TEST_TIMEOUT_SECONDS)

    # 원본 __import__ 저장 (이미 저장되어 있으면 재사용)
    if not hasattr(builtins, '_original_import_qa_arena'):
        builtins._original_import_qa_arena = builtins.__import__

    def _blocked_import(name, globals=None, locals=None, fromlist=(), level=0):
        """위험한 모듈 임포트를 차단합니다."""
        base_name = name.split('.')[0]

        # pytest 내부 모듈은 허용
        if base_name.startswith('_pytest') or base_name.startswith('pytest'):
            return builtins._original_import_qa_arena(name, globals, locals, fromlist, level)

        # importlib는 허용 (pytest가 필요로 함)
        if base_name == 'importlib':
            return builtins._original_import_qa_arena(name, globals, locals, fromlist, level)

        # 위험한 모듈 차단
        if base_name in BLOCKED_MODULES:
            raise ImportError(f"Import of '{name}' is not allowed for security reasons")

        return builtins._original_import_qa_arena(name, globals, locals, fromlist, level)

    # __import__ 오버라이드
    builtins.__import__ = _blocked_import


def pytest_runtest_teardown(item):
    """테스트 실행 후 원본 __import__ 복원 및 타임아웃 해제."""
    import builtins
    import signal as _signal

    # 타임아웃 해제
    if hasattr(_signal, 'SIGALRM'):
        _signal.alarm(0)

    # 원본 __import__ 복원
    if hasattr(builtins, '_original_import_qa_arena'):
        builtins.__import__ = builtins._original_import_qa_arena


#!/usr/bin/env python3
"""Pyodide 라이브러리 호환성 검사 모듈

문제에서 사용하는 라이브러리가 Pyodide(브라우저 WASM 환경)에서
지원되는지 사전에 검증합니다.

사용법:
    # 단일 코드 검사
    python scripts/pyodide_checker.py --code "import numpy"

    # 문제 파일 검사
    python scripts/pyodide_checker.py --problem E01

    # 모든 문제 검사
    python scripts/pyodide_checker.py --all
"""

import ast
import sys
import json
from pathlib import Path
from typing import Set, List, Dict, Any, Tuple
from dataclasses import dataclass, field


# =============================================================================
# Pyodide 지원 패키지 목록 (2024년 12월 기준)
# https://pyodide.org/en/stable/usage/packages-in-pyodide.html
# =============================================================================

PYODIDE_PACKAGES: Set[str] = {
    # 주요 데이터 과학 라이브러리
    "numpy", "pandas", "scipy", "matplotlib", "scikit-learn", "scikit-image",
    "statsmodels", "xgboost", "lightgbm",

    # 웹/네트워크
    "requests", "httpx", "aiohttp", "urllib3", "certifi",
    "fastapi", "starlette",

    # 데이터 처리
    "json", "csv", "yaml", "pyyaml", "toml", "tomli",
    "msgpack", "orjson", "ujson", "simplejson",

    # 테스트
    "pytest", "pytest-asyncio", "pytest-benchmark",

    # 유틸리티
    "tqdm", "click", "rich", "colorama",
    "attrs", "pydantic", "dataclasses",
    "packaging", "setuptools",

    # 암호화/보안
    "cryptography", "bcrypt", "pynacl", "pycryptodome",

    # 이미지
    "pillow", "opencv-python", "imageio",

    # 기타 Pyodide 공식 지원
    "affine", "aiohappyeyeballs", "aiosignal", "altair", "annotated-types",
    "anyio", "apsw", "argon2-cffi", "argon2-cffi-bindings", "asciitree",
    "astropy", "astropy_iers_data", "asttokens", "async-timeout", "atomicwrites",
    "autograd", "awkward-cpp", "b2d", "beautifulsoup4", "bilby.cython",
    "biopython", "bitarray", "bitstring", "bleach", "blosc2", "bokeh",
    "boost-histogram", "brotli", "cachetools", "casadi", "cbor-diag", "cffi",
    "cftime", "charset-normalizer", "clarabel", "cligj", "clingo", "cloudpickle",
    "cmyt", "cobs", "colorspacious", "contourpy", "coolprop", "coverage",
    "cramjam", "crc32c", "css-inline", "cssselect", "cvxpy-base", "cycler",
    "cysignals", "cytoolz", "decorator", "demes", "deprecation", "diskcache",
    "distlib", "distro", "docutils", "donfig", "ewah_bool_utils", "exceptiongroup",
    "executing", "fastcan", "fastparquet", "fiona", "fonttools", "freesasa",
    "frozenlist", "fsspec", "future", "galpy", "gmpy2", "gsw", "h11", "h3",
    "h5py", "highspy", "html5lib", "httpcore", "idna", "igraph", "imgui-bundle",
    "iminuit", "iniconfig", "inspice", "ipython", "jedi", "jinja2", "jiter",
    "joblib", "jsonpatch", "jsonpointer", "jsonschema", "jsonschema_specifications",
    "kiwisolver", "lakers-python", "lazy_loader", "lazy-object-proxy", "libcst",
    "logbook", "lxml", "lz4", "markupsafe", "matplotlib-inline", "memory-allocator",
    "micropip", "mmh3", "more-itertools", "mpmath", "msgspec", "msprime",
    "multidict", "munch", "mypy", "narwhals", "ndindex", "netcdf4", "networkx",
    "newick", "nh3", "nlopt", "nltk", "numcodecs", "openai", "optlang",
    "parso", "patsy", "pcodec", "peewee", "pi-heif", "pillow-heif", "pkgconfig",
    "platformdirs", "pluggy", "ply", "pplpy", "primecountpy", "prompt_toolkit",
    "propcache", "protobuf", "pure-eval", "py", "pyclipper", "pycparser",
    "pydantic_core", "pyerfa", "pygame-ce", "pygments", "pyheif", "pyiceberg",
    "pyinstrument", "pylimer-tools", "pymupdf", "pyodide-http", "pyodide-unix-timezones",
    "pyparsing", "pyrsistent", "pysam", "pyshp", "pytaglib", "pytest_httpx",
    "python-calamine", "python-dateutil", "python-flint", "python-magic",
    "python-sat", "python-solvespace", "pytz", "pywavelets", "pyxel", "pyxirr",
    "rasterio", "rateslib", "rebound", "reboundx", "referencing", "regex",
    "retrying", "river", "robotraconteur", "rpds-py", "ruamel.yaml", "rustworkx",
    "screed", "shapely", "sisl", "six", "smart-open", "sniffio", "sortedcontainers",
    "soundfile", "soupsieve", "sourmash", "soxr", "sparseqr", "sqlalchemy",
    "stack-data", "strictyaml", "svgwrite", "swiglpk", "sympy", "tblib",
    "termcolor", "texttable", "texture2ddecoder", "threadpoolctl", "tiktoken",
    "tomli-w", "toolz", "traitlets", "traits", "tree-sitter", "tree-sitter-go",
    "tree-sitter-java", "tree-sitter-python", "tskit", "typing-extensions",
    "tzdata", "uncertainties", "unyt", "vega-datasets", "vrplib", "wcwidth",
    "webencodings", "wordcloud", "wrapt", "xarray", "xlrd", "xxhash",
    "xyzservices", "yarl", "yt", "zengl", "zfpy", "zstandard",
}

# Python 표준 라이브러리 (항상 사용 가능)
PYTHON_STDLIB: Set[str] = {
    # Built-in Types
    "builtins", "types", "typing", "typing_extensions",

    # Text Processing
    "string", "re", "difflib", "textwrap", "unicodedata", "stringprep",

    # Binary Data
    "struct", "codecs",

    # Data Types
    "datetime", "zoneinfo", "calendar", "collections", "heapq", "bisect",
    "array", "weakref", "copy", "pprint", "reprlib", "enum", "graphlib",

    # Numeric and Math
    "numbers", "math", "cmath", "decimal", "fractions", "random", "statistics",

    # Functional Programming
    "itertools", "functools", "operator",

    # File and Directory
    "pathlib", "fileinput", "stat", "filecmp", "tempfile", "glob", "fnmatch",
    "linecache", "shutil",

    # Data Persistence
    "pickle", "copyreg", "shelve", "marshal", "dbm", "sqlite3",

    # Data Compression
    "zlib", "gzip", "bz2", "lzma", "zipfile", "tarfile",

    # File Formats
    "csv", "configparser", "tomllib", "netrc", "plistlib",

    # Cryptographic
    "hashlib", "hmac", "secrets",

    # OS Services
    "os", "io", "time", "argparse", "getopt", "logging", "getpass", "curses",
    "platform", "errno", "ctypes",

    # Concurrent Execution
    "threading", "multiprocessing", "concurrent", "subprocess", "sched", "queue",
    "contextvars",

    # Networking
    "asyncio", "socket", "ssl", "select", "selectors", "signal",
    "mmap", "email", "json", "mailbox", "mimetypes", "base64", "binascii",
    "quopri", "html", "xml",

    # Internet Data Handling
    "urllib", "http", "ftplib", "poplib", "imaplib", "smtplib", "uuid",

    # Markup Processing
    "html.parser", "html.entities", "xml.etree", "xml.dom", "xml.sax",

    # Development Tools
    "pydoc", "doctest", "unittest", "test",

    # Debugging and Profiling
    "bdb", "faulthandler", "pdb", "profile", "timeit", "trace", "tracemalloc",

    # Runtime Services
    "sys", "dataclasses", "abc", "atexit", "traceback", "gc", "inspect",
    "site",

    # Code Objects
    "code", "codeop", "ast", "symtable", "token", "keyword", "tokenize",
    "tabnanny", "pyclbr", "py_compile", "compileall", "dis", "pickletools",

    # Importing
    "importlib", "pkgutil", "modulefinder", "runpy", "zipimport",

    # Language Services
    "parser", "symbol",

    # Misc
    "formatter", "contextlib", "warnings", "locale", "gettext",
}

# 일반적인 패키지 이름 정규화 (import 이름 -> 패키지 이름)
PACKAGE_ALIASES: Dict[str, str] = {
    "PIL": "pillow",
    "cv2": "opencv-python",
    "sklearn": "scikit-learn",
    "skimage": "scikit-image",
    "yaml": "pyyaml",
    "bs4": "beautifulsoup4",
    "dateutil": "python-dateutil",
}

# QA-Arena 전용 로컬 모듈 (항상 허용)
LOCAL_MODULES: Set[str] = {
    "target",  # 테스트 대상 코드가 담기는 모듈
    "solution",  # 대안 이름
}

# 추가 표준 라이브러리 (PYTHON_STDLIB에서 누락된 것들)
ADDITIONAL_STDLIB: Set[str] = {
    "__future__",  # Future statements
    "__main__",
    "_thread",
    "antigravity",
    "cProfile",
    "cgitb",
    "chunk",
    "cgi",
    "colorsys",
    "compileall",
    "crypt",
    "ensurepip",
    "formatter",
    "ftplib",
    "genericpath",
    "grp",
    "idlelib",
    "imghdr",
    "imp",
    "lib2to3",
    "lzma",
    "macpath",
    "mailcap",
    "nntplib",
    "nturl2path",
    "opcode",
    "optparse",
    "ossaudiodev",
    "pipes",
    "pkgutil",
    "posix",
    "posixpath",
    "pstats",
    "pty",
    "pwd",
    "pydoc_data",
    "resource",
    "rlcompleter",
    "sre_compile",
    "sre_constants",
    "sre_parse",
    "sunau",
    "symtable",
    "sysconfig",
    "telnetlib",
    "termios",
    "this",
    "tkinter",
    "tty",
    "turtle",
    "turtledemo",
    "uu",
    "venv",
    "wave",
    "winreg",
    "winsound",
    "wsgiref",
    "xdrlib",
    "xmlrpc",
    "zipapp",
}


@dataclass
class ImportInfo:
    """import 정보를 담는 데이터 클래스"""
    module: str  # 최상위 모듈명
    full_name: str  # 전체 import 경로
    line_no: int  # 라인 번호
    is_from_import: bool  # from ... import 형태인지


@dataclass
class CompatibilityResult:
    """호환성 검사 결과"""
    compatible: bool = True
    imports: List[ImportInfo] = field(default_factory=list)
    unsupported: List[ImportInfo] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def add_unsupported(self, import_info: ImportInfo, reason: str = ""):
        """지원되지 않는 import 추가"""
        self.unsupported.append(import_info)
        self.compatible = False
        if reason:
            self.warnings.append(f"Line {import_info.line_no}: {import_info.full_name} - {reason}")
        else:
            self.warnings.append(f"Line {import_info.line_no}: '{import_info.module}' is not supported in Pyodide")


class PyodideChecker:
    """Pyodide 호환성 검사기"""

    def __init__(self):
        self.pyodide_packages = PYODIDE_PACKAGES
        self.stdlib = PYTHON_STDLIB | ADDITIONAL_STDLIB
        self.local_modules = LOCAL_MODULES
        self.aliases = PACKAGE_ALIASES

    def extract_imports(self, code: str) -> List[ImportInfo]:
        """
        Python 코드에서 모든 import 문을 추출합니다.

        Args:
            code: Python 소스 코드

        Returns:
            ImportInfo 리스트
        """
        imports = []

        try:
            tree = ast.parse(code)
        except SyntaxError:
            return imports

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module = alias.name.split('.')[0]
                    imports.append(ImportInfo(
                        module=module,
                        full_name=alias.name,
                        line_no=node.lineno,
                        is_from_import=False,
                    ))
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    module = node.module.split('.')[0]
                    imports.append(ImportInfo(
                        module=module,
                        full_name=node.module,
                        line_no=node.lineno,
                        is_from_import=True,
                    ))

        return imports

    def normalize_package_name(self, name: str) -> str:
        """
        패키지 이름을 정규화합니다.

        Args:
            name: import 이름 (예: PIL, cv2, sklearn)

        Returns:
            정규화된 패키지 이름 (예: pillow, opencv-python, scikit-learn)
        """
        return self.aliases.get(name, name.lower())

    def is_supported(self, module: str) -> Tuple[bool, str]:
        """
        모듈이 Pyodide에서 지원되는지 확인합니다.

        Args:
            module: 모듈명

        Returns:
            (지원 여부, 이유)
        """
        # 로컬 모듈 체크 (target, solution 등)
        if module in self.local_modules:
            return True, "QA-Arena local module"

        # 표준 라이브러리 체크
        if module.lower() in self.stdlib or module in self.stdlib:
            return True, "Python standard library"

        # 정규화
        normalized = self.normalize_package_name(module)

        # Pyodide 패키지 체크
        if normalized in self.pyodide_packages:
            return True, "Pyodide package"

        # 소문자로 한번 더 체크
        if normalized.lower() in {p.lower() for p in self.pyodide_packages}:
            return True, "Pyodide package"

        return False, "Not available in Pyodide"

    def check_code(self, code: str) -> CompatibilityResult:
        """
        Python 코드의 Pyodide 호환성을 검사합니다.

        Args:
            code: Python 소스 코드

        Returns:
            CompatibilityResult 객체
        """
        result = CompatibilityResult()
        imports = self.extract_imports(code)
        result.imports = imports

        for imp in imports:
            supported, reason = self.is_supported(imp.module)
            if not supported:
                result.add_unsupported(imp, reason)

        return result

    def check_problem(self, problem_data: Dict[str, Any]) -> Dict[str, CompatibilityResult]:
        """
        문제의 모든 코드를 검사합니다.

        Args:
            problem_data: 문제 JSON 데이터

        Returns:
            {코드 유형: CompatibilityResult} 딕셔너리
        """
        results = {}

        # Golden code 검사
        golden_code = problem_data.get("golden_code", "")
        if golden_code:
            results["golden_code"] = self.check_code(golden_code)

        # Buggy implementations 검사
        buggy_list = problem_data.get("buggy_implementations", [])
        for i, buggy in enumerate(buggy_list):
            code = buggy.get("code", "") if isinstance(buggy, dict) else buggy
            if code:
                results[f"buggy_{i+1}"] = self.check_code(code)

        # Initial test template 검사
        template = problem_data.get("initial_test_template", "")
        if template:
            results["test_template"] = self.check_code(template)

        return results

    def check_problem_file(self, problem_path: Path) -> Dict[str, Any]:
        """
        문제 파일의 Pyodide 호환성을 검사합니다.

        Args:
            problem_path: 문제 JSON 파일 경로

        Returns:
            검사 결과 딕셔너리
        """
        with open(problem_path, "r", encoding="utf-8") as f:
            problem_data = json.load(f)

        results = self.check_problem(problem_data)

        # 결과 요약
        all_compatible = all(r.compatible for r in results.values())
        all_unsupported = []
        for code_type, result in results.items():
            for imp in result.unsupported:
                all_unsupported.append({
                    "code_type": code_type,
                    "module": imp.module,
                    "line": imp.line_no,
                })

        return {
            "problem_id": problem_path.stem,
            "compatible": all_compatible,
            "unsupported_imports": all_unsupported,
            "details": {
                code_type: {
                    "compatible": result.compatible,
                    "imports": [i.module for i in result.imports],
                    "unsupported": [i.module for i in result.unsupported],
                    "warnings": result.warnings,
                }
                for code_type, result in results.items()
            }
        }


def main():
    """메인 함수"""
    import argparse

    parser = argparse.ArgumentParser(description="Pyodide 라이브러리 호환성 검사")
    parser.add_argument("--code", type=str, help="검사할 코드 문자열")
    parser.add_argument("--problem", type=str, help="검사할 문제 ID (예: E01)")
    parser.add_argument("--all", action="store_true", help="모든 문제 검사")
    parser.add_argument("--verbose", "-v", action="store_true", help="상세 출력")

    args = parser.parse_args()

    checker = PyodideChecker()

    # 코드 직접 검사
    if args.code:
        result = checker.check_code(args.code)
        print(f"Compatible: {result.compatible}")
        if result.imports:
            print(f"Imports: {[i.module for i in result.imports]}")
        if result.unsupported:
            print(f"Unsupported: {[i.module for i in result.unsupported]}")
        for warning in result.warnings:
            print(f"  - {warning}")
        sys.exit(0 if result.compatible else 1)

    # 문제 디렉토리
    script_dir = Path(__file__).parent
    problems_dir = script_dir.parent / "generated_problems"

    if not problems_dir.exists():
        print(f"[ERROR] Problems directory not found: {problems_dir}")
        sys.exit(1)

    # 단일 문제 검사
    if args.problem:
        problem_path = problems_dir / f"{args.problem}.json"
        if not problem_path.exists():
            print(f"[ERROR] Problem not found: {problem_path}")
            sys.exit(1)

        result = checker.check_problem_file(problem_path)
        print_result(result, args.verbose)
        sys.exit(0 if result["compatible"] else 1)

    # 모든 문제 검사
    if args.all:
        json_files = sorted(problems_dir.glob("*.json"))

        print("=" * 60)
        print("Pyodide Compatibility Check Report")
        print("=" * 60)
        print()

        compatible_count = 0
        incompatible_problems = []

        for problem_path in json_files:
            result = checker.check_problem_file(problem_path)

            if result["compatible"]:
                compatible_count += 1
                if args.verbose:
                    print(f"[PASS] {result['problem_id']}")
            else:
                incompatible_problems.append(result)
                print(f"[FAIL] {result['problem_id']}")
                for imp in result["unsupported_imports"]:
                    print(f"       - {imp['code_type']}: '{imp['module']}' (line {imp['line']})")

        print()
        print("-" * 60)
        print(f"Total: {len(json_files)} problems")
        print(f"Compatible: {compatible_count}")
        print(f"Incompatible: {len(incompatible_problems)}")

        if incompatible_problems:
            print()
            print("Incompatible problems:")
            for p in incompatible_problems:
                print(f"  - {p['problem_id']}")

        sys.exit(0 if not incompatible_problems else 1)

    # 도움말 출력
    parser.print_help()


def print_result(result: Dict[str, Any], verbose: bool = False):
    """결과를 출력합니다."""
    status = "PASS" if result["compatible"] else "FAIL"
    print(f"[{status}] {result['problem_id']}")

    if not result["compatible"]:
        print("  Unsupported imports:")
        for imp in result["unsupported_imports"]:
            print(f"    - {imp['code_type']}: '{imp['module']}' (line {imp['line']})")

    if verbose:
        print("  Details:")
        for code_type, detail in result["details"].items():
            imports_str = ", ".join(detail["imports"]) if detail["imports"] else "(none)"
            print(f"    {code_type}: {imports_str}")


if __name__ == "__main__":
    main()

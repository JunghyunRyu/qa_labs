/**
 * Monaco Editor Python 자동완성 설정
 * - Python 기본 내장 함수 (print, len, range, type 등)
 * - 제어문 및 구문 (if, for, while, try, def, class 등)
 * - 자주 쓰는 import (os, sys, json, re 등)
 * - 문자열/리스트/딕셔너리 메서드
 * - pytest, unittest 테스트 프레임워크 키워드
 */

import type { Monaco } from "@monaco-editor/react";

// pytest 관련 자동완성 항목
const pytestCompletions = [
  // pytest 데코레이터
  {
    label: "@pytest.fixture",
    insertText: "@pytest.fixture\ndef ${1:fixture_name}():\n    ${2:pass}",
    documentation: "Create a pytest fixture",
  },
  {
    label: "@pytest.mark.parametrize",
    insertText:
      '@pytest.mark.parametrize("${1:param}", [${2:values}])\ndef ${3:test_name}(${1:param}):\n    ${4:pass}',
    documentation: "Parametrize a test function",
  },
  {
    label: "@pytest.mark.skip",
    insertText: '@pytest.mark.skip(reason="${1:reason}")',
    documentation: "Skip a test",
  },
  {
    label: "@pytest.mark.skipif",
    insertText: '@pytest.mark.skipif(${1:condition}, reason="${2:reason}")',
    documentation: "Skip a test conditionally",
  },
  {
    label: "@pytest.mark.xfail",
    insertText: '@pytest.mark.xfail(reason="${1:reason}")',
    documentation: "Mark test as expected to fail",
  },
  // pytest 함수
  {
    label: "pytest.raises",
    insertText: "with pytest.raises(${1:Exception}):\n    ${2:pass}",
    documentation: "Assert that an exception is raised",
  },
  {
    label: "pytest.approx",
    insertText: "pytest.approx(${1:expected}, rel=${2:1e-6})",
    documentation: "Assert approximate equality",
  },
  {
    label: "pytest.fail",
    insertText: 'pytest.fail("${1:message}")',
    documentation: "Fail the test with a message",
  },
  // pytest imports
  {
    label: "import pytest",
    insertText: "import pytest",
    documentation: "Import pytest module",
  },
];

// unittest 관련 자동완성 항목
const unittestCompletions = [
  // unittest 클래스
  {
    label: "class TestCase",
    insertText:
      "class ${1:TestClassName}(unittest.TestCase):\n    def setUp(self):\n        ${2:pass}\n\n    def test_${3:method}(self):\n        ${4:pass}",
    documentation: "Create a unittest TestCase class",
  },
  // unittest 메서드
  {
    label: "setUp",
    insertText: "def setUp(self):\n    ${1:pass}",
    documentation: "Set up test fixtures",
  },
  {
    label: "tearDown",
    insertText: "def tearDown(self):\n    ${1:pass}",
    documentation: "Tear down test fixtures",
  },
  {
    label: "setUpClass",
    insertText: "@classmethod\ndef setUpClass(cls):\n    ${1:pass}",
    documentation: "Set up class-level fixtures",
  },
  {
    label: "tearDownClass",
    insertText: "@classmethod\ndef tearDownClass(cls):\n    ${1:pass}",
    documentation: "Tear down class-level fixtures",
  },
  // unittest assertions
  {
    label: "assertEqual",
    insertText: "self.assertEqual(${1:first}, ${2:second})",
    documentation: "Assert that two values are equal",
  },
  {
    label: "assertNotEqual",
    insertText: "self.assertNotEqual(${1:first}, ${2:second})",
    documentation: "Assert that two values are not equal",
  },
  {
    label: "assertTrue",
    insertText: "self.assertTrue(${1:expr})",
    documentation: "Assert that expression is true",
  },
  {
    label: "assertFalse",
    insertText: "self.assertFalse(${1:expr})",
    documentation: "Assert that expression is false",
  },
  {
    label: "assertIs",
    insertText: "self.assertIs(${1:first}, ${2:second})",
    documentation: "Assert that two objects are the same",
  },
  {
    label: "assertIsNone",
    insertText: "self.assertIsNone(${1:expr})",
    documentation: "Assert that expression is None",
  },
  {
    label: "assertIsNotNone",
    insertText: "self.assertIsNotNone(${1:expr})",
    documentation: "Assert that expression is not None",
  },
  {
    label: "assertIn",
    insertText: "self.assertIn(${1:member}, ${2:container})",
    documentation: "Assert that member is in container",
  },
  {
    label: "assertNotIn",
    insertText: "self.assertNotIn(${1:member}, ${2:container})",
    documentation: "Assert that member is not in container",
  },
  {
    label: "assertIsInstance",
    insertText: "self.assertIsInstance(${1:obj}, ${2:cls})",
    documentation: "Assert that obj is instance of cls",
  },
  {
    label: "assertRaises",
    insertText: "with self.assertRaises(${1:Exception}):\n    ${2:pass}",
    documentation: "Assert that an exception is raised",
  },
  {
    label: "assertAlmostEqual",
    insertText: "self.assertAlmostEqual(${1:first}, ${2:second}, places=${3:7})",
    documentation: "Assert that two values are approximately equal",
  },
  {
    label: "assertGreater",
    insertText: "self.assertGreater(${1:first}, ${2:second})",
    documentation: "Assert that first > second",
  },
  {
    label: "assertGreaterEqual",
    insertText: "self.assertGreaterEqual(${1:first}, ${2:second})",
    documentation: "Assert that first >= second",
  },
  {
    label: "assertLess",
    insertText: "self.assertLess(${1:first}, ${2:second})",
    documentation: "Assert that first < second",
  },
  {
    label: "assertLessEqual",
    insertText: "self.assertLessEqual(${1:first}, ${2:second})",
    documentation: "Assert that first <= second",
  },
  // unittest imports
  {
    label: "import unittest",
    insertText: "import unittest",
    documentation: "Import unittest module",
  },
];

// Python 기본 내장 함수
const pythonBuiltinCompletions = [
  // 출력/입력
  {
    label: "print",
    insertText: 'print(${1:value})',
    documentation: "Print objects to the text stream",
  },
  {
    label: "input",
    insertText: 'input("${1:prompt}")',
    documentation: "Read a line from input",
  },
  // 타입 변환
  {
    label: "int",
    insertText: "int(${1:value})",
    documentation: "Convert to integer",
  },
  {
    label: "float",
    insertText: "float(${1:value})",
    documentation: "Convert to float",
  },
  {
    label: "str",
    insertText: "str(${1:value})",
    documentation: "Convert to string",
  },
  {
    label: "bool",
    insertText: "bool(${1:value})",
    documentation: "Convert to boolean",
  },
  {
    label: "list",
    insertText: "list(${1:iterable})",
    documentation: "Convert to list",
  },
  {
    label: "tuple",
    insertText: "tuple(${1:iterable})",
    documentation: "Convert to tuple",
  },
  {
    label: "dict",
    insertText: "dict(${1:})",
    documentation: "Create a dictionary",
  },
  {
    label: "set",
    insertText: "set(${1:iterable})",
    documentation: "Create a set",
  },
  // 시퀀스 함수
  {
    label: "len",
    insertText: "len(${1:obj})",
    documentation: "Return the length of an object",
  },
  {
    label: "range",
    insertText: "range(${1:stop})",
    documentation: "Return a sequence of numbers",
  },
  {
    label: "range(start, stop)",
    insertText: "range(${1:start}, ${2:stop})",
    documentation: "Return a sequence from start to stop",
  },
  {
    label: "range(start, stop, step)",
    insertText: "range(${1:start}, ${2:stop}, ${3:step})",
    documentation: "Return a sequence with step",
  },
  {
    label: "enumerate",
    insertText: "enumerate(${1:iterable})",
    documentation: "Return enumerate object with index and value",
  },
  {
    label: "zip",
    insertText: "zip(${1:iter1}, ${2:iter2})",
    documentation: "Zip iterables together",
  },
  {
    label: "map",
    insertText: "map(${1:func}, ${2:iterable})",
    documentation: "Apply function to every item",
  },
  {
    label: "filter",
    insertText: "filter(${1:func}, ${2:iterable})",
    documentation: "Filter items by function",
  },
  {
    label: "sorted",
    insertText: "sorted(${1:iterable})",
    documentation: "Return a sorted list",
  },
  {
    label: "sorted(key=)",
    insertText: "sorted(${1:iterable}, key=${2:lambda x: x})",
    documentation: "Return a sorted list with key function",
  },
  {
    label: "reversed",
    insertText: "reversed(${1:seq})",
    documentation: "Return a reverse iterator",
  },
  // 수학 함수
  {
    label: "sum",
    insertText: "sum(${1:iterable})",
    documentation: "Sum of items",
  },
  {
    label: "min",
    insertText: "min(${1:iterable})",
    documentation: "Return minimum value",
  },
  {
    label: "max",
    insertText: "max(${1:iterable})",
    documentation: "Return maximum value",
  },
  {
    label: "abs",
    insertText: "abs(${1:x})",
    documentation: "Return absolute value",
  },
  {
    label: "round",
    insertText: "round(${1:number}, ${2:ndigits})",
    documentation: "Round a number",
  },
  {
    label: "pow",
    insertText: "pow(${1:base}, ${2:exp})",
    documentation: "Return base to the power exp",
  },
  {
    label: "divmod",
    insertText: "divmod(${1:a}, ${2:b})",
    documentation: "Return quotient and remainder",
  },
  // 객체 검사
  {
    label: "type",
    insertText: "type(${1:obj})",
    documentation: "Return the type of an object",
  },
  {
    label: "isinstance",
    insertText: "isinstance(${1:obj}, ${2:classinfo})",
    documentation: "Check if object is an instance",
  },
  {
    label: "hasattr",
    insertText: "hasattr(${1:obj}, '${2:name}')",
    documentation: "Check if object has attribute",
  },
  {
    label: "getattr",
    insertText: "getattr(${1:obj}, '${2:name}')",
    documentation: "Get attribute of object",
  },
  {
    label: "setattr",
    insertText: "setattr(${1:obj}, '${2:name}', ${3:value})",
    documentation: "Set attribute of object",
  },
  {
    label: "callable",
    insertText: "callable(${1:obj})",
    documentation: "Check if object is callable",
  },
  {
    label: "id",
    insertText: "id(${1:obj})",
    documentation: "Return identity of object",
  },
  // 기타
  {
    label: "any",
    insertText: "any(${1:iterable})",
    documentation: "Return True if any element is true",
  },
  {
    label: "all",
    insertText: "all(${1:iterable})",
    documentation: "Return True if all elements are true",
  },
  {
    label: "repr",
    insertText: "repr(${1:obj})",
    documentation: "Return printable representation",
  },
  {
    label: "format",
    insertText: "format(${1:value}, '${2:format_spec}')",
    documentation: "Format a value",
  },
  {
    label: "open",
    insertText: "open('${1:filename}', '${2:r}')",
    documentation: "Open a file",
  },
  {
    label: "with open",
    insertText: "with open('${1:filename}', '${2:r}') as ${3:f}:\n    ${4:pass}",
    documentation: "Open file with context manager",
  },
];

// Python 제어문 및 구문
const pythonControlCompletions = [
  // 조건문
  {
    label: "if",
    insertText: "if ${1:condition}:\n    ${2:pass}",
    documentation: "If statement",
  },
  {
    label: "if else",
    insertText: "if ${1:condition}:\n    ${2:pass}\nelse:\n    ${3:pass}",
    documentation: "If-else statement",
  },
  {
    label: "if elif else",
    insertText: "if ${1:condition}:\n    ${2:pass}\nelif ${3:condition}:\n    ${4:pass}\nelse:\n    ${5:pass}",
    documentation: "If-elif-else statement",
  },
  {
    label: "elif",
    insertText: "elif ${1:condition}:\n    ${2:pass}",
    documentation: "Elif clause",
  },
  {
    label: "else",
    insertText: "else:\n    ${1:pass}",
    documentation: "Else clause",
  },
  // 반복문
  {
    label: "for",
    insertText: "for ${1:item} in ${2:iterable}:\n    ${3:pass}",
    documentation: "For loop",
  },
  {
    label: "for range",
    insertText: "for ${1:i} in range(${2:n}):\n    ${3:pass}",
    documentation: "For loop with range",
  },
  {
    label: "for enumerate",
    insertText: "for ${1:i}, ${2:item} in enumerate(${3:iterable}):\n    ${4:pass}",
    documentation: "For loop with enumerate",
  },
  {
    label: "while",
    insertText: "while ${1:condition}:\n    ${2:pass}",
    documentation: "While loop",
  },
  {
    label: "while True",
    insertText: "while True:\n    ${1:pass}\n    if ${2:condition}:\n        break",
    documentation: "Infinite loop with break",
  },
  // 예외 처리
  {
    label: "try except",
    insertText: "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}",
    documentation: "Try-except block",
  },
  {
    label: "try except finally",
    insertText: "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}\nfinally:\n    ${5:pass}",
    documentation: "Try-except-finally block",
  },
  {
    label: "try except else",
    insertText: "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:pass}\nelse:\n    ${5:pass}",
    documentation: "Try-except-else block",
  },
  {
    label: "raise",
    insertText: 'raise ${1:Exception}("${2:message}")',
    documentation: "Raise an exception",
  },
  // 함수/클래스 정의
  {
    label: "def",
    insertText: "def ${1:function_name}(${2:params}):\n    ${3:pass}",
    documentation: "Define a function",
  },
  {
    label: "def -> return",
    insertText: "def ${1:function_name}(${2:params}) -> ${3:type}:\n    ${4:pass}",
    documentation: "Define a function with return type",
  },
  {
    label: "async def",
    insertText: "async def ${1:function_name}(${2:params}):\n    ${3:pass}",
    documentation: "Define an async function",
  },
  {
    label: "lambda",
    insertText: "lambda ${1:x}: ${2:x}",
    documentation: "Lambda expression",
  },
  {
    label: "class",
    insertText: "class ${1:ClassName}:\n    def __init__(self${2:, params}):\n        ${3:pass}",
    documentation: "Define a class",
  },
  {
    label: "class(inherit)",
    insertText: "class ${1:ClassName}(${2:BaseClass}):\n    def __init__(self${3:, params}):\n        super().__init__(${4:})\n        ${5:pass}",
    documentation: "Define a class with inheritance",
  },
  // 데코레이터
  {
    label: "@property",
    insertText: "@property\ndef ${1:name}(self):\n    return self._${1:name}",
    documentation: "Property decorator",
  },
  {
    label: "@staticmethod",
    insertText: "@staticmethod\ndef ${1:method_name}(${2:params}):\n    ${3:pass}",
    documentation: "Static method decorator",
  },
  {
    label: "@classmethod",
    insertText: "@classmethod\ndef ${1:method_name}(cls${2:, params}):\n    ${3:pass}",
    documentation: "Class method decorator",
  },
  // 컴프리헨션
  {
    label: "list comprehension",
    insertText: "[${1:expr} for ${2:item} in ${3:iterable}]",
    documentation: "List comprehension",
  },
  {
    label: "list comprehension if",
    insertText: "[${1:expr} for ${2:item} in ${3:iterable} if ${4:condition}]",
    documentation: "List comprehension with condition",
  },
  {
    label: "dict comprehension",
    insertText: "{${1:key}: ${2:value} for ${3:item} in ${4:iterable}}",
    documentation: "Dictionary comprehension",
  },
  {
    label: "set comprehension",
    insertText: "{${1:expr} for ${2:item} in ${3:iterable}}",
    documentation: "Set comprehension",
  },
  {
    label: "generator expression",
    insertText: "(${1:expr} for ${2:item} in ${3:iterable})",
    documentation: "Generator expression",
  },
  // Context manager
  {
    label: "with",
    insertText: "with ${1:context} as ${2:var}:\n    ${3:pass}",
    documentation: "With statement",
  },
];

// Python 자주 쓰는 import
const pythonImportCompletions = [
  {
    label: "import os",
    insertText: "import os",
    documentation: "Import os module",
  },
  {
    label: "import sys",
    insertText: "import sys",
    documentation: "Import sys module",
  },
  {
    label: "import json",
    insertText: "import json",
    documentation: "Import json module",
  },
  {
    label: "import re",
    insertText: "import re",
    documentation: "Import re (regex) module",
  },
  {
    label: "import math",
    insertText: "import math",
    documentation: "Import math module",
  },
  {
    label: "import random",
    insertText: "import random",
    documentation: "Import random module",
  },
  {
    label: "import datetime",
    insertText: "from datetime import datetime, timedelta",
    documentation: "Import datetime classes",
  },
  {
    label: "import collections",
    insertText: "from collections import ${1:defaultdict, Counter, deque}",
    documentation: "Import from collections",
  },
  {
    label: "import itertools",
    insertText: "import itertools",
    documentation: "Import itertools module",
  },
  {
    label: "import functools",
    insertText: "from functools import ${1:reduce, lru_cache}",
    documentation: "Import from functools",
  },
  {
    label: "import typing",
    insertText: "from typing import ${1:List, Dict, Optional, Union, Tuple}",
    documentation: "Import type hints",
  },
  {
    label: "import pathlib",
    insertText: "from pathlib import Path",
    documentation: "Import Path from pathlib",
  },
  {
    label: "import copy",
    insertText: "import copy",
    documentation: "Import copy module",
  },
  {
    label: "from ... import",
    insertText: "from ${1:module} import ${2:name}",
    documentation: "Import specific names from module",
  },
  {
    label: "import ... as",
    insertText: "import ${1:module} as ${2:alias}",
    documentation: "Import module with alias",
  },
];

// Python 문자열 메서드
const pythonStringCompletions = [
  {
    label: ".format()",
    insertText: '.format(${1:args})',
    documentation: "Format string with arguments",
  },
  {
    label: "f-string",
    insertText: 'f"${1:text} {${2:expr}}"',
    documentation: "Formatted string literal",
  },
  {
    label: ".split()",
    insertText: ".split('${1:sep}')",
    documentation: "Split string into list",
  },
  {
    label: ".join()",
    insertText: "'${1:sep}'.join(${2:iterable})",
    documentation: "Join iterable with separator",
  },
  {
    label: ".strip()",
    insertText: ".strip()",
    documentation: "Remove leading/trailing whitespace",
  },
  {
    label: ".replace()",
    insertText: ".replace('${1:old}', '${2:new}')",
    documentation: "Replace substring",
  },
  {
    label: ".startswith()",
    insertText: ".startswith('${1:prefix}')",
    documentation: "Check if starts with prefix",
  },
  {
    label: ".endswith()",
    insertText: ".endswith('${1:suffix}')",
    documentation: "Check if ends with suffix",
  },
  {
    label: ".find()",
    insertText: ".find('${1:sub}')",
    documentation: "Find substring index",
  },
  {
    label: ".upper()",
    insertText: ".upper()",
    documentation: "Convert to uppercase",
  },
  {
    label: ".lower()",
    insertText: ".lower()",
    documentation: "Convert to lowercase",
  },
  {
    label: ".title()",
    insertText: ".title()",
    documentation: "Convert to title case",
  },
  {
    label: ".isdigit()",
    insertText: ".isdigit()",
    documentation: "Check if all digits",
  },
  {
    label: ".isalpha()",
    insertText: ".isalpha()",
    documentation: "Check if all alphabetic",
  },
];

// Python 리스트/딕셔너리 메서드
const pythonCollectionCompletions = [
  // 리스트 메서드
  {
    label: ".append()",
    insertText: ".append(${1:item})",
    documentation: "Add item to end of list",
  },
  {
    label: ".extend()",
    insertText: ".extend(${1:iterable})",
    documentation: "Extend list with iterable",
  },
  {
    label: ".insert()",
    insertText: ".insert(${1:index}, ${2:item})",
    documentation: "Insert item at index",
  },
  {
    label: ".remove()",
    insertText: ".remove(${1:item})",
    documentation: "Remove first occurrence of item",
  },
  {
    label: ".pop()",
    insertText: ".pop(${1:index})",
    documentation: "Remove and return item at index",
  },
  {
    label: ".index()",
    insertText: ".index(${1:item})",
    documentation: "Return index of item",
  },
  {
    label: ".count()",
    insertText: ".count(${1:item})",
    documentation: "Count occurrences of item",
  },
  {
    label: ".sort()",
    insertText: ".sort()",
    documentation: "Sort list in place",
  },
  {
    label: ".sort(key=)",
    insertText: ".sort(key=${1:lambda x: x})",
    documentation: "Sort list with key function",
  },
  {
    label: ".reverse()",
    insertText: ".reverse()",
    documentation: "Reverse list in place",
  },
  {
    label: ".copy()",
    insertText: ".copy()",
    documentation: "Return shallow copy",
  },
  {
    label: ".clear()",
    insertText: ".clear()",
    documentation: "Remove all items",
  },
  // 딕셔너리 메서드
  {
    label: ".get()",
    insertText: ".get('${1:key}', ${2:default})",
    documentation: "Get value with default",
  },
  {
    label: ".keys()",
    insertText: ".keys()",
    documentation: "Return dictionary keys",
  },
  {
    label: ".values()",
    insertText: ".values()",
    documentation: "Return dictionary values",
  },
  {
    label: ".items()",
    insertText: ".items()",
    documentation: "Return dictionary items",
  },
  {
    label: ".update()",
    insertText: ".update(${1:other})",
    documentation: "Update dictionary",
  },
  {
    label: ".setdefault()",
    insertText: ".setdefault('${1:key}', ${2:default})",
    documentation: "Set default value for key",
  },
  {
    label: ".pop(key)",
    insertText: ".pop('${1:key}')",
    documentation: "Remove and return value for key",
  },
  // 집합 메서드
  {
    label: ".add()",
    insertText: ".add(${1:item})",
    documentation: "Add item to set",
  },
  {
    label: ".discard()",
    insertText: ".discard(${1:item})",
    documentation: "Remove item from set if present",
  },
  {
    label: ".union()",
    insertText: ".union(${1:other})",
    documentation: "Return union of sets",
  },
  {
    label: ".intersection()",
    insertText: ".intersection(${1:other})",
    documentation: "Return intersection of sets",
  },
  {
    label: ".difference()",
    insertText: ".difference(${1:other})",
    documentation: "Return difference of sets",
  },
];

// Python 기본 테스트 관련 키워드
const pythonTestCompletions = [
  {
    label: "def test_",
    insertText: "def test_${1:name}(${2}):\n    ${3:pass}",
    documentation: "Create a test function",
  },
  {
    label: "assert",
    insertText: "assert ${1:condition}, '${2:message}'",
    documentation: "Assert statement",
  },
  {
    label: "assert ==",
    insertText: "assert ${1:actual} == ${2:expected}",
    documentation: "Assert equality",
  },
  {
    label: "assert !=",
    insertText: "assert ${1:actual} != ${2:expected}",
    documentation: "Assert inequality",
  },
  {
    label: "assert in",
    insertText: "assert ${1:item} in ${2:container}",
    documentation: "Assert membership",
  },
  {
    label: "assert not in",
    insertText: "assert ${1:item} not in ${2:container}",
    documentation: "Assert non-membership",
  },
  {
    label: "assert is",
    insertText: "assert ${1:obj} is ${2:other}",
    documentation: "Assert identity",
  },
  {
    label: "assert is None",
    insertText: "assert ${1:obj} is None",
    documentation: "Assert None",
  },
  {
    label: "assert is not None",
    insertText: "assert ${1:obj} is not None",
    documentation: "Assert not None",
  },
];

/**
 * Monaco Editor에 Python 자동완성 등록
 */
export function registerPythonCompletions(monaco: Monaco): void {
  const allCompletions = [
    ...pythonBuiltinCompletions,
    ...pythonControlCompletions,
    ...pythonImportCompletions,
    ...pythonStringCompletions,
    ...pythonCollectionCompletions,
    ...pytestCompletions,
    ...unittestCompletions,
    ...pythonTestCompletions,
  ];

  monaco.languages.registerCompletionItemProvider("python", {
    provideCompletionItems: (
      model: Parameters<Parameters<typeof monaco.languages.registerCompletionItemProvider>[1]["provideCompletionItems"]>[0],
      position: Parameters<Parameters<typeof monaco.languages.registerCompletionItemProvider>[1]["provideCompletionItems"]>[1]
    ) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = allCompletions.map((item) => ({
        label: item.label,
        kind: item.insertText.includes("def ") || item.insertText.includes("class ")
          ? monaco.languages.CompletionItemKind.Function
          : item.label.startsWith("@")
          ? monaco.languages.CompletionItemKind.Property
          : item.label.startsWith("import")
          ? monaco.languages.CompletionItemKind.Module
          : monaco.languages.CompletionItemKind.Snippet,
        insertText: item.insertText,
        insertTextRules:
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: item.documentation,
        range,
      }));

      return { suggestions };
    },
  });
}

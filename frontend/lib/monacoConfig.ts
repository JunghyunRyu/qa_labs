/**
 * Monaco Editor Python 자동완성 설정
 * pytest, unittest 등 테스트 프레임워크 키워드 포함
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

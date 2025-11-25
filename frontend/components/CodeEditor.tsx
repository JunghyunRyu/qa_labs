/** Code Editor component using Monaco Editor */

"use client";

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  height?: string;
  readOnly?: boolean;
  language?: string;
}

export default function CodeEditor({
  value,
  onChange,
  height = "400px",
  readOnly = false,
  language = "python",
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Python 언어 설정
    if (language === "python") {
      editor.updateOptions({
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-light"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          tabSize: 4,
          insertSpaces: true,
        }}
      />
    </div>
  );
}


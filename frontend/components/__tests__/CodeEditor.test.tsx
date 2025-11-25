/** CodeEditor component tests */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CodeEditor from "../CodeEditor";

// Mock Monaco Editor
jest.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: ({ value, onChange, height, language, options }: any) => {
    return (
      <div data-testid="monaco-editor">
        <textarea
          data-testid="code-input"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ height }}
        />
        <div data-testid="language">{language}</div>
        <div data-testid="readonly">{options?.readOnly ? "true" : "false"}</div>
      </div>
    );
  },
}));

describe("CodeEditor", () => {
  it("should render with initial value", () => {
    render(<CodeEditor value="test code" />);
    expect(screen.getByTestId("monaco-editor")).toBeInTheDocument();
    expect(screen.getByTestId("code-input")).toHaveValue("test code");
  });

  it("should call onChange when value changes", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<CodeEditor value="" onChange={handleChange} />);

    const input = screen.getByTestId("code-input");
    await user.type(input, "new code");

    expect(handleChange).toHaveBeenCalled();
  });

  it("should render with Python language by default", () => {
    render(<CodeEditor value="" />);
    expect(screen.getByTestId("language")).toHaveTextContent("python");
  });

  it("should be editable by default", () => {
    render(<CodeEditor value="" />);
    expect(screen.getByTestId("readonly")).toHaveTextContent("false");
  });

  it("should be read-only when readOnly prop is true", () => {
    render(<CodeEditor value="" readOnly />);
    expect(screen.getByTestId("readonly")).toHaveTextContent("true");
  });

  it("should use custom height", () => {
    render(<CodeEditor value="" height="500px" />);
    const input = screen.getByTestId("code-input");
    expect(input).toHaveStyle({ height: "500px" });
  });
});


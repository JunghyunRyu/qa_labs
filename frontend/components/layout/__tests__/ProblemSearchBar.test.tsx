/**
 * ProblemSearchBar 컴포넌트 테스트
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProblemSearchBar, {
  ProblemSearchBarProps,
} from "../ProblemSearchBar";

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Search: () => <span data-testid="icon-search">Search</span>,
  X: () => <span data-testid="icon-x">X</span>,
  ChevronUp: () => <span data-testid="icon-up">Up</span>,
  ChevronDown: () => <span data-testid="icon-down">Down</span>,
  CaseSensitive: () => <span data-testid="icon-case">Case</span>,
}));

describe("ProblemSearchBar", () => {
  const defaultProps: ProblemSearchBarProps = {
    query: "",
    onQueryChange: jest.fn(),
    currentIndex: 0,
    totalCount: 0,
    caseSensitive: false,
    onToggleCaseSensitive: jest.fn(),
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render search input", () => {
    render(<ProblemSearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText("검색어 입력...")).toBeInTheDocument();
  });

  it("should focus input on mount", () => {
    render(<ProblemSearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText("검색어 입력...")).toHaveFocus();
  });

  it("should show match counter when matches exist", () => {
    render(
      <ProblemSearchBar
        {...defaultProps}
        query="test"
        currentIndex={2}
        totalCount={10}
      />
    );
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });

  it('should show "0개 결과" when no matches with query', () => {
    render(
      <ProblemSearchBar {...defaultProps} query="test" totalCount={0} />
    );
    expect(screen.getByText("0개 결과")).toBeInTheDocument();
  });

  it("should not show counter when query is empty", () => {
    render(<ProblemSearchBar {...defaultProps} query="" totalCount={0} />);
    expect(screen.queryByTestId("match-counter")).not.toBeInTheDocument();
  });

  it("should call onQueryChange on input", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} />);

    await user.type(screen.getByPlaceholderText("검색어 입력..."), "hello");

    expect(defaultProps.onQueryChange).toHaveBeenCalledTimes(5);
    expect(defaultProps.onQueryChange).toHaveBeenLastCalledWith("o");
  });

  it("should call onNext on Enter", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} totalCount={3} />);

    const input = screen.getByPlaceholderText("검색어 입력...");
    await user.click(input);
    await user.keyboard("{Enter}");

    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it("should call onPrev on Shift+Enter", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} totalCount={3} />);

    const input = screen.getByPlaceholderText("검색어 입력...");
    await user.click(input);
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(defaultProps.onPrev).toHaveBeenCalled();
  });

  it("should call onClose on Escape", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("검색어 입력...");
    await user.click(input);
    await user.keyboard("{Escape}");

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should call onToggleCaseSensitive on button click", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} />);

    await user.click(screen.getByTitle("대소문자 구분 (Aa)"));

    expect(defaultProps.onToggleCaseSensitive).toHaveBeenCalled();
  });

  it("should navigate with buttons", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} totalCount={3} />);

    await user.click(screen.getByLabelText("다음 매치"));
    expect(defaultProps.onNext).toHaveBeenCalled();

    await user.click(screen.getByLabelText("이전 매치"));
    expect(defaultProps.onPrev).toHaveBeenCalled();
  });

  it("should disable navigation when no matches", () => {
    render(<ProblemSearchBar {...defaultProps} totalCount={0} />);

    expect(screen.getByLabelText("다음 매치")).toBeDisabled();
    expect(screen.getByLabelText("이전 매치")).toBeDisabled();
  });

  it("should enable navigation when matches exist", () => {
    render(<ProblemSearchBar {...defaultProps} totalCount={3} />);

    expect(screen.getByLabelText("다음 매치")).not.toBeDisabled();
    expect(screen.getByLabelText("이전 매치")).not.toBeDisabled();
  });

  it("should call onClose on close button click", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} />);

    await user.click(screen.getByLabelText("검색 닫기"));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should show case sensitive active state", () => {
    render(<ProblemSearchBar {...defaultProps} caseSensitive={true} />);

    const button = screen.getByTestId("case-sensitive-toggle");
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveClass("bg-blue-100");
  });

  it("should show case sensitive inactive state", () => {
    render(<ProblemSearchBar {...defaultProps} caseSensitive={false} />);

    const button = screen.getByTestId("case-sensitive-toggle");
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).not.toHaveClass("bg-blue-100");
  });

  it("should have proper aria labels for accessibility", () => {
    render(<ProblemSearchBar {...defaultProps} />);

    expect(screen.getByLabelText("문제 내 검색")).toBeInTheDocument();
    expect(screen.getByLabelText("이전 매치")).toBeInTheDocument();
    expect(screen.getByLabelText("다음 매치")).toBeInTheDocument();
    expect(screen.getByLabelText("검색 닫기")).toBeInTheDocument();
  });

  it("should call onNext on Ctrl+F in input", async () => {
    const user = userEvent.setup();
    render(<ProblemSearchBar {...defaultProps} totalCount={3} />);

    const input = screen.getByPlaceholderText("검색어 입력...");
    await user.click(input);
    await user.keyboard("{Control>}f{/Control}");

    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it("should render with query value", () => {
    render(<ProblemSearchBar {...defaultProps} query="hello" />);

    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("should show correct index when navigating", () => {
    render(
      <ProblemSearchBar
        {...defaultProps}
        query="test"
        currentIndex={4}
        totalCount={10}
      />
    );

    // 0-indexed currentIndex를 1-indexed로 표시
    expect(screen.getByText("5/10")).toBeInTheDocument();
  });
});

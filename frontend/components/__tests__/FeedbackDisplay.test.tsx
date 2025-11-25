/** FeedbackDisplay component tests */

import { render, screen } from "@testing-library/react";
import FeedbackDisplay from "../FeedbackDisplay";

describe("FeedbackDisplay", () => {
  const mockFeedback = {
    summary: "기본적인 테스트 케이스는 잘 작성되었지만, 경계값 테스트가 부족합니다.",
    strengths: [
      "정상 흐름에 대한 테스트를 잘 작성했습니다.",
      "함수의 기본 동작을 검증하는 테스트가 있습니다.",
    ],
    weaknesses: [
      "경계값(빈 리스트, 0)에 대한 케이스가 없습니다.",
      "음수 입력에 대한 테스트가 부족합니다.",
    ],
    suggested_tests: [
      "빈 리스트([]) 입력에 대한 테스트를 추가해 보세요.",
      "음수가 포함된 리스트([-1, 1, 2])에 대한 테스트를 추가해 보세요.",
    ],
    score_adjustment: 0,
  };

  it("should render feedback summary", () => {
    render(<FeedbackDisplay feedback={mockFeedback} />);
    expect(screen.getByText("AI 피드백")).toBeInTheDocument();
    expect(screen.getByText(mockFeedback.summary)).toBeInTheDocument();
  });

  it("should render strengths", () => {
    render(<FeedbackDisplay feedback={mockFeedback} />);
    expect(screen.getByText("잘한 점")).toBeInTheDocument();
    mockFeedback.strengths.forEach((strength) => {
      expect(screen.getByText(strength)).toBeInTheDocument();
    });
  });

  it("should render weaknesses", () => {
    render(<FeedbackDisplay feedback={mockFeedback} />);
    expect(screen.getByText("개선할 점")).toBeInTheDocument();
    mockFeedback.weaknesses.forEach((weakness) => {
      expect(screen.getByText(weakness)).toBeInTheDocument();
    });
  });

  it("should render suggested tests", () => {
    render(<FeedbackDisplay feedback={mockFeedback} />);
    expect(screen.getByText("제안된 테스트")).toBeInTheDocument();
    mockFeedback.suggested_tests.forEach((test) => {
      expect(screen.getByText(test)).toBeInTheDocument();
    });
  });

  it("should not render score adjustment when 0", () => {
    render(<FeedbackDisplay feedback={mockFeedback} />);
    expect(screen.queryByText(/점수 조정/)).not.toBeInTheDocument();
  });

  it("should render score adjustment when not 0", () => {
    const feedbackWithAdjustment = {
      ...mockFeedback,
      score_adjustment: 5,
    };
    render(<FeedbackDisplay feedback={feedbackWithAdjustment} />);
    expect(screen.getByText(/점수 조정/)).toBeInTheDocument();
    expect(screen.getByText(/\+5점/)).toBeInTheDocument();
  });

  it("should handle empty strengths", () => {
    const feedbackWithoutStrengths = {
      ...mockFeedback,
      strengths: [],
    };
    render(<FeedbackDisplay feedback={feedbackWithoutStrengths} />);
    expect(screen.queryByText("잘한 점")).not.toBeInTheDocument();
  });

  it("should handle empty weaknesses", () => {
    const feedbackWithoutWeaknesses = {
      ...mockFeedback,
      weaknesses: [],
    };
    render(<FeedbackDisplay feedback={feedbackWithoutWeaknesses} />);
    expect(screen.queryByText("개선할 점")).not.toBeInTheDocument();
  });
});


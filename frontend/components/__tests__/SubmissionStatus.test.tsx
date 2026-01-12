/** SubmissionStatus component tests */

import { render, screen } from "@testing-library/react";
import SubmissionStatus from "../SubmissionStatus";

describe("SubmissionStatus", () => {
  it("should render PENDING status", () => {
    render(<SubmissionStatus status="PENDING" />);
    expect(screen.getByText("대기 중")).toBeInTheDocument();
  });

  it("should render RUNNING status", () => {
    render(<SubmissionStatus status="RUNNING" />);
    expect(screen.getByText("채점 중")).toBeInTheDocument();
  });

  it("should render SUCCESS status", () => {
    render(<SubmissionStatus status="SUCCESS" />);
    expect(screen.getByText("완료")).toBeInTheDocument();
  });

  it("should render FAILURE status", () => {
    render(<SubmissionStatus status="FAILURE" />);
    expect(screen.getByText("실패")).toBeInTheDocument();
  });

  it("should render ERROR status", () => {
    render(<SubmissionStatus status="ERROR" />);
    expect(screen.getByText("오류")).toBeInTheDocument();
  });
});


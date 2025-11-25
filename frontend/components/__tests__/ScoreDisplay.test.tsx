/** ScoreDisplay component tests */

import { render, screen } from "@testing-library/react";
import ScoreDisplay from "../ScoreDisplay";

describe("ScoreDisplay", () => {
  it("should render score", () => {
    render(<ScoreDisplay score={75} />);
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("/ 100점")).toBeInTheDocument();
  });

  it("should render kill ratio when provided", () => {
    render(
      <ScoreDisplay score={80} killedMutants={8} totalMutants={10} />
    );
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("8 / 10 (80.0%)")).toBeInTheDocument();
  });

  it("should not render kill ratio when not provided", () => {
    render(<ScoreDisplay score={75} />);
    expect(screen.queryByText(/Mutant Kill Ratio/)).not.toBeInTheDocument();
  });

  it("should calculate kill ratio correctly", () => {
    render(
      <ScoreDisplay score={90} killedMutants={5} totalMutants={10} />
    );
    expect(screen.getByText("5 / 10 (50.0%)")).toBeInTheDocument();
  });
});


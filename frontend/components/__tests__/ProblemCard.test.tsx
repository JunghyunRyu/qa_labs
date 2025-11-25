/** ProblemCard component tests */

import { render, screen } from '@testing-library/react';
import ProblemCard from '../ProblemCard';
import type { ProblemListItem } from '@/types/problem';

const mockProblem: ProblemListItem = {
  id: 1,
  slug: 'test-problem',
  title: 'Test Problem',
  difficulty: 'Easy',
  skills: ['Python', 'Algorithm'],
};

describe('ProblemCard', () => {
  it('should render problem title', () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
  });

  it('should render difficulty badge', () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText('Easy')).toBeInTheDocument();
  });

  it('should render skills when provided', () => {
    render(<ProblemCard problem={mockProblem} />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Algorithm')).toBeInTheDocument();
  });

  it('should render link to problem detail page', () => {
    render(<ProblemCard problem={mockProblem} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/problems/1');
  });

  it('should handle problem without skills', () => {
    const problemWithoutSkills = { ...mockProblem, skills: undefined };
    render(<ProblemCard problem={problemWithoutSkills} />);
    expect(screen.getByText('Test Problem')).toBeInTheDocument();
  });
});


/** Problem detail page tests */

import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import ProblemDetailPage from '../page';
import { getProblem } from '@/lib/api/problems';
import { ApiError } from '@/lib/api';
import type { Problem } from '@/types/problem';

jest.mock('next/navigation');
jest.mock('@/lib/api/problems');

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockGetProblem = getProblem as jest.MockedFunction<typeof getProblem>;

describe('ProblemDetailPage', () => {
  const mockProblem: Problem = {
    id: 1,
    slug: 'test-problem',
    title: 'Test Problem',
    description_md: '# 문제 설명\n\n이것은 테스트 문제입니다.',
    function_signature: 'def solve(nums: List[int]) -> int:',
    golden_code: 'def solve(nums):\n    return sum(nums)',
    difficulty: 'Easy',
    skills: ['Python', 'Algorithm'],
    created_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
  });

  it('should render loading state initially', () => {
    mockGetProblem.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { container } = render(<ProblemDetailPage />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render problem details', async () => {
    mockGetProblem.mockResolvedValue(mockProblem);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Problem')).toBeInTheDocument();
      expect(screen.getByText('함수 시그니처')).toBeInTheDocument();
      expect(screen.getByText('문제 설명')).toBeInTheDocument();
      expect(screen.getByText('def solve(nums: List[int]) -> int:')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Python')).toBeInTheDocument();
      expect(screen.getByText('Algorithm')).toBeInTheDocument();
    });
  });

  it('should render error message for invalid problem ID', async () => {
    mockUseParams.mockReturnValue({ id: 'invalid' });
    
    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('잘못된 문제 ID입니다.')).toBeInTheDocument();
    });
  });

  it('should render error message on API error', async () => {
    const error = new ApiError(404, 'Not Found', { detail: 'Problem not found' });
    mockGetProblem.mockRejectedValue(error);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Problem not found|문제를 불러오는데 실패했습니다/)).toBeInTheDocument();
    });
  });

  it('should handle different HTTP error status codes', async () => {
    const error500 = new ApiError(500, 'Internal Server Error', { detail: 'Server error' });
    mockGetProblem.mockRejectedValue(error500);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Server error|문제를 불러오는데 실패했습니다/)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network request failed');
    mockGetProblem.mockRejectedValue(networkError);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network request failed|문제를 불러오는데 실패했습니다/)).toBeInTheDocument();
    });
  });

  it('should handle error without detail message', async () => {
    const error = new ApiError(500, 'Internal Server Error');
    mockGetProblem.mockRejectedValue(error);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      // detail이 없으면 ApiError.message를 사용 (API Error: 500 Internal Server Error)
      expect(screen.getByText(/API Error: 500 Internal Server Error/)).toBeInTheDocument();
    });
  });

  it('should render problem without skills', async () => {
    const problemWithoutSkills = { ...mockProblem, skills: undefined };
    mockGetProblem.mockResolvedValue(problemWithoutSkills);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Problem')).toBeInTheDocument();
      expect(screen.queryByText('Python')).not.toBeInTheDocument();
    });
  });

  it('should render markdown description', async () => {
    mockGetProblem.mockResolvedValue(mockProblem);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('문제 설명')).toBeInTheDocument();
      // react-markdown renders markdown, so we check for the content
      expect(screen.getByText(/이것은 테스트 문제입니다/)).toBeInTheDocument();
    });
  });

  it('should render golden code in details section', async () => {
    mockGetProblem.mockResolvedValue(mockProblem);

    render(<ProblemDetailPage />);

    await waitFor(() => {
      const detailsButton = screen.getByText('정답 코드 보기 (참고용)');
      expect(detailsButton).toBeInTheDocument();
    });
  });
});


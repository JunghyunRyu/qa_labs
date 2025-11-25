/** Problems list page tests */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProblemsPage from '../page';
import { getProblems } from '@/lib/api/problems';
import { ApiError } from '@/lib/api';
import type { ProblemListResponse } from '@/types/problem';

jest.mock('@/lib/api/problems');

const mockGetProblems = getProblems as jest.MockedFunction<typeof getProblems>;

describe('ProblemsPage', () => {
  const mockProblemsResponse: ProblemListResponse = {
    problems: [
      {
        id: 1,
        slug: 'test-problem-1',
        title: 'Test Problem 1',
        difficulty: 'Easy',
        skills: ['Python'],
      },
      {
        id: 2,
        slug: 'test-problem-2',
        title: 'Test Problem 2',
        difficulty: 'Medium',
        skills: ['Algorithm'],
      },
    ],
    total: 2,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockGetProblems.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    const { container } = render(<ProblemsPage />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render problems list', async () => {
    mockGetProblems.mockResolvedValue(mockProblemsResponse);

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('문제 목록')).toBeInTheDocument();
      expect(screen.getByText('총 2개의 문제가 있습니다.')).toBeInTheDocument();
      expect(screen.getByText('Test Problem 1')).toBeInTheDocument();
      expect(screen.getByText('Test Problem 2')).toBeInTheDocument();
    });
  });

  it('should render empty state when no problems', async () => {
    const emptyResponse: ProblemListResponse = {
      problems: [],
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 0,
    };
    mockGetProblems.mockResolvedValue(emptyResponse);

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('등록된 문제가 없습니다.')).toBeInTheDocument();
    });
  });

  it('should render error message on API error', async () => {
    const error = new ApiError(500, 'Internal Server Error', { detail: 'Server error' });
    mockGetProblems.mockRejectedValue(error);

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Server error|문제 목록을 불러오는데 실패했습니다/)).toBeInTheDocument();
    });
  });

  it('should handle different HTTP error status codes', async () => {
    const error400 = new ApiError(400, 'Bad Request', { detail: 'Invalid request' });
    mockGetProblems.mockRejectedValue(error400);

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Invalid request|문제 목록을 불러오는데 실패했습니다/)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network request failed');
    mockGetProblems.mockRejectedValue(networkError);

    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network request failed|문제 목록을 불러오는데 실패했습니다/)).toBeInTheDocument();
    });
  });

  it('should handle error without detail message', async () => {
    const error = new ApiError(500, 'Internal Server Error');
    mockGetProblems.mockRejectedValue(error);

    render(<ProblemsPage />);

    await waitFor(() => {
      // detail이 없으면 ApiError.message를 사용 (API Error: 500 Internal Server Error)
      expect(screen.getByText(/API Error: 500 Internal Server Error/)).toBeInTheDocument();
    });
  });

  it('should handle pagination', async () => {
    const page1Response: ProblemListResponse = {
      problems: [
        {
          id: 1,
          slug: 'test-problem-1',
          title: 'Test Problem 1',
          difficulty: 'Easy',
        },
      ],
      total: 3,
      page: 1,
      page_size: 10,
      total_pages: 2,
    };

    const page2Response: ProblemListResponse = {
      problems: [
        {
          id: 3,
          slug: 'test-problem-3',
          title: 'Test Problem 3',
          difficulty: 'Hard',
        },
      ],
      total: 3,
      page: 2,
      page_size: 10,
      total_pages: 2,
    };

    mockGetProblems
      .mockResolvedValueOnce(page1Response)
      .mockResolvedValueOnce(page2Response);

    const user = userEvent.setup();
    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Problem 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('다음');
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockGetProblems).toHaveBeenCalledTimes(2);
      expect(mockGetProblems).toHaveBeenLastCalledWith(2, 10);
    });
  });

  it('should disable pagination buttons appropriately', async () => {
    // total_pages가 1일 때는 페이징 UI가 렌더링되지 않음
    mockGetProblems.mockResolvedValue(mockProblemsResponse);

    render(<ProblemsPage />);

    await waitFor(() => {
      // total_pages가 1이므로 페이징 버튼이 렌더링되지 않아야 함
      expect(screen.queryByText('이전')).not.toBeInTheDocument();
      expect(screen.queryByText('다음')).not.toBeInTheDocument();
    });
  });

  it('should disable prev button on first page', async () => {
    const firstPageResponse: ProblemListResponse = {
      problems: [
        {
          id: 1,
          slug: 'test-problem-1',
          title: 'Test Problem 1',
          difficulty: 'Easy',
        },
      ],
      total: 3,
      page: 1,
      page_size: 10,
      total_pages: 2,
    };

    mockGetProblems.mockResolvedValue(firstPageResponse);

    render(<ProblemsPage />);

    await waitFor(() => {
      const prevButton = screen.getByText('이전');
      const nextButton = screen.getByText('다음');
      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('should disable next button on last page', async () => {
    const firstPageResponse: ProblemListResponse = {
      problems: [
        {
          id: 1,
          slug: 'test-problem-1',
          title: 'Test Problem 1',
          difficulty: 'Easy',
        },
      ],
      total: 3,
      page: 1,
      page_size: 10,
      total_pages: 2,
    };

    const lastPageResponse: ProblemListResponse = {
      problems: [
        {
          id: 3,
          slug: 'test-problem-3',
          title: 'Test Problem 3',
          difficulty: 'Hard',
        },
      ],
      total: 3,
      page: 2,
      page_size: 10,
      total_pages: 2,
    };

    mockGetProblems
      .mockResolvedValueOnce(firstPageResponse)
      .mockResolvedValueOnce(lastPageResponse);

    const user = userEvent.setup();
    render(<ProblemsPage />);

    // 첫 페이지에서 다음 버튼 클릭
    await waitFor(() => {
      expect(screen.getByText('Test Problem 1')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('다음');
    await user.click(nextButton);

    // 마지막 페이지에서 버튼 상태 확인
    await waitFor(() => {
      const prevButton = screen.getByText('이전');
      const nextButton = screen.getByText('다음');
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  it('should retry on error when retry button is clicked', async () => {
    const error = new ApiError(500, 'Internal Server Error');
    mockGetProblems
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(mockProblemsResponse);

    const user = userEvent.setup();
    render(<ProblemsPage />);

    await waitFor(() => {
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('다시 시도');
    await user.click(retryButton);

    await waitFor(() => {
      expect(mockGetProblems).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Test Problem 1')).toBeInTheDocument();
    });
  });
});


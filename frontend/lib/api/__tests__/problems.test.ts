/** Problems API client tests */

import { getProblems, getProblem } from '../problems';
import { get } from '../../api';
import { ApiError } from '../../api';
import type { Problem, ProblemListResponse } from '@/types/problem';

jest.mock('../../api');

describe('Problems API', () => {
  const mockGet = get as jest.MockedFunction<typeof get>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProblems', () => {
    it('should fetch problems list with default pagination', async () => {
      const mockResponse: ProblemListResponse = {
        problems: [
          {
            id: 1,
            slug: 'test-problem',
            title: 'Test Problem',
            difficulty: 'Easy',
            skills: ['Python'],
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
        total_pages: 1,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await getProblems();

      expect(mockGet).toHaveBeenCalledWith('/api/v1/problems?page=1&page_size=10');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch problems list with custom pagination', async () => {
      const mockResponse: ProblemListResponse = {
        problems: [],
        total: 0,
        page: 2,
        page_size: 20,
        total_pages: 0,
      };

      mockGet.mockResolvedValue(mockResponse);

      const result = await getProblems(2, 20);

      expect(mockGet).toHaveBeenCalledWith('/api/v1/problems?page=2&page_size=20');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API call fails', async () => {
      const error = new ApiError(500, 'Internal Server Error', { detail: 'Server error' });
      mockGet.mockRejectedValue(error);

      await expect(getProblems()).rejects.toBeInstanceOf(ApiError);
      await expect(getProblems()).rejects.toEqual(error);
    });
  });

  describe('getProblem', () => {
    it('should fetch problem by ID', async () => {
      const mockProblem: Problem = {
        id: 1,
        slug: 'test-problem',
        title: 'Test Problem',
        description_md: '# Test',
        function_signature: 'def test():',
        golden_code: 'def test():\n    pass',
        difficulty: 'Easy',
        skills: ['Python'],
        created_at: '2024-01-01T00:00:00Z',
      };

      mockGet.mockResolvedValue(mockProblem);

      const result = await getProblem(1);

      expect(mockGet).toHaveBeenCalledWith('/api/v1/problems/1');
      expect(result).toEqual(mockProblem);
    });

    it('should throw error when problem not found', async () => {
      const error = new ApiError(404, 'Not Found', { detail: 'Problem not found' });
      mockGet.mockRejectedValue(error);

      await expect(getProblem(999)).rejects.toBeInstanceOf(ApiError);
      await expect(getProblem(999)).rejects.toEqual(error);
    });
  });
});


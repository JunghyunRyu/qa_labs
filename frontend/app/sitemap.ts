import { MetadataRoute } from 'next'

interface ProblemListItem {
  slug: string;
  difficulty: string;
}

interface ProblemListResponse {
  problems: ProblemListItem[];
  total: number;
}

async function getProblemsForSitemap(): Promise<ProblemListItem[]> {
  // 프로덕션에서는 외부 URL 사용 (컨테이너 내부 통신 이슈 회피)
  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://qa-arena.qalabs.kr/api'
    : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')

  try {
    const response = await fetch(`${apiUrl}/v1/problems?page=1&page_size=1000`, {
      next: { revalidate: 3600 }, // 1시간마다 재검증
    })

    if (!response.ok) {
      console.error('Failed to fetch problems for sitemap:', response.status)
      return []
    }

    const data: ProblemListResponse = await response.json()
    return data.problems
  } catch (error) {
    console.error('Error fetching problems for sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://qa-arena.qalabs.kr'

  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/problems`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/oss`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ]

  // 동적 문제 페이지
  const problems = await getProblemsForSitemap()
  const problemPages: MetadataRoute.Sitemap = problems.map((problem) => ({
    url: `${baseUrl}/problems/${problem.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...problemPages]
}

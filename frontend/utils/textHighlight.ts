/**
 * DOM 기반 텍스트 하이라이트 유틸리티
 * TreeWalker API를 사용하여 텍스트 노드를 탐색하고 mark 태그로 하이라이트
 */

export interface HighlightResult {
  marks: HTMLElement[];
  totalCount: number;
}

export interface MatchInfo {
  mark: HTMLElement;
  sectionId: string | null;
}

/**
 * 정규식 특수문자 이스케이프
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 요소가 숨겨져 있는지 확인 (display: none)
 * 아코디언 내부 검색을 위해 visibility는 체크하지 않음
 */
function isElementHidden(element: HTMLElement): boolean {
  // mark 태그 내부이거나 script/style 내부면 제외
  if (
    element.tagName === 'MARK' ||
    element.tagName === 'SCRIPT' ||
    element.tagName === 'STYLE'
  ) {
    return true;
  }
  return false;
}

/**
 * 노드의 가장 가까운 section-id를 찾음
 */
function findSectionId(node: Node): string | null {
  let element: HTMLElement | null = node.parentElement;
  while (element) {
    if (element.dataset.sectionId) {
      return element.dataset.sectionId;
    }
    element = element.parentElement;
  }
  return null;
}

/**
 * 컨테이너 내 텍스트 노드를 순회하며 검색어를 <mark>로 감싸기
 */
export function highlightText(
  container: HTMLElement,
  query: string,
  caseSensitive: boolean
): HighlightResult {
  // 1. 기존 하이라이트 제거
  clearHighlights(container);

  if (!query.trim()) {
    return { marks: [], totalCount: 0 };
  }

  const marks: HTMLElement[] = [];
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapeRegExp(query), flags);

  // 2. TreeWalker로 텍스트 노드 수집
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        // mark, script, style 태그 내부 제외
        if (isElementHidden(parent)) {
          return NodeFilter.FILTER_REJECT;
        }

        // 빈 텍스트 노드 제외
        if (!node.textContent?.trim()) {
          return NodeFilter.FILTER_SKIP;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // 3. 역순으로 처리 (인덱스 변경 방지)
  for (let i = textNodes.length - 1; i >= 0; i--) {
    const textNode = textNodes[i];
    const text = textNode.textContent || '';

    // 매치 찾기
    const matchRanges: { start: number; end: number }[] = [];
    let match: RegExpExecArray | null;
    regex.lastIndex = 0; // 정규식 인덱스 리셋

    while ((match = regex.exec(text)) !== null) {
      matchRanges.push({
        start: match.index,
        end: match.index + match[0].length,
      });

      // 최대 매치 수 제한 (성능)
      if (marks.length + matchRanges.length >= 100) {
        break;
      }
    }

    // 전체 매치 수 제한 체크
    if (marks.length >= 100) {
      break;
    }

    // 역순으로 래핑 (앞에서부터 하면 인덱스 틀어짐)
    for (let j = matchRanges.length - 1; j >= 0; j--) {
      const { start, end } = matchRanges[j];

      try {
        const range = document.createRange();
        range.setStart(textNode, start);
        range.setEnd(textNode, end);

        const mark = document.createElement('mark');
        mark.className = 'search-highlight';
        mark.dataset.searchMatch = 'true';

        range.surroundContents(mark);
        marks.unshift(mark); // 순서 유지
      } catch {
        // surroundContents가 실패할 수 있음 (노드 경계를 넘는 경우)
        continue;
      }
    }
  }

  return { marks, totalCount: marks.length };
}

/**
 * 하이라이트와 함께 섹션 정보도 반환
 */
export function highlightTextWithSections(
  container: HTMLElement,
  query: string,
  caseSensitive: boolean
): { matches: MatchInfo[]; totalCount: number } {
  const result = highlightText(container, query, caseSensitive);

  const matches: MatchInfo[] = result.marks.map((mark) => ({
    mark,
    sectionId: findSectionId(mark),
  }));

  return { matches, totalCount: result.totalCount };
}

/**
 * 기존 하이라이트 제거
 */
export function clearHighlights(container: HTMLElement): void {
  const marks = container.querySelectorAll('mark[data-search-match]');

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      // mark 내용을 텍스트 노드로 교체
      const text = document.createTextNode(mark.textContent || '');
      parent.replaceChild(text, mark);
      // 인접 텍스트 노드 병합
      parent.normalize();
    }
  });
}

/**
 * 현재 하이라이트 설정 및 스크롤
 */
export function setCurrentHighlight(
  marks: HTMLElement[],
  index: number
): void {
  // 모든 mark에서 current 클래스 제거
  marks.forEach((mark, i) => {
    mark.classList.toggle('search-highlight-current', i === index);
  });

  // 현재 매치로 스크롤
  if (marks[index]) {
    marks[index].scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}

/**
 * 특정 섹션에 매치가 있는지 확인
 */
export function getSectionsWithMatches(matches: MatchInfo[]): Set<string> {
  const sections = new Set<string>();
  matches.forEach((match) => {
    if (match.sectionId) {
      sections.add(match.sectionId);
    }
  });
  return sections;
}

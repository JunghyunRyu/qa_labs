/**
 * textHighlight 유틸리티 테스트
 */

import {
  escapeRegExp,
  highlightText,
  clearHighlights,
  setCurrentHighlight,
  highlightTextWithSections,
  getSectionsWithMatches,
} from '../textHighlight';

describe('textHighlight utils', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('escapeRegExp', () => {
    it('should escape regex special characters', () => {
      expect(escapeRegExp('hello')).toBe('hello');
      expect(escapeRegExp('hello.world')).toBe('hello\\.world');
      expect(escapeRegExp('(test)')).toBe('\\(test\\)');
      expect(escapeRegExp('[a-z]')).toBe('\\[a-z\\]');
      expect(escapeRegExp('a*b+c?')).toBe('a\\*b\\+c\\?');
      expect(escapeRegExp('$100')).toBe('\\$100');
      expect(escapeRegExp('^start')).toBe('\\^start');
      expect(escapeRegExp('a|b')).toBe('a\\|b');
      expect(escapeRegExp('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should handle empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });
  });

  describe('highlightText', () => {
    it('should highlight all occurrences', () => {
      container.innerHTML = '<p>Hello World, Hello Universe</p>';
      const result = highlightText(container, 'Hello', false);

      expect(result.totalCount).toBe(2);
      expect(result.marks).toHaveLength(2);
      expect(container.querySelectorAll('mark')).toHaveLength(2);
    });

    it('should be case-insensitive by default', () => {
      container.innerHTML = '<p>Hello hello HELLO</p>';
      const result = highlightText(container, 'hello', false);

      expect(result.totalCount).toBe(3);
    });

    it('should be case-sensitive when enabled', () => {
      container.innerHTML = '<p>Hello hello HELLO</p>';
      const result = highlightText(container, 'hello', true);

      expect(result.totalCount).toBe(1);
      expect(result.marks[0].textContent).toBe('hello');
    });

    it('should handle nested elements', () => {
      container.innerHTML =
        '<div><p>Hello</p><span>World Hello</span></div>';
      const result = highlightText(container, 'Hello', false);

      expect(result.totalCount).toBe(2);
    });

    it('should return empty for no matches', () => {
      container.innerHTML = '<p>Hello World</p>';
      const result = highlightText(container, 'xyz', false);

      expect(result.totalCount).toBe(0);
      expect(result.marks).toHaveLength(0);
    });

    it('should escape regex special characters in query', () => {
      container.innerHTML = '<p>Hello (World)</p>';
      const result = highlightText(container, '(World)', false);

      expect(result.totalCount).toBe(1);
      expect(result.marks[0].textContent).toBe('(World)');
    });

    it('should handle empty query', () => {
      container.innerHTML = '<p>Hello World</p>';
      const result = highlightText(container, '', false);

      expect(result.totalCount).toBe(0);
      expect(result.marks).toHaveLength(0);
    });

    it('should handle whitespace-only query', () => {
      container.innerHTML = '<p>Hello World</p>';
      const result = highlightText(container, '   ', false);

      expect(result.totalCount).toBe(0);
    });

    it('should not highlight inside script or style tags', () => {
      container.innerHTML = `
        <p>Hello World</p>
        <script>const hello = "test";</script>
        <style>.hello { color: red; }</style>
      `;
      const result = highlightText(container, 'hello', false);

      expect(result.totalCount).toBe(1);
    });

    it('should add correct classes to mark elements', () => {
      container.innerHTML = '<p>Hello World</p>';
      const result = highlightText(container, 'Hello', false);

      expect(result.marks[0].classList.contains('search-highlight')).toBe(
        true
      );
      expect(result.marks[0].dataset.searchMatch).toBe('true');
    });

    it('should limit matches to 100', () => {
      // 101개의 매치가 있는 텍스트 생성
      const text = 'test '.repeat(101);
      container.innerHTML = `<p>${text}</p>`;
      const result = highlightText(container, 'test', false);

      expect(result.totalCount).toBeLessThanOrEqual(100);
    });

    it('should handle multiple text nodes in same element', () => {
      container.innerHTML = '<p>Hello <strong>Hello</strong> Hello</p>';
      const result = highlightText(container, 'Hello', false);

      expect(result.totalCount).toBe(3);
    });

    it('should preserve order of matches', () => {
      container.innerHTML = '<p>First Second Third</p>';
      highlightText(container, 'First', false);
      highlightText(container, 'Second', false);

      const marks = container.querySelectorAll('mark');
      expect(marks[0].textContent).toBe('Second');
    });
  });

  describe('clearHighlights', () => {
    it('should remove all mark elements', () => {
      container.innerHTML =
        '<p><mark data-search-match="true">Hello</mark> World</p>';
      clearHighlights(container);

      expect(container.querySelectorAll('mark')).toHaveLength(0);
      expect(container.textContent).toBe('Hello World');
    });

    it('should normalize text nodes after clearing', () => {
      container.innerHTML =
        '<p><mark data-search-match="true">Hel</mark>lo World</p>';
      clearHighlights(container);

      const p = container.querySelector('p');
      // 텍스트 노드가 병합되어야 함
      expect(p?.childNodes.length).toBe(1);
      expect(p?.textContent).toBe('Hello World');
    });

    it('should only remove marks with data-search-match attribute', () => {
      container.innerHTML =
        '<p><mark>Keep this</mark> <mark data-search-match="true">Remove this</mark></p>';
      clearHighlights(container);

      const marks = container.querySelectorAll('mark');
      expect(marks).toHaveLength(1);
      expect(marks[0].textContent).toBe('Keep this');
    });

    it('should handle empty container', () => {
      container.innerHTML = '';
      expect(() => clearHighlights(container)).not.toThrow();
    });

    it('should handle nested marks', () => {
      container.innerHTML = `
        <p>
          <mark data-search-match="true">First</mark>
          <span><mark data-search-match="true">Second</mark></span>
        </p>
      `;
      clearHighlights(container);

      expect(container.querySelectorAll('mark')).toHaveLength(0);
    });
  });

  describe('setCurrentHighlight', () => {
    it('should add current class to specified index', () => {
      const marks = [
        document.createElement('mark'),
        document.createElement('mark'),
        document.createElement('mark'),
      ];
      // jsdom doesn't have scrollIntoView, so mock it
      marks.forEach((mark) => {
        mark.classList.add('search-highlight');
        mark.scrollIntoView = jest.fn();
      });

      setCurrentHighlight(marks, 1);

      expect(
        marks[0].classList.contains('search-highlight-current')
      ).toBe(false);
      expect(
        marks[1].classList.contains('search-highlight-current')
      ).toBe(true);
      expect(
        marks[2].classList.contains('search-highlight-current')
      ).toBe(false);
    });

    it('should remove current class from previous highlight', () => {
      const marks = [
        document.createElement('mark'),
        document.createElement('mark'),
      ];
      // jsdom doesn't have scrollIntoView, so mock it
      marks.forEach((mark) => {
        mark.scrollIntoView = jest.fn();
      });

      setCurrentHighlight(marks, 0);
      expect(
        marks[0].classList.contains('search-highlight-current')
      ).toBe(true);

      setCurrentHighlight(marks, 1);
      expect(
        marks[0].classList.contains('search-highlight-current')
      ).toBe(false);
      expect(
        marks[1].classList.contains('search-highlight-current')
      ).toBe(true);
    });

    it('should handle empty marks array', () => {
      expect(() => setCurrentHighlight([], 0)).not.toThrow();
    });

    it('should handle out of bounds index', () => {
      const marks = [document.createElement('mark')];
      expect(() => setCurrentHighlight(marks, 5)).not.toThrow();
    });

    it('should call scrollIntoView on current mark', () => {
      const mark = document.createElement('mark');
      mark.scrollIntoView = jest.fn();
      container.appendChild(mark);

      setCurrentHighlight([mark], 0);

      expect(mark.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });
  });

  describe('highlightTextWithSections', () => {
    it('should return section ids for matches', () => {
      container.innerHTML = `
        <div data-section-id="section1">
          <p>Hello World</p>
        </div>
        <div data-section-id="section2">
          <p>Hello Universe</p>
        </div>
      `;

      const result = highlightTextWithSections(container, 'Hello', false);

      expect(result.totalCount).toBe(2);
      expect(result.matches[0].sectionId).toBe('section1');
      expect(result.matches[1].sectionId).toBe('section2');
    });

    it('should return null for matches without section', () => {
      container.innerHTML = '<p>Hello World</p>';

      const result = highlightTextWithSections(container, 'Hello', false);

      expect(result.matches[0].sectionId).toBeNull();
    });

    it('should find nested section ids', () => {
      container.innerHTML = `
        <div data-section-id="outer">
          <div>
            <p>Hello World</p>
          </div>
        </div>
      `;

      const result = highlightTextWithSections(container, 'Hello', false);

      expect(result.matches[0].sectionId).toBe('outer');
    });
  });

  describe('getSectionsWithMatches', () => {
    it('should return set of unique section ids', () => {
      const matches = [
        { mark: document.createElement('mark'), sectionId: 'section1' },
        { mark: document.createElement('mark'), sectionId: 'section2' },
        { mark: document.createElement('mark'), sectionId: 'section1' },
      ];

      const sections = getSectionsWithMatches(matches);

      expect(sections.size).toBe(2);
      expect(sections.has('section1')).toBe(true);
      expect(sections.has('section2')).toBe(true);
    });

    it('should ignore null section ids', () => {
      const matches = [
        { mark: document.createElement('mark'), sectionId: null },
        { mark: document.createElement('mark'), sectionId: 'section1' },
      ];

      const sections = getSectionsWithMatches(matches);

      expect(sections.size).toBe(1);
      expect(sections.has('section1')).toBe(true);
    });

    it('should return empty set for no matches', () => {
      const sections = getSectionsWithMatches([]);

      expect(sections.size).toBe(0);
    });
  });
});

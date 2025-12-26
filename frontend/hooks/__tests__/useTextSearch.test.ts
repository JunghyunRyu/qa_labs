/**
 * useTextSearch 훅 테스트
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useTextSearch } from "../useTextSearch";
import * as textHighlight from "@/utils/textHighlight";

// Mock textHighlight 유틸리티
jest.mock("@/utils/textHighlight", () => ({
  highlightTextWithSections: jest.fn(() => ({
    matches: [],
    totalCount: 0,
  })),
  clearHighlights: jest.fn(),
  setCurrentHighlight: jest.fn(),
  getSectionsWithMatches: jest.fn(() => new Set()),
}));

describe("useTextSearch", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should start closed", () => {
    const ref = { current: container };
    const { result } = renderHook(() => useTextSearch({ containerRef: ref }));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe("");
    expect(result.current.totalCount).toBe(0);
  });

  it("should open and close", () => {
    const ref = { current: container };
    const { result } = renderHook(() => useTextSearch({ containerRef: ref }));

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("should toggle", () => {
    const ref = { current: container };
    const { result } = renderHook(() => useTextSearch({ containerRef: ref }));

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it("should set query", () => {
    const ref = { current: container };
    const { result } = renderHook(() => useTextSearch({ containerRef: ref }));

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    expect(result.current.query).toBe("test");
  });

  it("should toggle case sensitivity", () => {
    const ref = { current: container };
    const { result } = renderHook(() => useTextSearch({ containerRef: ref }));

    expect(result.current.caseSensitive).toBe(false);

    act(() => result.current.toggleCaseSensitive());
    expect(result.current.caseSensitive).toBe(true);

    act(() => result.current.toggleCaseSensitive());
    expect(result.current.caseSensitive).toBe(false);
  });

  it("should debounce search", async () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 100 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    // 즉시는 호출되지 않음
    expect(textHighlight.highlightTextWithSections).not.toHaveBeenCalled();

    // debounce 후 호출
    await waitFor(() => {
      expect(textHighlight.highlightTextWithSections).toHaveBeenCalledWith(
        container,
        "test",
        false
      );
    });
  });

  it("should not search when closed", async () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    // 열지 않고 쿼리 설정
    act(() => result.current.setQuery("test"));

    // debounce 대기
    await new Promise((r) => setTimeout(r, 100));

    expect(textHighlight.highlightTextWithSections).not.toHaveBeenCalled();
  });

  it("should clear highlights when closing", async () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    // 검색 완료 대기
    await waitFor(() => {
      expect(textHighlight.highlightTextWithSections).toHaveBeenCalled();
    });

    act(() => result.current.close());

    expect(textHighlight.clearHighlights).toHaveBeenCalledWith(container);
    expect(result.current.query).toBe("");
  });

  it("should navigate through matches", async () => {
    const mockMarks = [
      document.createElement("mark"),
      document.createElement("mark"),
      document.createElement("mark"),
    ];
    mockMarks.forEach((m) => (m.scrollIntoView = jest.fn()));

    const mockMatches = mockMarks.map((mark) => ({ mark, sectionId: null }));

    (textHighlight.highlightTextWithSections as jest.Mock).mockReturnValue({
      matches: mockMatches,
      totalCount: 3,
    });

    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    // 검색 완료 대기
    await waitFor(() => {
      expect(result.current.totalCount).toBe(3);
    });

    expect(result.current.currentIndex).toBe(0);

    act(() => result.current.goNext());
    expect(result.current.currentIndex).toBe(1);

    act(() => result.current.goNext());
    expect(result.current.currentIndex).toBe(2);

    act(() => result.current.goNext()); // wrap around
    expect(result.current.currentIndex).toBe(0);
  });

  it("should navigate backwards", async () => {
    const mockMarks = [
      document.createElement("mark"),
      document.createElement("mark"),
      document.createElement("mark"),
    ];
    mockMarks.forEach((m) => (m.scrollIntoView = jest.fn()));

    const mockMatches = mockMarks.map((mark) => ({ mark, sectionId: null }));

    (textHighlight.highlightTextWithSections as jest.Mock).mockReturnValue({
      matches: mockMatches,
      totalCount: 3,
    });

    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    await waitFor(() => {
      expect(result.current.totalCount).toBe(3);
    });

    act(() => result.current.goPrev()); // wrap around from 0 to 2
    expect(result.current.currentIndex).toBe(2);

    act(() => result.current.goPrev());
    expect(result.current.currentIndex).toBe(1);
  });

  it("should call setCurrentHighlight on navigation", async () => {
    const mockMarks = [
      document.createElement("mark"),
      document.createElement("mark"),
    ];
    mockMarks.forEach((m) => (m.scrollIntoView = jest.fn()));

    const mockMatches = mockMarks.map((mark) => ({ mark, sectionId: null }));

    (textHighlight.highlightTextWithSections as jest.Mock).mockReturnValue({
      matches: mockMatches,
      totalCount: 2,
    });

    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    await waitFor(() => {
      expect(result.current.totalCount).toBe(2);
    });

    // 초기 호출 (인덱스 0)
    expect(textHighlight.setCurrentHighlight).toHaveBeenCalledWith(
      mockMarks,
      0
    );

    act(() => result.current.goNext());

    expect(textHighlight.setCurrentHighlight).toHaveBeenCalledWith(
      mockMarks,
      1
    );
  });

  it("should not navigate when no matches", () => {
    const ref = { current: container };
    const { result } = renderHook(() => useTextSearch({ containerRef: ref }));

    act(() => result.current.open());

    // 매치가 없을 때 네비게이션 시도
    act(() => result.current.goNext());
    expect(result.current.currentIndex).toBe(0);

    act(() => result.current.goPrev());
    expect(result.current.currentIndex).toBe(0);
  });

  it("should call onSectionsToOpen when matches found", async () => {
    const mockMarks = [document.createElement("mark")];
    mockMarks[0].scrollIntoView = jest.fn();

    (textHighlight.highlightTextWithSections as jest.Mock).mockReturnValue({
      matches: [{ mark: mockMarks[0], sectionId: "section1" }],
      totalCount: 1,
    });

    (textHighlight.getSectionsWithMatches as jest.Mock).mockReturnValue(
      new Set(["section1"])
    );

    const onSectionsToOpen = jest.fn();
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({
        containerRef: ref,
        debounceMs: 50,
        onSectionsToOpen,
      })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    await waitFor(() => {
      expect(onSectionsToOpen).toHaveBeenCalledWith(new Set(["section1"]));
    });
  });

  it("should clear query and reset on close", async () => {
    const mockMarks = [document.createElement("mark")];
    mockMarks[0].scrollIntoView = jest.fn();

    (textHighlight.highlightTextWithSections as jest.Mock).mockReturnValue({
      matches: [{ mark: mockMarks[0], sectionId: null }],
      totalCount: 1,
    });

    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("test"));

    await waitFor(() => {
      expect(result.current.totalCount).toBe(1);
    });

    act(() => result.current.close());

    expect(result.current.query).toBe("");
    expect(result.current.totalCount).toBe(0);
    expect(result.current.currentIndex).toBe(0);
  });

  it("should handle case sensitive toggle triggering new search", async () => {
    const ref = { current: container };
    const { result } = renderHook(() =>
      useTextSearch({ containerRef: ref, debounceMs: 50 })
    );

    act(() => result.current.open());
    act(() => result.current.setQuery("Test"));

    await waitFor(() => {
      expect(textHighlight.highlightTextWithSections).toHaveBeenCalledWith(
        container,
        "Test",
        false
      );
    });

    (textHighlight.highlightTextWithSections as jest.Mock).mockClear();

    act(() => result.current.toggleCaseSensitive());

    await waitFor(() => {
      expect(textHighlight.highlightTextWithSections).toHaveBeenCalledWith(
        container,
        "Test",
        true
      );
    });
  });
});

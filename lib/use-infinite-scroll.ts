// lib/use-infinite-scroll.ts
import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** 다음 페이지 로드 함수 */
  onLoadMore: () => void;
  /** 더 불러올 데이터가 있는지 */
  hasMore: boolean;
  /** 로딩 중인지 */
  isLoading: boolean;
  /** 뷰포트 하단에서 얼마나 떨어져 있을 때 로드할지 (px) */
  threshold?: number;
  /** root margin (Intersection Observer) */
  rootMargin?: string;
}

/**
 * 무한 스크롤을 위한 커스텀 훅
 * Intersection Observer를 사용하여 요소가 뷰포트에 들어오면 다음 페이지 로드
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 100,
  rootMargin = '100px',
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null, // viewport
      rootMargin,
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin]);

  return { loadMoreRef };
}

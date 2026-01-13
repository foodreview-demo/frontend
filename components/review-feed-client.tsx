// components/review-feed-client.tsx
"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { ReviewFeedSkeleton } from "@/components/review-card-skeleton"
import { api, Review } from "@/lib/api"
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { RegionSelection } from "@/components/map-region-selector"
import { useFeedSettings } from "@/lib/feed-settings-context"
import { useInfiniteScroll } from "@/lib/use-infinite-scroll"

interface ReviewFeedClientProps {
  initialReviews: Review[];
  selectedRegion: RegionSelection;
  selectedCategory: string;
}

const PAGE_SIZE = 20;

export function ReviewFeedClient({ initialReviews, selectedRegion, selectedCategory }: ReviewFeedClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const searchParams = useSearchParams();
  const { showVerifiedOnly, showFollowingOnly } = useFeedSettings();

  // 인증된 리뷰만 필터링 (isReceiptVerified가 true인 경우)
  const filteredReviews = useMemo(() => {
    if (!showVerifiedOnly) return reviews;
    return reviews.filter(review => review.isReceiptVerified === true);
  }, [reviews, showVerifiedOnly]);

  // Pull-to-refresh 상태
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const PULL_THRESHOLD = 80; // 새로고침 트리거 거리

  // 다음 페이지 로드
  const loadMoreReviews = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const result = await api.getReviews(
        showFollowingOnly ? undefined : (selectedRegion.region !== "전체" ? selectedRegion.region : undefined),
        selectedCategory !== "전체" ? selectedCategory : undefined,
        nextPage,
        PAGE_SIZE,
        showFollowingOnly ? undefined : selectedRegion.district,
        showFollowingOnly ? undefined : selectedRegion.neighborhood,
        showFollowingOnly
      );
      if (result.success) {
        const newReviews = result.data.content;
        setReviews(prev => [...prev, ...newReviews]);
        setPage(nextPage);
        setHasMore(!result.data.last);
      }
    } catch (err) {
      console.error("추가 리뷰 로드 실패:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, selectedRegion, selectedCategory, showFollowingOnly]);

  // 무한 스크롤 훅
  const { loadMoreRef } = useInfiniteScroll({
    onLoadMore: loadMoreReviews,
    hasMore,
    isLoading: isLoadingMore,
  });

  // 리뷰 새로고침 함수
  const refreshReviews = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const result = await api.getReviews(
        showFollowingOnly ? undefined : (selectedRegion.region !== "전체" ? selectedRegion.region : undefined),
        selectedCategory !== "전체" ? selectedCategory : undefined,
        0,
        PAGE_SIZE,
        showFollowingOnly ? undefined : selectedRegion.district,
        showFollowingOnly ? undefined : selectedRegion.neighborhood,
        showFollowingOnly
      );
      if (result.success) {
        setReviews(result.data.content);
        setPage(0);
        setHasMore(!result.data.last);
      }
    } catch (err) {
      console.error("리뷰 로드 실패:", err);
      setError("리뷰를 불러오는데 실패했습니다");
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [selectedRegion, selectedCategory, showFollowingOnly]);

  // 리뷰 작성 후 돌아왔을 때 새로고침
  useEffect(() => {
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      refreshReviews();
      // URL에서 refresh 파라미터 제거
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, refreshReviews]);

  // 필터 변경 시 리뷰 로드 (초기화)
  useEffect(() => {
    // 팔로잉 모드가 아니고, 전체 지역 + 전체 카테고리이고, 초기 리뷰가 있으면 그대로 사용
    const isDefaultFilter = !showFollowingOnly &&
                            selectedRegion.region === "전체" &&
                            !selectedRegion.district &&
                            !selectedRegion.neighborhood &&
                            selectedCategory === "전체";

    if (isDefaultFilter && initialReviews.length > 0 && !isRefreshing) {
      setReviews(initialReviews);
      setPage(0);
      setHasMore(initialReviews.length >= PAGE_SIZE);
      setIsLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.getReviews(
          showFollowingOnly ? undefined : (selectedRegion.region !== "전체" ? selectedRegion.region : undefined),
          selectedCategory !== "전체" ? selectedCategory : undefined,
          0,
          PAGE_SIZE,
          showFollowingOnly ? undefined : selectedRegion.district,
          showFollowingOnly ? undefined : selectedRegion.neighborhood,
          showFollowingOnly
        );
        if (result.success) {
          setReviews(result.data.content);
          setPage(0);
          setHasMore(!result.data.last);
        }
      } catch (err) {
        console.error("리뷰 로드 실패:", err);
        setError("리뷰를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [selectedRegion, selectedCategory, initialReviews, isRefreshing, showFollowingOnly]);

  // Pull-to-refresh 시작 (공통)
  const handlePullStart = useCallback((clientY: number) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 0) {
      startYRef.current = clientY;
      isPullingRef.current = true;
    }
  }, []);

  // Pull-to-refresh 이동 (공통)
  const handlePullMove = useCallback((clientY: number) => {
    if (!isPullingRef.current || isRefreshing) return;

    const diff = clientY - startYRef.current;

    if (diff > 0) {
      const distance = Math.min(diff * 0.5, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
    }
  }, [isRefreshing]);

  // Pull-to-refresh 종료 (공통)
  const handlePullEnd = useCallback(() => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      refreshReviews();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, refreshReviews]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handlePullStart(e.touches[0].clientY);
  }, [handlePullStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handlePullMove(e.touches[0].clientY);
  }, [handlePullMove]);

  const handleTouchEnd = useCallback(() => {
    handlePullEnd();
  }, [handlePullEnd]);

  // 마우스 이벤트 핸들러 (데스크탑용)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handlePullStart(e.clientY);
  }, [handlePullStart]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPullingRef.current) return;
    e.preventDefault();
    handlePullMove(e.clientY);
  }, [handlePullMove]);

  const handleMouseUp = useCallback(() => {
    handlePullEnd();
  }, [handlePullEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isPullingRef.current) {
      handlePullEnd();
    }
  }, [handlePullEnd]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className="select-none"
    >
      {/* Pull-to-refresh 인디케이터 */}
      <div
        className={cn(
          "flex justify-center items-center overflow-hidden transition-all duration-200",
          isRefreshing ? "h-12" : "h-0"
        )}
        style={{ height: isRefreshing ? 48 : pullDistance }}
      >
        <div className={cn(
          "flex items-center gap-2 text-primary",
          pullDistance >= PULL_THRESHOLD ? "opacity-100" : "opacity-60"
        )}>
          <RefreshCw className={cn(
            "h-5 w-5 transition-transform",
            isRefreshing && "animate-spin",
            pullDistance >= PULL_THRESHOLD && !isRefreshing && "rotate-180"
          )} />
          <span className="text-sm font-medium">
            {isRefreshing ? "새로고침 중..." : pullDistance >= PULL_THRESHOLD ? "놓으면 새로고침" : "당겨서 새로고침"}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Trust Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium text-center">
            🍽️ 맛잘알은 <span className="text-primary font-bold">광고와 AI 리뷰가 없습니다</span>
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">오직 진짜 맛잘알들의 솔직한 리뷰만 있어요</p>
        </div>

        {/* Reviews Feed */}
        {isLoading ? (
          <ReviewFeedSkeleton count={3} />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          <>
            {filteredReviews.map((review) => <ReviewCard key={review.id} review={review} />)}

            {/* 무한 스크롤 트리거 영역 */}
            <div ref={loadMoreRef} className="h-4" />

            {/* 추가 로딩 인디케이터 */}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}

            {/* 더 이상 리뷰가 없을 때 */}
            {!hasMore && filteredReviews.length > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">모든 리뷰를 확인했어요</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {showFollowingOnly
                ? "팔로잉한 사람들의 리뷰가 없습니다"
                : showVerifiedOnly && reviews.length > 0
                ? "인증된 리뷰가 없습니다"
                : "해당 조건의 리뷰가 없습니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

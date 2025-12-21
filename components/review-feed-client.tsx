// components/review-feed-client.tsx
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { api, Review } from "@/lib/api"
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewFeedClientProps {
  initialReviews: Review[];
  selectedRegion: string;
  selectedCategory: string;
}

export function ReviewFeedClient({ initialReviews, selectedRegion, selectedCategory }: ReviewFeedClientProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Pull-to-refresh 상태
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const PULL_THRESHOLD = 80; // 새로고침 트리거 거리

  // 리뷰 새로고침 함수
  const refreshReviews = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const result = await api.getReviews(
        selectedRegion !== "전체" ? selectedRegion : undefined,
        selectedCategory !== "전체" ? selectedCategory : undefined
      );
      if (result.success) {
        setReviews(result.data.content);
      }
    } catch (err) {
      console.error("리뷰 로드 실패:", err);
      setError("리뷰를 불러오는데 실패했습니다");
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [selectedRegion, selectedCategory]);

  // 리뷰 작성 후 돌아왔을 때 새로고침
  useEffect(() => {
    const refresh = searchParams.get("refresh");
    if (refresh === "true") {
      refreshReviews();
      // URL에서 refresh 파라미터 제거
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams, refreshReviews]);

  // 필터 변경 시 리뷰 로드
  useEffect(() => {
    if (selectedRegion === "전체" && selectedCategory === "전체" && initialReviews.length > 0 && !isRefreshing) {
      setReviews(initialReviews);
      setIsLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.getReviews(
          selectedRegion !== "전체" ? selectedRegion : undefined,
          selectedCategory !== "전체" ? selectedCategory : undefined
        );
        if (result.success) {
          setReviews(result.data.content);
        }
      } catch (err) {
        console.error("리뷰 로드 실패:", err);
        setError("리뷰를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [selectedRegion, selectedCategory, initialReviews, isRefreshing]);

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
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">해당 조건의 리뷰가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}


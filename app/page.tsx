import { MobileLayout } from "@/components/mobile-layout"
import { HomePageClientWrapper } from "@/components/home-page-client-wrapper" // New import
import { api } from "@/lib/api"

export default async function HomePage() {
  let initialReviews = [];
  let error: string | null = null;

  try {
    // Fetch initial reviews on the server
    const result = await api.getReviews(undefined, undefined);
    if (result.success) {
      initialReviews = result.data.content;
    } else {
      error = "초기 리뷰를 불러오는데 실패했습니다";
    }
  } catch (err) {
    console.error("초기 리뷰 로드 실패:", err);
    error = "초기 리뷰를 불러오는데 실패했습니다";
  }

  return (
    <MobileLayout>
      <HomePageClientWrapper initialReviews={initialReviews} />
    </MobileLayout>
  )
}

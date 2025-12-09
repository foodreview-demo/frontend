// API 클라이언트 설정

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      // 토큰이 없거나 만료된 경우
      const hasToken = !!token;

      if (hasToken && response.status === 401) {
        // 토큰 만료 시 리프레시 시도
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // 재시도
          const newToken = this.getToken();
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers,
          });
          if (!retryResponse.ok) {
            throw new Error('요청 실패');
          }
          return retryResponse.json();
        }
      }

      // 403이고 토큰이 있는 경우: 토큰이 유효하지 않을 수 있음
      // 토큰 없이 재시도 (public endpoint일 수 있음)
      if (response.status === 403 && hasToken) {
        delete (headers as Record<string, string>)['Authorization'];
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          return retryResponse.json();
        }
      }

      // 그래도 실패하면 로그아웃
      if (hasToken) {
        this.logout();
      }
      throw new Error('인증이 만료되었습니다');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '요청 실패');
    }

    return response.json();
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const result: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
    }
    return false;
  }

  private logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Auth API
  async signUp(data: { email: string; password: string; name: string; region: string }) {
    return this.request<ApiResponse<User>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const result = await this.request<ApiResponse<TokenResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success) {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
    }

    return result;
  }

  async getMe() {
    return this.request<ApiResponse<User>>('/auth/me');
  }

  // User API
  async getUser(userId: number) {
    return this.request<ApiResponse<User>>(`/users/${userId}`);
  }

  async updateProfile(data: { name?: string; avatar?: string; region?: string; favoriteCategories?: string[] }) {
    return this.request<ApiResponse<User>>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async follow(userId: number) {
    return this.request<ApiResponse<void>>(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollow(userId: number) {
    return this.request<ApiResponse<void>>(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  async isFollowing(userId: number) {
    return this.request<ApiResponse<boolean>>(`/users/${userId}/is-following`);
  }

  async getFollowings(userId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<User>>>(`/users/${userId}/followings?page=${page}&size=${size}`);
  }

  async getFollowers(userId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<User>>>(`/users/${userId}/followers?page=${page}&size=${size}`);
  }

  async getScoreHistory(userId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<ScoreEvent>>>(`/users/${userId}/score-history?page=${page}&size=${size}`);
  }

  async getRecommendedFriends(limit = 10) {
    return this.request<ApiResponse<RecommendedUser[]>>(`/users/recommendations?limit=${limit}`);
  }

  // Ranking API
  async getRanking(region?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    return this.request<ApiResponse<PageResponse<RankingUser>>>(`/ranking?${params}`);
  }

  // Restaurant API
  async getRestaurants(region?: string, category?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    if (category && category !== '전체') params.append('category', categoryToEnum(category));
    return this.request<ApiResponse<PageResponse<Restaurant>>>(`/restaurants?${params}`);
  }

  async getRestaurant(restaurantId: number) {
    return this.request<ApiResponse<Restaurant>>(`/restaurants/${restaurantId}`);
  }

  async searchRestaurants(keyword: string, region?: string, category?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ keyword, page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    if (category && category !== '전체') params.append('category', categoryToEnum(category));
    return this.request<ApiResponse<PageResponse<Restaurant>>>(`/restaurants/search?${params}`);
  }

  async getFirstReviewAvailableRestaurants(page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Restaurant>>>(`/restaurants/first-review-available?page=${page}&size=${size}`);
  }

  async createRestaurant(data: CreateRestaurantRequest) {
    return this.request<ApiResponse<Restaurant>>('/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Review API
  async getReviews(region?: string, category?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    if (category && category !== '전체') params.append('category', categoryToEnum(category));
    return this.request<ApiResponse<PageResponse<Review>>>(`/reviews?${params}`);
  }

  async getReview(reviewId: number) {
    return this.request<ApiResponse<Review>>(`/reviews/${reviewId}`);
  }

  async getRestaurantReviews(restaurantId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Review>>>(`/reviews/restaurant/${restaurantId}?page=${page}&size=${size}`);
  }

  async getUserReviews(userId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Review>>>(`/reviews/user/${userId}?page=${page}&size=${size}`);
  }

  async createReview(data: CreateReviewRequest) {
    return this.request<ApiResponse<Review>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReview(reviewId: number, data: UpdateReviewRequest) {
    return this.request<ApiResponse<Review>>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(reviewId: number) {
    return this.request<ApiResponse<void>>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async addSympathy(reviewId: number) {
    return this.request<ApiResponse<void>>(`/reviews/${reviewId}/sympathy`, {
      method: 'POST',
    });
  }

  async removeSympathy(reviewId: number) {
    return this.request<ApiResponse<void>>(`/reviews/${reviewId}/sympathy`, {
      method: 'DELETE',
    });
  }

  // Chat API
  async getChatRooms(page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<ChatRoom>>>(`/chat/rooms?page=${page}&size=${size}`);
  }

  async getOrCreateChatRoom(otherUserId: number) {
    return this.request<ApiResponse<ChatRoom>>('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    });
  }

  async getMessages(roomId: number, page = 0, size = 50) {
    return this.request<ApiResponse<PageResponse<ChatMessage>>>(`/chat/rooms/${roomId}/messages?page=${page}&size=${size}`);
  }

  async sendMessage(roomId: number, content: string) {
    return this.request<ApiResponse<ChatMessage>>(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Image API
  async uploadImages(files: File[]): Promise<ApiResponse<ImageUploadResponse>> {
    const token = this.getToken();
    const formData = new FormData();

    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/images/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '이미지 업로드 실패');
    }

    return response.json();
  }

  async deleteImage(url: string) {
    return this.request<ApiResponse<void>>('/images', {
      method: 'DELETE',
      body: JSON.stringify({ url }),
    });
  }
}

// 카테고리 한글 -> Enum 변환
function categoryToEnum(category: string): string {
  const map: Record<string, string> = {
    '한식': 'KOREAN',
    '일식': 'JAPANESE',
    '중식': 'CHINESE',
    '양식': 'WESTERN',
    '카페': 'CAFE',
    '베이커리': 'BAKERY',
    '분식': 'SNACK',
  };
  return map[category] || category;
}

// Types
export interface User {
  id: number;
  email?: string;
  name: string;
  avatar: string;
  region: string;
  tasteScore: number;
  tasteGrade: string;
  reviewCount: number;
  favoriteCategories: string[];
  rank?: number;
}

export interface RankingUser extends User {
  rank: number;
}

export interface RecommendedUser extends User {
  commonCategories: string[];
  recommendReason: string;
}

export interface Restaurant {
  id: number;
  name: string;
  category: string;
  categoryDisplay: string;
  address: string;
  region: string;
  thumbnail: string;
  averageRating: number;
  reviewCount: number;
  priceRange?: string;
  phone?: string;
  businessHours?: string;
  isFirstReviewAvailable?: boolean;
}

export interface Review {
  id: number;
  user: User;
  restaurant: Restaurant;
  content: string;
  rating: number;
  images: string[];
  menu: string;
  price: string;
  visitDate: string;
  createdAt: string;
  sympathyCount: number;
  isFirstReview: boolean;
  hasSympathized: boolean;
}

export interface CreateReviewRequest {
  restaurantId: number;
  content: string;
  rating: number;
  images?: string[];
  menu?: string;
  price?: string;
  visitDate?: string;
}

export interface UpdateReviewRequest {
  content?: string;
  rating?: number;
  images?: string[];
  menu?: string;
  price?: string;
  visitDate?: string;
}

export interface ChatRoom {
  id: number;
  otherUser: User;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isMine: boolean;
}

export interface ScoreEvent {
  id: number;
  type: string;
  description: string;
  points: number;
  date: string;
  from?: {
    name: string;
    score: number;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ImageUploadResponse {
  urls: string[];
  count: number;
}

export interface CreateRestaurantRequest {
  name: string;
  category: string;
  address: string;
  region: string;
  thumbnail?: string;
  priceRange?: string;
  phone?: string;
  businessHours?: string;
}

export const api = new ApiClient(API_BASE_URL);

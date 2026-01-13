// API 클라이언트 설정

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  // SameSite=Strict로 CSRF 방어
  document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Strict';
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; Max-Age=-99999999; path=/';
}

// Device ID 관리 (기기 식별용)
function getDeviceId(): string {
  if (typeof localStorage === 'undefined') return '';

  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    // 브라우저 fingerprint 기반 Device ID 생성
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

function generateDeviceId(): string {
  // 간단한 fingerprint 생성 (실제 프로덕션에서는 fingerprintjs 같은 라이브러리 사용 권장)
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const screen = typeof window !== 'undefined' ? window.screen : null;

  const components = [
    nav?.userAgent || '',
    nav?.language || '',
    screen?.colorDepth || '',
    screen?.width + 'x' + screen?.height || '',
    new Date().getTimezoneOffset().toString(),
    crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
  ];

  // 간단한 해시 생성
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'dev_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return getCookie('accessToken');
  }

  private getRefreshToken(): string | null {
    return getCookie('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Device-Id': getDeviceId(),
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // 403 Forbidden - 권한 없음 (차단된 사용자 등)
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || '접근 권한이 없습니다') as Error & { errorCode?: string };
      error.errorCode = errorData.errorCode;
      throw error;
    }

    if (response.status === 401) {
      // 토큰이 없거나 만료된 경우
      const hasToken = !!token;

      // 에러 메시지 먼저 파싱
      const errorData = await response.json().catch(() => ({}));

      // 토큰이 없는 상태에서 401 (로그인 실패 등)
      if (!hasToken) {
        throw new Error(errorData.message || '이메일 또는 비밀번호가 올바르지 않습니다');
      }

      // 토큰 만료 시 리프레시 시도 (동시 요청 방지)
      const refreshed = await this.refreshTokenWithLock();
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

      // 리프레시 실패 시 로그아웃
      this.logout();
      throw new Error(errorData.message || '인증이 만료되었습니다');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || '요청 실패');
    }

    return response.json();
  }

  // 동시에 여러 요청이 401을 받았을 때 refresh를 한 번만 실행
  private async refreshTokenWithLock(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshToken();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async refreshToken(): Promise<boolean> {
    return this.tryRefreshToken();
  }

  // Public method for auth-context to use
  public async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': getDeviceId(),
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const result: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
        setCookie('accessToken', result.data.accessToken, 1); // 1 day
        setCookie('refreshToken', result.data.refreshToken, 7); // 7 days (새 토큰으로 교체 - Rotation)
        return true;
      } else {
        // Refresh 실패 시 (토큰 만료, 탈취 감지 등)
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh failed:', errorData.message || response.status);

        // 보안 이슈 (TOKEN_REUSE_DETECTED 등) 감지 시 즉시 로그아웃
        if (errorData.errorCode === 'TOKEN_REUSE_DETECTED') {
          console.warn('Security alert: Token reuse detected, logging out');
        }

        // 쿠키 삭제
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Check if refresh token exists
  public hasRefreshToken(): boolean {
    return !!this.getRefreshToken();
  }

  // Check if access token exists
  public hasAccessToken(): boolean {
    return !!this.getToken();
  }

  public async logout(allDevices: boolean = false) {
    const refreshToken = this.getRefreshToken();

    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Device-Id': getDeviceId(),
          },
          body: JSON.stringify({ refreshToken, allDevices }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed, proceeding with client-side logout:', error);
    } finally {
      deleteCookie('accessToken');
      deleteCookie('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
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
      headers: {
        'X-Device-Id': getDeviceId(),
      },
      body: JSON.stringify({ email, password }),
    });

    if (result.success) {
      setCookie('accessToken', result.data.accessToken, 1);
      setCookie('refreshToken', result.data.refreshToken, 7);
    }

    return result;
  }

  async getMe() {
    return this.request<ApiResponse<User>>('/users/me');
  }

  async loginWithKakao(code: string) {
    const result = await this.request<ApiResponse<TokenResponse>>('/auth/oauth/kakao', {
      method: 'POST',
      headers: {
        'X-Device-Id': getDeviceId(),
      },
      body: JSON.stringify({ code }),
    });

    if (result.success) {
      setCookie('accessToken', result.data.accessToken, 1);
      setCookie('refreshToken', result.data.refreshToken, 7);
    }

    return result;
  }

  // User API
  async getUser(userId: number) {
    return this.request<ApiResponse<User>>(`/users/${userId}`);
  }

  async updateProfile(data: { name?: string; avatar?: string; region?: string; district?: string; neighborhood?: string; favoriteCategories?: string[] }) {
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

  async searchUsers(query: string, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<UserSearchResult>>>(`/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }

  // Ranking API
  async getRanking(region?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    return this.request<ApiResponse<PageResponse<RankingUser>>>(`/ranking?${params}`);
  }

  // Restaurant API
  async getRestaurants(region?: string, district?: string, neighborhood?: string, category?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    if (district) params.append('district', district);
    if (neighborhood) params.append('neighborhood', neighborhood);
    if (category && category !== '전체') params.append('category', categoryToEnum(category));
    return this.request<ApiResponse<PageResponse<Restaurant>>>(`/restaurants?${params}`);
  }

  async getRestaurant(restaurantId: number) {
    return this.request<ApiResponse<Restaurant>>(`/restaurants/${restaurantId}`);
  }

  async getRestaurantByUuid(uuid: string) {
    return this.request<ApiResponse<Restaurant>>(`/restaurants/uuid/${uuid}`);
  }

  async searchRestaurants(keyword: string, region?: string, district?: string, neighborhood?: string, category?: string, page = 0, size = 20) {
    const params = new URLSearchParams({ keyword, page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    if (district) params.append('district', district);
    if (neighborhood) params.append('neighborhood', neighborhood);
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

  async getRestaurantByKakaoPlaceId(kakaoPlaceId: string) {
    return this.request<ApiResponse<Restaurant | null>>(`/restaurants/kakao/${kakaoPlaceId}`);
  }

  // Review API
  async getReviews(
    region?: string,
    category?: string,
    page = 0,
    size = 20,
    district?: string,
    neighborhood?: string,
    followingOnly = false
  ) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (region && region !== '전체') params.append('region', region);
    if (district && district !== '전체') params.append('district', district);
    if (neighborhood && neighborhood !== '전체') params.append('neighborhood', neighborhood);
    if (category && category !== '전체') params.append('category', categoryToEnum(category));
    if (followingOnly) params.append('followingOnly', 'true');
    return this.request<ApiResponse<PageResponse<Review>>>(`/reviews?${params}`);
  }

  // 동별 리뷰 수 조회 (지도 마커용)
  async getReviewCountByNeighborhood(region: string, district: string) {
    const params = new URLSearchParams({ region, district });
    return this.request<ApiResponse<NeighborhoodCount[]>>(`/reviews/count-by-neighborhood?${params}`);
  }

  // 구별 리뷰 수 조회
  async getReviewCountByDistrict(region: string) {
    const params = new URLSearchParams({ region });
    return this.request<ApiResponse<DistrictCount[]>>(`/reviews/count-by-district?${params}`);
  }

  async getReview(reviewId: number) {
    return this.request<ApiResponse<Review>>(`/reviews/${reviewId}`);
  }

  async getRestaurantReviews(restaurantId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Review>>>(`/restaurants/${restaurantId}/reviews?page=${page}&size=${size}`);
  }

  async getRestaurantReviewsByUuid(uuid: string, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Review>>>(`/restaurants/uuid/${uuid}/reviews?page=${page}&size=${size}`);
  }

  async getUserReviews(userId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Review>>>(`/users/${userId}/reviews?page=${page}&size=${size}`);
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
    return this.request<ApiResponse<SympathyResponse>>(`/reviews/${reviewId}/sympathize`, {
      method: 'POST',
    });
  }

  async removeSympathy(reviewId: number) {
    return this.request<ApiResponse<SympathyResponse>>(`/reviews/${reviewId}/sympathize`, {
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

  // UUID 기반 채팅방 조회
  async getChatRoomByUuid(roomUuid: string) {
    return this.request<ApiResponse<ChatRoom>>(`/chat/room/${roomUuid}`);
  }

  // roomId 기반 (deprecated)
  async getMessages(roomId: number, page = 0, size = 50) {
    return this.request<ApiResponse<PageResponse<ChatMessage>>>(`/chat/rooms/${roomId}/messages?page=${page}&size=${size}`);
  }

  // UUID 기반 메시지 조회
  async getMessagesByUuid(roomUuid: string, page = 0, size = 50) {
    return this.request<ApiResponse<PageResponse<ChatMessage>>>(`/chat/room/${roomUuid}/messages?page=${page}&size=${size}`);
  }

  // roomId 기반 (deprecated)
  async sendMessage(roomId: number, content: string) {
    return this.request<ApiResponse<ChatMessage>>(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // UUID 기반 메시지 전송
  async sendMessageByUuid(roomUuid: string, content: string) {
    return this.request<ApiResponse<ChatMessage>>(`/chat/room/${roomUuid}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // UUID 기반 채팅방 나가기
  async leaveChatRoom(roomUuid: string) {
    return this.request<ApiResponse<void>>(`/chat/room/${roomUuid}`, {
      method: 'DELETE',
    });
  }

  // 메시지 삭제
  async deleteMessage(roomUuid: string, messageId: number) {
    return this.request<ApiResponse<void>>(`/chat/room/${roomUuid}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // 단체톡방 생성
  async createGroupChatRoom(name: string | null, memberIds: number[]) {
    return this.request<ApiResponse<ChatRoom>>('/chat/rooms/group', {
      method: 'POST',
      body: JSON.stringify({ name, memberIds }),
    });
  }

  // 채팅방에 사용자 초대
  async inviteToRoom(roomUuid: string, userIds: number[]) {
    return this.request<ApiResponse<ChatRoom>>(`/chat/room/${roomUuid}/invite`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  // 채팅방 이름 변경
  async updateRoomName(roomUuid: string, name: string) {
    return this.request<ApiResponse<ChatRoom>>(`/chat/room/${roomUuid}/name`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  // 채팅방 멤버 목록 조회
  async getRoomMembers(roomUuid: string) {
    return this.request<ApiResponse<ChatRoomMember[]>>(`/chat/room/${roomUuid}/members`);
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

  // Playlist API
  async getMyPlaylists(page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Playlist>>>(`/playlists?page=${page}&size=${size}`);
  }

  async getMyPlaylistsAll() {
    return this.request<ApiResponse<Playlist[]>>('/playlists/all');
  }

  async getUserPublicPlaylists(userId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Playlist>>>(`/playlists/user/${userId}?page=${page}&size=${size}`);
  }

  async getPlaylistDetail(playlistId: number) {
    return this.request<ApiResponse<PlaylistDetail>>(`/playlists/${playlistId}`);
  }

  async createPlaylist(data: { name: string; description?: string; isPublic?: boolean }) {
    return this.request<ApiResponse<Playlist>>('/playlists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlaylist(playlistId: number, data: { name: string; description?: string; isPublic?: boolean }) {
    return this.request<ApiResponse<Playlist>>(`/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlaylist(playlistId: number) {
    return this.request<ApiResponse<void>>(`/playlists/${playlistId}`, {
      method: 'DELETE',
    });
  }

  async addToPlaylist(playlistId: number, restaurantId: number, memo?: string) {
    return this.request<ApiResponse<PlaylistItem>>(`/playlists/${playlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ restaurantId, memo }),
    });
  }

  async removeFromPlaylist(playlistId: number, restaurantId: number) {
    return this.request<ApiResponse<void>>(`/playlists/${playlistId}/items/${restaurantId}`, {
      method: 'DELETE',
    });
  }

  async updatePlaylistItemMemo(playlistId: number, restaurantId: number, memo: string) {
    return this.request<ApiResponse<PlaylistItem>>(`/playlists/${playlistId}/items/${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify({ memo }),
    });
  }

  async getRestaurantSaveStatus(restaurantId: number) {
    return this.request<ApiResponse<SaveStatusResponse>>(`/playlists/restaurant/${restaurantId}/status`);
  }

  // Comment API
  async getComments(reviewId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Comment>>>(`/reviews/${reviewId}/comments?page=${page}&size=${size}`);
  }

  async getReplies(commentId: number, page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Comment>>>(`/comments/${commentId}/replies?page=${page}&size=${size}`);
  }

  async createComment(reviewId: number, data: CreateCommentRequest) {
    return this.request<ApiResponse<Comment>>(`/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(commentId: number, content: string) {
    return this.request<ApiResponse<Comment>>(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId: number) {
    return this.request<ApiResponse<void>>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async getCommentCount(reviewId: number) {
    return this.request<ApiResponse<number>>(`/reviews/${reviewId}/comments/count`);
  }

  // Notification API
  async getNotifications(page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<Notification>>>(`/notifications?page=${page}&size=${size}`);
  }

  async getUnreadNotificationCount() {
    return this.request<ApiResponse<UnreadCountResponse>>('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId: number) {
    return this.request<ApiResponse<void>>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<ApiResponse<void>>('/notifications/read-all', {
      method: 'POST',
    });
  }

  // Influence API
  async getInfluenceStats(userId: number) {
    return this.request<ApiResponse<InfluenceStats>>(`/users/${userId}/influence`);
  }

  // Report API
  async createReport(data: CreateReportRequest) {
    return this.request<ApiResponse<Report>>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Block API
  async blockUser(userId: number) {
    return this.request<ApiResponse<void>>(`/users/${userId}/block`, {
      method: 'POST',
    });
  }

  async unblockUser(userId: number) {
    return this.request<ApiResponse<void>>(`/users/${userId}/block`, {
      method: 'DELETE',
    });
  }

  async getBlockedUsers(page = 0, size = 20) {
    return this.request<ApiResponse<PageResponse<BlockedUser>>>(`/users/blocked?page=${page}&size=${size}`);
  }

  async isBlocked(userId: number) {
    return this.request<ApiResponse<boolean>>(`/users/${userId}/is-blocked`);
  }

  // Notification Settings API
  async getNotificationSettings() {
    return this.request<ApiResponse<NotificationSettings>>('/users/me/notifications');
  }

  async updateNotificationSettings(data: NotificationSettings) {
    return this.request<ApiResponse<NotificationSettings>>('/users/me/notifications', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Chat Report API
  async createChatReport(data: CreateChatReportRequest) {
    return this.request<ApiResponse<ChatReportResponse>>('/chat/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin API
  async getAdminStats() {
    return this.request<ApiResponse<AdminStats>>('/admin/stats');
  }

  async getReports(status?: ReportStatus, page = 0, size = 20) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.append('status', status);
    return this.request<ApiResponse<PageResponse<Report>>>(`/admin/reports?${params}`);
  }

  async getReport(reportId: number) {
    return this.request<ApiResponse<Report>>(`/admin/reports/${reportId}`);
  }

  async processReport(reportId: number, data: ProcessReportRequest) {
    return this.request<ApiResponse<Report>>(`/admin/reports/${reportId}/process`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteReviewByAdmin(reviewId: number) {
    return this.request<ApiResponse<void>>(`/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  // 회원 탈퇴
  async withdraw() {
    return this.request<ApiResponse<void>>('/users/me', {
      method: 'DELETE',
    });
  }

  // FCM 토큰 등록
  async registerFcmToken(token: string, deviceType: string = 'ANDROID', deviceId?: string) {
    return this.request<ApiResponse<void>>('/fcm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, deviceType, deviceId }),
    });
  }

  // FCM 토큰 해제
  async unregisterFcmToken(token: string) {
    return this.request<ApiResponse<void>>('/fcm/token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
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
  district?: string;
  neighborhood?: string;
  tasteScore: number;
  tasteGrade: string;
  reviewCount: number;
  receivedSympathyCount: number;
  favoriteCategories: string[];
  rank?: number;
  role?: 'USER' | 'ADMIN';
}

export interface RankingUser extends User {
  rank: number;
}

export interface RecommendedUser extends User {
  commonCategories: string[];
  recommendReason: string;
}

export interface UserSearchResult {
  id: number;
  name: string;
  avatar?: string;
  region: string;
  tasteScore: number;
  tasteGrade: string;
  reviewCount: number;
  isFollowing: boolean;
}

export interface Restaurant {
  id: number;
  uuid: string;
  name: string;
  category: string;
  categoryDisplay: string;
  address: string;
  region: string;
  district?: string;
  neighborhood?: string;
  thumbnail: string;
  averageRating: number;
  averageTasteRating?: number;
  averagePriceRating?: number;
  averageAtmosphereRating?: number;
  averageServiceRating?: number;
  reviewCount: number;
  priceRange?: string;
  phone?: string;
  businessHours?: string;
  isFirstReviewAvailable?: boolean;
  kakaoPlaceId?: string;
  latitude?: number;
  longitude?: number;
}

export interface ReferenceInfo {
  reviewId: number;
  user: User;
}

// 영수증 검증 상태
export type ReceiptVerificationStatus =
  | 'NONE'           // 영수증 미첨부
  | 'PENDING'        // 검증 대기 중
  | 'VERIFIED'       // 자동 검증 완료
  | 'REJECTED'       // 자동 검증 실패
  | 'PENDING_REVIEW' // 수동 검토 필요
  | 'MANUALLY_APPROVED' // 수동 승인
  | 'MANUALLY_REJECTED'; // 수동 거부

// 음식점을 알게 된 경로
export type ReferenceType = 'NONE' | 'PASSING' | 'FRIEND' | 'REVIEW';

export interface Review {
  id: number;
  user: User;
  restaurant: Restaurant;
  content: string;
  rating: number;
  tasteRating?: number;
  priceRating?: number;
  atmosphereRating?: number;
  serviceRating?: number;
  images: string[];
  receiptImageUrl?: string;
  receiptVerificationStatus?: ReceiptVerificationStatus;
  isReceiptVerified?: boolean;
  menu: string;
  price: string;
  visitDate: string;
  createdAt: string;
  sympathyCount: number;
  isFirstReview: boolean;
  hasSympathized: boolean;
  referenceType?: ReferenceType;
  referenceInfo?: ReferenceInfo;
  referenceCount?: number;
}

export interface CreateReviewRequest {
  restaurantId: number;
  content: string;
  rating: number;
  tasteRating?: number;
  priceRating?: number;
  atmosphereRating?: number;
  serviceRating?: number;
  images?: string[];
  receiptImageUrl?: string;
  menu?: string;
  price?: string;
  visitDate?: string;
  referenceType?: ReferenceType;
  referenceReviewId?: number;
}

export interface InfluenceStats {
  totalReferenceCount: number;
  totalInfluencePoints: number;
}

export interface UpdateReviewRequest {
  content?: string;
  rating?: number;
  tasteRating?: number;
  priceRating?: number;
  atmosphereRating?: number;
  serviceRating?: number;
  images?: string[];
  receiptImageUrl?: string;
  menu?: string;
  price?: string;
  visitDate?: string;
  referenceType?: ReferenceType;
  referenceReviewId?: number;
}

export interface ChatRoom {
  id: number;
  uuid: string;
  roomType: 'DIRECT' | 'GROUP';
  name?: string;
  otherUser?: User;  // 1:1 채팅용
  members?: ChatRoomMember[];  // 단체톡용
  memberCount: number;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatRoomMember {
  id: number;
  user: User;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export interface ChatMessage {
  id: number;
  senderId: number | null;
  senderName: string | null;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  isRead: boolean;
  isMine: boolean;
  readCount?: number;    // 단체톡용: 읽은 사람 수 (본인 제외)
  memberCount?: number;  // 단체톡용: 전체 멤버 수 (본인 제외)
  messageType?: 'NORMAL' | 'SYSTEM';  // 메시지 타입
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

export interface SympathyResponse {
  reviewId: number;
  sympathyCount: number;
  hasSympathized: boolean;
}

export interface ImageUploadResponse {
  urls: string[];
  count: number;
}

// 동별 리뷰 수 (지도 마커용)
export interface NeighborhoodCount {
  neighborhood: string;
  count: number;
}

// 구별 리뷰 수
export interface DistrictCount {
  district: string;
  count: number;
}

export interface CreateRestaurantRequest {
  name: string;
  category: string;
  address: string;
  region: string;
  district?: string;
  neighborhood?: string;
  thumbnail?: string;
  priceRange?: string;
  phone?: string;
  businessHours?: string;
  kakaoPlaceId?: string;
  latitude?: number;
  longitude?: number;
}

export interface Playlist {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  thumbnail?: string;
  itemCount: number;
  user?: User;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaylistDetail extends Playlist {
  items: PlaylistItem[];
}

export interface PlaylistItem {
  id: number;
  restaurant: Restaurant;
  position: number;
  memo?: string;
  addedAt: string;
}

export interface SaveStatusResponse {
  restaurantId: number;
  savedPlaylistIds: number[];
  isSaved: boolean;
}

export interface Comment {
  id: number;
  reviewId: number;
  user: {
    id: number;
    name: string;
    avatar: string;
    region: string;
    tasteScore: number;
    tasteGrade: string;
  };
  content: string;
  parentId: number | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  isDeleted: boolean;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
}

export interface Notification {
  id: number;
  type: 'COMMENT' | 'REPLY' | 'SYMPATHY' | 'FOLLOW';
  message: string;
  referenceId: number | null;
  actor: {
    id: number;
    name: string;
    avatar: string;
  } | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationSettings {
  reviews: boolean;
  follows: boolean;
  messages: boolean;
  marketing: boolean;
}

// Report types
export type ReportReason = 'SPAM' | 'INAPPROPRIATE' | 'FAKE_REVIEW' | 'NO_RECEIPT' | 'HARASSMENT' | 'COPYRIGHT' | 'OTHER';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: '스팸/광고' },
  { value: 'INAPPROPRIATE', label: '부적절한 내용' },
  { value: 'FAKE_REVIEW', label: '허위 리뷰' },
  { value: 'NO_RECEIPT', label: '영수증 미첨부' },
  { value: 'HARASSMENT', label: '비방/욕설' },
  { value: 'COPYRIGHT', label: '저작권 침해' },
  { value: 'OTHER', label: '기타' },
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: '대기중',
  RESOLVED: '처리완료',
  REJECTED: '반려',
};

export interface Report {
  id: number;
  reviewId: number;
  reviewContent: string;
  reviewAuthorName: string;
  reviewAuthorId: number;
  restaurantName: string;
  reporterId: number;
  reporterName: string;
  reason: ReportReason;
  reasonDescription: string;
  description: string | null;
  status: ReportStatus;
  statusDescription: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  reviewId: number;
  reason: ReportReason;
  description?: string;
}

export interface ProcessReportRequest {
  action: 'RESOLVE' | 'REJECT';
  adminNote?: string;
  deleteReview?: boolean;
}

export interface AdminStats {
  pendingReportCount: number;
  totalUserCount: number;
  totalReviewCount: number;
}

// Block types
export interface BlockedUser {
  id: number;
  name: string;
  avatar: string;
  tasteGrade: string;
  blockedAt: string;
}

// Chat Report types
export type ChatReportReason = 'HARASSMENT' | 'SPAM' | 'SEXUAL_HARASSMENT' | 'FRAUD' | 'INAPPROPRIATE' | 'OTHER';

export const CHAT_REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: '욕설/비방' },
  { value: 'SPAM', label: '스팸/광고' },
  { value: 'SEXUAL_HARASSMENT', label: '성희롱' },
  { value: 'FRAUD', label: '사기/피싱' },
  { value: 'INAPPROPRIATE', label: '부적절한 내용' },
  { value: 'OTHER', label: '기타' },
];

export interface CreateChatReportRequest {
  reportedUserId: number;
  chatRoomId: number;
  messageId?: number;
  messageContent?: string;
  reason: ChatReportReason;
  description?: string;
}

export interface ChatReportResponse {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId: number;
  reportedUserName: string;
  chatRoomId: number;
  messageId: number | null;
  messageContent: string | null;
  reason: ChatReportReason;
  reasonDescription: string;
  description: string | null;
  status: ReportStatus;
  statusDescription: string;
  createdAt: string;
}

export const api = new ApiClient(API_BASE_URL);

// 목업 데이터 - 실제 서비스에서는 DB에서 가져옴

export interface User {
  id: string
  name: string
  avatar: string
  region: string
  tasteScore: number
  rank: number
  reviewCount: number
  favoriteCategories: string[]
}

export interface Review {
  id: string
  userId: string
  user: User
  restaurantId: string
  restaurant: Restaurant
  content: string
  rating: number
  images: string[]
  menu: string
  price: string
  visitDate: string
  createdAt: string
  sympathyCount: number
  isFirstReview: boolean
  hasSympathized: boolean
}

export interface Restaurant {
  id: string
  name: string
  category: string
  address: string
  region: string
  thumbnail: string
  averageRating: number
  reviewCount: number
  priceRange: string
}

export interface ChatMessage {
  id: string
  senderId: string
  content: string
  createdAt: string
}

export interface ChatRoom {
  id: string
  participants: User[]
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
}

export const mockUsers: User[] = [
  {
    id: "1",
    name: "맛탐험가",
    avatar: "/korean-food-lover-avatar.jpg",
    region: "서울 강남구",
    tasteScore: 2450,
    rank: 1,
    reviewCount: 156,
    favoriteCategories: ["한식", "일식", "파스타"],
  },
  {
    id: "2",
    name: "동네미식가",
    avatar: "/casual-food-reviewer-avatar.jpg",
    region: "서울 마포구",
    tasteScore: 1820,
    rank: 2,
    reviewCount: 98,
    favoriteCategories: ["중식", "한식", "베이커리"],
  },
  {
    id: "3",
    name: "골목맛집헌터",
    avatar: "/street-food-explorer-avatar.jpg",
    region: "부산 해운대구",
    tasteScore: 1650,
    rank: 3,
    reviewCount: 87,
    favoriteCategories: ["해산물", "한식", "분식"],
  },
  {
    id: "4",
    name: "카페투어러",
    avatar: "/cafe-lover-avatar.jpg",
    region: "서울 성동구",
    tasteScore: 1420,
    rank: 4,
    reviewCount: 64,
    favoriteCategories: ["카페", "디저트", "베이커리"],
  },
  {
    id: "5",
    name: "야식킹",
    avatar: "/late-night-food-avatar.jpg",
    region: "서울 영등포구",
    tasteScore: 1280,
    rank: 5,
    reviewCount: 52,
    favoriteCategories: ["치킨", "피자", "중식"],
  },
  {
    id: "6",
    name: "베이킹마스터",
    avatar: "/baker-avatar.jpg",
    region: "서울 서초구",
    tasteScore: 1180,
    rank: 6,
    reviewCount: 45,
    favoriteCategories: ["베이커리", "카페", "디저트"],
  },
  {
    id: "7",
    name: "분식러버",
    avatar: "/korean-street-food-lover-avatar.jpg",
    region: "서울 동작구",
    tasteScore: 1050,
    rank: 7,
    reviewCount: 38,
    favoriteCategories: ["분식", "한식", "중식"],
  },
  {
    id: "8",
    name: "일식덕후",
    avatar: "/japanese-food-lover-avatar.jpg",
    region: "서울 강남구",
    tasteScore: 980,
    rank: 8,
    reviewCount: 42,
    favoriteCategories: ["일식", "양식", "카페"],
  },
  {
    id: "9",
    name: "짬뽕매니아",
    avatar: "/chinese-noodle-lover-avatar.jpg",
    region: "인천 중구",
    tasteScore: 920,
    rank: 9,
    reviewCount: 33,
    favoriteCategories: ["중식", "한식", "분식"],
  },
  {
    id: "10",
    name: "디저트헌터",
    avatar: "/dessert-lover-avatar.jpg",
    region: "서울 강서구",
    tasteScore: 870,
    rank: 10,
    reviewCount: 29,
    favoriteCategories: ["카페", "베이커리", "양식"],
  },
  {
    id: "11",
    name: "해장의신",
    avatar: "/hangover-food-expert-avatar.jpg",
    region: "대구 중구",
    tasteScore: 820,
    rank: 11,
    reviewCount: 27,
    favoriteCategories: ["한식", "분식", "중식"],
  },
  {
    id: "12",
    name: "파스타장인",
    avatar: "/pasta-chef-avatar.jpg",
    region: "서울 용산구",
    tasteScore: 760,
    rank: 12,
    reviewCount: 24,
    favoriteCategories: ["양식", "일식", "카페"],
  },
  {
    id: "13",
    name: "빵순이",
    avatar: "/bread-lover-girl-avatar.jpg",
    region: "대전 서구",
    tasteScore: 710,
    rank: 13,
    reviewCount: 21,
    favoriteCategories: ["베이커리", "카페", "분식"],
  },
  {
    id: "14",
    name: "라멘오타쿠",
    avatar: "/ramen-lover-avatar.jpg",
    region: "서울 마포구",
    tasteScore: 650,
    rank: 14,
    reviewCount: 19,
    favoriteCategories: ["일식", "중식", "한식"],
  },
  {
    id: "15",
    name: "떡볶이킹",
    avatar: "/tteokbokki-lover-avatar.jpg",
    region: "부산 서면",
    tasteScore: 580,
    rank: 15,
    reviewCount: 16,
    favoriteCategories: ["분식", "한식", "중식"],
  },
]

export const mockRestaurants: Restaurant[] = [
  // 한식 (3개)
  {
    id: "1",
    name: "할매순대국",
    category: "한식",
    address: "서울 강남구 역삼동 123-45",
    region: "서울 강남구",
    thumbnail: "/korean-sundae-soup-restaurant.jpg",
    averageRating: 4.8,
    reviewCount: 234,
    priceRange: "8,000원 ~ 12,000원",
  },
  {
    id: "3",
    name: "명동교자",
    category: "한식",
    address: "서울 중구 명동 789-12",
    region: "서울 중구",
    thumbnail: "/korean-dumpling-noodle-restaurant.jpg",
    averageRating: 4.5,
    reviewCount: 567,
    priceRange: "10,000원 ~ 15,000원",
  },
  {
    id: "6",
    name: "진미평양냉면",
    category: "한식",
    address: "서울 마포구 연남동 234-12",
    region: "서울 마포구",
    thumbnail: "/korean-cold-noodle-naengmyeon-restaurant.jpg",
    averageRating: 4.7,
    reviewCount: 312,
    priceRange: "12,000원 ~ 16,000원",
  },
  // 일식 (3개)
  {
    id: "2",
    name: "스시오마카세",
    category: "일식",
    address: "서울 마포구 서교동 456-78",
    region: "서울 마포구",
    thumbnail: "/restaurant-japanese-1.png",
    averageRating: 4.6,
    reviewCount: 0,
    priceRange: "80,000원 ~ 150,000원",
  },
  {
    id: "7",
    name: "멘야하나비",
    category: "일식",
    address: "서울 강남구 신사동 567-34",
    region: "서울 강남구",
    thumbnail: "/japanese-ramen-restaurant.png",
    averageRating: 4.4,
    reviewCount: 189,
    priceRange: "12,000원 ~ 18,000원",
  },
  {
    id: "8",
    name: "규카츠명가",
    category: "일식",
    address: "서울 성동구 성수동 123-56",
    region: "서울 성동구",
    thumbnail: "/japanese-gyukatsu-beef-cutlet-restaurant.jpg",
    averageRating: 4.5,
    reviewCount: 0,
    priceRange: "18,000원 ~ 28,000원",
  },
  // 중식 (3개)
  {
    id: "4",
    name: "진진반점",
    category: "중식",
    address: "부산 해운대구 우동 234-56",
    region: "부산 해운대구",
    thumbnail: "/chinese-jjajangmyeon-restaurant.jpg",
    averageRating: 4.3,
    reviewCount: 0,
    priceRange: "7,000원 ~ 20,000원",
  },
  {
    id: "9",
    name: "홍보각",
    category: "중식",
    address: "인천 중구 차이나타운 45-12",
    region: "인천 중구",
    thumbnail: "/chinese-restaurant-jjamppong.jpg",
    averageRating: 4.6,
    reviewCount: 423,
    priceRange: "8,000원 ~ 25,000원",
  },
  {
    id: "10",
    name: "류샹",
    category: "중식",
    address: "서울 용산구 이태원동 234-78",
    region: "서울 용산구",
    thumbnail: "/authentic-sichuan-chinese-restaurant.jpg",
    averageRating: 4.4,
    reviewCount: 156,
    priceRange: "15,000원 ~ 40,000원",
  },
  // 양식 (3개)
  {
    id: "5",
    name: "파스타공방",
    category: "양식",
    address: "서울 성동구 성수동 567-89",
    region: "서울 성동구",
    thumbnail: "/italian-pasta-restaurant-seongsu.jpg",
    averageRating: 4.7,
    reviewCount: 189,
    priceRange: "15,000원 ~ 28,000원",
  },
  {
    id: "11",
    name: "더스테이크하우스",
    category: "양식",
    address: "서울 강남구 청담동 456-23",
    region: "서울 강남구",
    thumbnail: "/premium-steakhouse-restaurant.jpg",
    averageRating: 4.8,
    reviewCount: 278,
    priceRange: "50,000원 ~ 120,000원",
  },
  {
    id: "12",
    name: "브런치카페라라",
    category: "양식",
    address: "서울 서초구 반포동 123-45",
    region: "서울 서초구",
    thumbnail: "/brunch-cafe-lala.jpg",
    averageRating: 4.3,
    reviewCount: 0,
    priceRange: "18,000원 ~ 32,000원",
  },
  // 카페 (3개)
  {
    id: "13",
    name: "커피한약방",
    category: "카페",
    address: "서울 종로구 익선동 12-34",
    region: "서울 종로구",
    thumbnail: "/hanok-cafe-ikseondong.jpg",
    averageRating: 4.6,
    reviewCount: 345,
    priceRange: "5,000원 ~ 9,000원",
  },
  {
    id: "14",
    name: "포레스트",
    category: "카페",
    address: "서울 성동구 성수동 789-12",
    region: "서울 성동구",
    thumbnail: "/forest-cafe-seongsu.jpg",
    averageRating: 4.5,
    reviewCount: 234,
    priceRange: "6,000원 ~ 12,000원",
  },
  {
    id: "15",
    name: "루프탑커피",
    category: "카페",
    address: "서울 용산구 한남동 456-78",
    region: "서울 용산구",
    thumbnail: "/rooftop-cafe-hannam.jpg",
    averageRating: 4.4,
    reviewCount: 0,
    priceRange: "7,000원 ~ 15,000원",
  },
  // 베이커리 (3개)
  {
    id: "16",
    name: "밀도",
    category: "베이커리",
    address: "서울 강남구 도산대로 234-56",
    region: "서울 강남구",
    thumbnail: "/mildo-bakery-bread.jpg",
    averageRating: 4.7,
    reviewCount: 456,
    priceRange: "4,000원 ~ 15,000원",
  },
  {
    id: "17",
    name: "테일러커피앤베이커리",
    category: "베이커리",
    address: "서울 마포구 망원동 123-45",
    region: "서울 마포구",
    thumbnail: "/taylor-coffee-bakery.jpg",
    averageRating: 4.5,
    reviewCount: 289,
    priceRange: "3,500원 ~ 12,000원",
  },
  {
    id: "18",
    name: "르팡도레",
    category: "베이커리",
    address: "대전 서구 둔산동 567-89",
    region: "대전 서구",
    thumbnail: "/le-pain-dore-bakery.jpg",
    averageRating: 4.6,
    reviewCount: 0,
    priceRange: "4,500원 ~ 18,000원",
  },
  // 분식 (3개)
  {
    id: "19",
    name: "신당동떡볶이",
    category: "분식",
    address: "서울 중구 신당동 345-67",
    region: "서울 중구",
    thumbnail: "/sindang-tteokbokki.jpg",
    averageRating: 4.4,
    reviewCount: 567,
    priceRange: "4,000원 ~ 12,000원",
  },
  {
    id: "20",
    name: "마포원조김밥",
    category: "분식",
    address: "서울 마포구 공덕동 234-56",
    region: "서울 마포구",
    thumbnail: "/mapo-kimbap.jpg",
    averageRating: 4.3,
    reviewCount: 234,
    priceRange: "3,000원 ~ 8,000원",
  },
  {
    id: "21",
    name: "부산어묵당",
    category: "분식",
    address: "부산 서면 456-78",
    region: "부산 서면",
    thumbnail: "/busan-fish-cake.jpg",
    averageRating: 4.5,
    reviewCount: 0,
    priceRange: "5,000원 ~ 15,000원",
  },
]

export const mockReviews: Review[] = [
  {
    id: "1",
    userId: "1",
    user: mockUsers[0],
    restaurantId: "1",
    restaurant: mockRestaurants[0],
    content:
      "40년 전통의 맛! 진한 국물에 순대도 신선하고 양도 푸짐합니다. 아침 출근 전에 먹기 딱 좋아요. 특히 막창이 들어간 모듬순대국 강추!",
    rating: 5,
    images: ["/korean-sundae-soup-delicious.jpg"],
    menu: "모듬순대국",
    price: "10,000원",
    visitDate: "2024-12-01",
    createdAt: "2024-12-02",
    sympathyCount: 156,
    isFirstReview: false,
    hasSympathized: false,
  },
  {
    id: "2",
    userId: "2",
    user: mockUsers[1],
    restaurantId: "3",
    restaurant: mockRestaurants[1],
    content:
      "손으로 빚은 만두가 정말 맛있어요. 칼국수 면발도 쫄깃하고 국물이 깔끔해서 자주 갑니다. 점심시간에는 웨이팅이 있으니 참고하세요!",
    rating: 4,
    images: ["/korean-dumpling-kalguksu.jpg"],
    menu: "만두칼국수",
    price: "12,000원",
    visitDate: "2024-11-28",
    createdAt: "2024-11-30",
    sympathyCount: 89,
    isFirstReview: false,
    hasSympathized: true,
  },
  {
    id: "3",
    userId: "3",
    user: mockUsers[2],
    restaurantId: "5",
    restaurant: mockRestaurants[9],
    content:
      "성수동에서 파스타 맛집 찾는다면 여기! 생면 파스타에 트러플 오일 향이 진하게 나요. 분위기도 좋아서 데이트 코스로 추천드립니다.",
    rating: 5,
    images: ["/truffle-pasta-italian.jpg"],
    menu: "트러플 크림 파스타",
    price: "24,000원",
    visitDate: "2024-12-03",
    createdAt: "2024-12-03",
    sympathyCount: 234,
    isFirstReview: false,
    hasSympathized: false,
  },
  {
    id: "4",
    userId: "8",
    user: mockUsers[7],
    restaurantId: "7",
    restaurant: mockRestaurants[4],
    content:
      "진한 돈코츠 육수에 챠슈가 입에서 녹아요. 면 익힘도 선택 가능하고 무한리필 김치도 맛있습니다. 라멘 좋아하시는 분들 강추!",
    rating: 5,
    images: ["/japanese-ramen-restaurant.png"],
    menu: "특제 돈코츠라멘",
    price: "14,000원",
    visitDate: "2024-12-01",
    createdAt: "2024-12-02",
    sympathyCount: 78,
    isFirstReview: false,
    hasSympathized: false,
  },
  {
    id: "5",
    userId: "9",
    user: mockUsers[8],
    restaurantId: "9",
    restaurant: mockRestaurants[7],
    content:
      "인천 차이나타운에서 짬뽕 맛집으로 유명한 곳! 얼큰한 국물에 해물이 푸짐하게 들어가요. 탕수육도 바삭바삭 찍먹파라면 여기!",
    rating: 5,
    images: ["/chinese-restaurant-jjamppong.jpg"],
    menu: "삼선짬뽕",
    price: "12,000원",
    visitDate: "2024-11-25",
    createdAt: "2024-11-26",
    sympathyCount: 145,
    isFirstReview: false,
    hasSympathized: true,
  },
  {
    id: "6",
    userId: "4",
    user: mockUsers[3],
    restaurantId: "13",
    restaurant: mockRestaurants[11],
    content:
      "익선동 한옥 카페! 인테리어가 정말 예쁘고 시그니처 한방차가 독특해요. 사진 찍기 좋고 조용해서 대화하기도 좋습니다.",
    rating: 4,
    images: ["/hanok-cafe-ikseondong.jpg"],
    menu: "오미자차",
    price: "7,000원",
    visitDate: "2024-11-30",
    createdAt: "2024-12-01",
    sympathyCount: 67,
    isFirstReview: false,
    hasSympathized: false,
  },
  {
    id: "7",
    userId: "6",
    user: mockUsers[5],
    restaurantId: "16",
    restaurant: mockRestaurants[14],
    content: "식빵이 진짜 유명한 곳! 줄 서서 먹는 이유가 있어요. 갓 구운 식빵의 버터향이 정말 좋고 질감도 완벽합니다.",
    rating: 5,
    images: ["/mildo-bakery-bread.jpg"],
    menu: "우유식빵",
    price: "8,000원",
    visitDate: "2024-12-02",
    createdAt: "2024-12-03",
    sympathyCount: 198,
    isFirstReview: false,
    hasSympathized: false,
  },
  {
    id: "8",
    userId: "7",
    user: mockUsers[6],
    restaurantId: "19",
    restaurant: mockRestaurants[17],
    content:
      "신당동 떡볶이 골목의 원조집! 쫄깃한 밀떡에 달달매콤한 양념이 중독적이에요. 튀김이랑 순대도 같이 드시면 완벽!",
    rating: 5,
    images: ["/sindang-tteokbokki.jpg"],
    menu: "떡볶이 세트",
    price: "9,000원",
    visitDate: "2024-11-28",
    createdAt: "2024-11-29",
    sympathyCount: 112,
    isFirstReview: false,
    hasSympathized: true,
  },
  {
    id: "9",
    userId: "12",
    user: mockUsers[11],
    restaurantId: "11",
    restaurant: mockRestaurants[10],
    content:
      "드라이에이징 스테이크의 정점! 미디엄 레어로 구워주시는데 육즙이 장난 아니에요. 특별한 날 가기 딱 좋은 곳입니다.",
    rating: 5,
    images: ["/premium-steakhouse-restaurant.jpg"],
    menu: "드라이에이징 립아이",
    price: "85,000원",
    visitDate: "2024-11-20",
    createdAt: "2024-11-21",
    sympathyCount: 89,
    isFirstReview: false,
    hasSympathized: false,
  },
  {
    id: "10",
    userId: "11",
    user: mockUsers[10],
    restaurantId: "6",
    restaurant: mockRestaurants[2],
    content:
      "평양냉면 입문자에게 추천! 담백한 육수에 쫄깃한 면발이 일품이에요. 수육도 부드럽고 겨자는 살짝만 넣는 게 포인트!",
    rating: 4,
    images: ["/korean-cold-noodle-naengmyeon-restaurant.jpg"],
    menu: "물냉면",
    price: "14,000원",
    visitDate: "2024-12-01",
    createdAt: "2024-12-02",
    sympathyCount: 56,
    isFirstReview: false,
    hasSympathized: false,
  },
]

export const mockChatRooms: ChatRoom[] = [
  {
    id: "1",
    participants: [mockUsers[0], mockUsers[1]],
    lastMessage: "마포구 신상 맛집 정보 공유해요!",
    lastMessageAt: "2024-12-03T14:30:00",
    unreadCount: 2,
  },
  {
    id: "2",
    participants: [mockUsers[0], mockUsers[2]],
    lastMessage: "부산 여행 가는데 추천 부탁드려요~",
    lastMessageAt: "2024-12-02T10:15:00",
    unreadCount: 0,
  },
]

export const currentUser = mockUsers[0]

export const regions = [
  "전체",
  "서울 강남구",
  "서울 마포구",
  "서울 중구",
  "서울 성동구",
  "서울 영등포구",
  "서울 서초구",
  "서울 용산구",
  "서울 종로구",
  "서울 강서구",
  "서울 동작구",
  "부산 해운대구",
  "부산 중구",
  "부산 서면",
  "인천 중구",
  "대구 중구",
  "대전 서구",
]

export const categories = ["전체", "한식", "일식", "중식", "양식", "카페", "베이커리", "분식"]

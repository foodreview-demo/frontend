// English translations
import type { TranslationKeys } from './ko'

export const en: TranslationKeys = {
  // Common
  common: {
    appName: "MatJalAl",
    loading: "Loading...",
    error: "An error occurred",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    all: "All",
    version: "Version",
    next: "Next",
    prev: "Previous",
    back: "Back",
    close: "Close",
    submit: "Submit",
    complete: "Complete",
    selectRegion: "Select Region",
    list: "List",
  },

  // Navigation
  nav: {
    home: "Home",
    search: "Search",
    write: "Review",
    ranking: "Ranking",
    profile: "My Info",
    chat: "Chat",
    notifications: "Notifications",
    friends: "Friends",
  },

  // Authentication
  auth: {
    login: "Log in",
    logout: "Log out",
    signup: "Sign up",
    email: "Email",
    password: "Password",
    passwordConfirm: "Confirm Password",
    passwordMinLength: "Password (8+ chars)",
    passwordMatch: "Passwords match",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",
    minChars: "8+ characters",
    name: "Nickname",
    nicknamePlaceholder: "Nickname (2-30 chars)",
    region: "Region",
    selectRegion: "Please select a region",
    loginWithKakao: "Continue with Kakao",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    loginRequired: "Login required",
    logoutConfirm: "Are you sure you want to log out?",
    loginFailed: "Login failed",
    signupFailed: "Sign up failed",
    quickLogin: "Quick Login",
    testAccount: "Test Account",
    appSlogan: "People who know real food",
    joinCommunity: "Join the MatJalAl community",
    basicInfo: "Basic Info",
    passwordSetup: "Password Setup",
    signupComplete: "Sign up",
  },

  // Settings
  settings: {
    title: "Settings",
    account: "Account",
    editProfile: "Edit Profile",
    privacySecurity: "Privacy & Security",
    notifications: "Notifications",
    reviewNotification: "Review Notifications",
    reviewNotificationDesc: "Get notified when someone likes your review",
    followNotification: "Follow Notifications",
    followNotificationDesc: "Get notified when someone follows you",
    messageNotification: "Message Notifications",
    messageNotificationDesc: "Get notified when you receive new messages",
    marketingNotification: "Marketing Notifications",
    marketingNotificationDesc: "Receive event and promotion information",
    appInfo: "App Info",
    terms: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    deleteAccount: "Delete Account",
    deleteAccountConfirm: "Are you sure you want to delete your account? This action cannot be undone and all your reviews and data will be permanently deleted.",
    language: "Language",
    languageDesc: "Select the language for the app",
    korean: "한국어",
    english: "English",
  },

  // Review
  review: {
    write: "Write Review",
    writeNew: "Write New Review",
    rating: "Rating",
    content: "Review Content",
    photos: "Photos",
    addPhoto: "Add Photo",
    submit: "Submit",
    likes: "Likes",
    comments: "Comments",
    viewMore: "View More",
    noReviews: "No reviews yet",
    myReviews: "My Reviews",
    writeReviewFor: "Write Review for",
    placeholder: "Share your honest review about this restaurant",
  },

  // Restaurant
  restaurant: {
    search: "Search Restaurants",
    category: "Category",
    region: "Region",
    rating: "Rating",
    reviews: "Reviews",
    address: "Address",
    phone: "Phone",
    hours: "Hours",
    menu: "Menu",
    noResults: "No results found",
  },

  // Profile
  profile: {
    title: "Profile",
    myInfo: "My Info",
    tasteScore: "Taste Score",
    tasteLevel: "Taste Level",
    followers: "Followers",
    following: "Following",
    reviews: "Reviews",
    influence: "Influence",
    influenceDesc: "people referenced my reviews",
    influencePoints: "Influence Points",
    influencePointsDesc: "points earned",
    follow: "Follow",
    unfollow: "Unfollow",
    editProfile: "Edit Profile",
    message: "Message",
    noReviewsYet: "No reviews written yet",
    writeFirstReview: "Write First Review",
    scoreHistory: "Score History",
    me: "Me",
  },

  // Ranking
  ranking: {
    title: "Taste Ranking",
    weekly: "Weekly",
    monthly: "Monthly",
    allTime: "All Time",
    rank: "",
    points: "pts",
  },

  // Chat
  chat: {
    title: "Chat",
    noMessages: "No messages yet",
    typeMessage: "Type a message",
    send: "Send",
    today: "Today",
    yesterday: "Yesterday",
    selectRoom: "Please select a chat room",
    goToFriends: "Go to Friends",
  },

  // Notifications
  notification: {
    title: "Notifications",
    noNotifications: "No notifications",
    newFollower: "started following you",
    newLike: "liked your review",
    newComment: "commented on your review",
    markAllRead: "Mark all read",
    loginRequired: "Please log in to view notifications",
    willNotify: "We'll notify you when there's news",
  },

  // Taste levels
  tasteLevel: {
    master: "Master",
    expert: "Expert",
    gourmet: "Gourmet",
    explorer: "Explorer",
    beginner: "Beginner",
  },

  // Categories
  categories: {
    all: "All",
    korean: "Korean",
    japanese: "Japanese",
    chinese: "Chinese",
    western: "Western",
    cafe: "Cafe",
    bakery: "Bakery",
    snack: "Snacks",
  },

  // Regions
  regions: {
    all: "All",
    seoul: "Seoul",
    busan: "Busan",
    incheon: "Incheon",
    daegu: "Daegu",
    daejeon: "Daejeon",
    gwangju: "Gwangju",
    ulsan: "Ulsan",
    sejong: "Sejong",
    gyeonggi: "Gyeonggi",
  },

  // Time expressions
  time: {
    justNow: "Just now",
    minutesAgo: "min ago",
    hoursAgo: "hours ago",
    daysAgo: "days ago",
  },

  // Review reference (influence)
  reference: {
    howDidYouFind: "How did you find this restaurant?",
    foundByMyself: "Found it myself",
    introducedByFriend: "Introduced by a friend",
    sawOthersReview: "Saw someone else's review",
    selectReview: "Select the review you referenced",
    searchByNickname: "Search by nickname",
  },

  // Follows
  follows: {
    searchUsers: "Search users",
    recommend: "Recommend",
    noFollowing: "You're not following anyone yet",
    noFollowingDesc: "Follow food experts with similar taste",
    noFollowers: "You don't have any followers yet",
    noFollowersDesc: "Write reviews and increase your taste score",
    noRecommend: "No users to recommend",
    aiRecommend: "AI User Recommendations",
    aiRecommendDesc: "We analyze taste scores, regions, and favorite categories to recommend users with similar taste!",
  },

  // Search/Map
  search: {
    placeholder: "Search restaurants, menus",
    locationPermissionTitle: "Location Access Required",
    locationPermissionDesc: "We need your location to find nearby restaurants.\nLocation is only used for restaurant search.",
    later: "Maybe Later",
    shareLocation: "Share Location",
    showMap: "Show Map",
    restaurants: " restaurants",
    sortDistance: "Distance",
    sortRating: "Rating",
    sortReviews: "Reviews",
    noRestaurantsNearby: "No restaurants nearby",
    viewDetails: "View Details",
    writeReview: "Write Review",
    firstReviewBonus: "Write first review for 2x points",
    firstReviewBadge: "First review 2x points!",
    noReview: "No reviews",
    locationNotSupported: "Location services not supported in this browser",
    locationPermissionDenied: "Location permission denied. Please enable location access in browser settings.",
    locationUnavailable: "Location information unavailable",
    locationTimeout: "Location request timed out",
    locationError: "Unable to get location",
    firstReview: "First Review",
  },
}

// 카카오맵 API 타입 정의
declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions)
    setCenter(latlng: LatLng): void
    setLevel(level: number): void
    getCenter(): LatLng
    getLevel(): number
    panTo(latlng: LatLng): void
  }

  class LatLng {
    constructor(lat: number, lng: number)
    getLat(): number
    getLng(): number
  }

  class Marker {
    constructor(options: MarkerOptions)
    setMap(map: Map | null): void
    setPosition(position: LatLng): void
    getPosition(): LatLng
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions)
    open(map: Map, marker: Marker): void
    close(): void
    setContent(content: string): void
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions)
    setMap(map: Map | null): void
    setPosition(position: LatLng): void
  }

  interface MapOptions {
    center: LatLng
    level?: number
  }

  interface MarkerOptions {
    position: LatLng
    map?: Map
  }

  interface InfoWindowOptions {
    content?: string
    removable?: boolean
  }

  interface CustomOverlayOptions {
    position: LatLng
    content: string | HTMLElement
    yAnchor?: number
    map?: Map
  }

  namespace services {
    class Places {
      constructor(map?: Map)
      keywordSearch(
        keyword: string,
        callback: (result: PlaceSearchResult[], status: Status, pagination: Pagination) => void,
        options?: PlaceSearchOptions
      ): void
      categorySearch(
        category: string,
        callback: (result: PlaceSearchResult[], status: Status, pagination: Pagination) => void,
        options?: PlaceSearchOptions
      ): void
    }

    class Geocoder {
      constructor()
      addressSearch(
        address: string,
        callback: (result: AddressResult[], status: Status) => void
      ): void
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: Coord2AddressResult[], status: Status) => void
      ): void
    }

    interface PlaceSearchResult {
      id: string
      place_name: string
      category_name: string
      category_group_code: string
      category_group_name: string
      phone: string
      address_name: string
      road_address_name: string
      x: string
      y: string
      place_url: string
      distance?: string
    }

    interface AddressResult {
      address_name: string
      x: string
      y: string
    }

    interface Coord2AddressResult {
      address: {
        address_name: string
        region_1depth_name: string
        region_2depth_name: string
        region_3depth_name: string
      }
      road_address: {
        address_name: string
        building_name: string
      } | null
    }

    interface PlaceSearchOptions {
      location?: LatLng
      radius?: number
      size?: number
      page?: number
      sort?: SortBy
    }

    interface Pagination {
      current: number
      first: number
      gotoFirst: () => void
      gotoLast: () => void
      gotoPage: (page: number) => void
      hasNextPage: boolean
      hasPrevPage: boolean
      last: number
      nextPage: () => void
      prevPage: () => void
      totalCount: number
    }

    enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR'
    }

    enum SortBy {
      ACCURACY = 'accuracy',
      DISTANCE = 'distance'
    }
  }

  namespace event {
    function addListener(
      target: Map | Marker,
      type: string,
      callback: (event?: any) => void
    ): void
    function removeListener(
      target: Map | Marker,
      type: string,
      callback: (event?: any) => void
    ): void
  }
}

interface Window {
  kakao: typeof kakao
}

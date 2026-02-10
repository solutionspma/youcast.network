// Pexels API integration for YouCast platform imagery
// Provides diverse creator photos, backgrounds, and stock media

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const BASE_URL = 'https://api.pexels.com/v1';
const VIDEO_BASE_URL = 'https://api.pexels.com/videos';

// Types
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
  video_pictures: {
    id: number;
    picture: string;
  }[];
}

export interface PexelsSearchResult<T> {
  page: number;
  per_page: number;
  total_results: number;
  next_page?: string;
  photos?: T[];
  videos?: T[];
}

// API Helpers
async function pexelsRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!PEXELS_API_KEY) {
    throw new Error('Pexels API key not configured');
  }

  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: PEXELS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ========================================
// Photo Search Functions
// ========================================

export async function searchPhotos(
  query: string,
  options: {
    page?: number;
    per_page?: number;
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
    color?: string;
    locale?: string;
  } = {}
): Promise<PexelsSearchResult<PexelsPhoto>> {
  const params: Record<string, string | number> = {
    query,
    page: options.page || 1,
    per_page: options.per_page || 15,
  };

  if (options.orientation) params.orientation = options.orientation;
  if (options.size) params.size = options.size;
  if (options.color) params.color = options.color;
  if (options.locale) params.locale = options.locale;

  return pexelsRequest<PexelsSearchResult<PexelsPhoto>>(
    `${BASE_URL}/search?${new URLSearchParams(params as any).toString()}`
  );
}

export async function getCuratedPhotos(
  options: { page?: number; per_page?: number } = {}
): Promise<PexelsSearchResult<PexelsPhoto>> {
  return pexelsRequest<PexelsSearchResult<PexelsPhoto>>(
    `${BASE_URL}/curated?page=${options.page || 1}&per_page=${options.per_page || 15}`
  );
}

export async function getPhoto(id: number): Promise<PexelsPhoto> {
  return pexelsRequest<PexelsPhoto>(`${BASE_URL}/photos/${id}`);
}

// ========================================
// Video Search Functions
// ========================================

export async function searchVideos(
  query: string,
  options: {
    page?: number;
    per_page?: number;
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
  } = {}
): Promise<PexelsSearchResult<PexelsVideo>> {
  const params: Record<string, string | number> = {
    query,
    page: options.page || 1,
    per_page: options.per_page || 15,
  };

  if (options.orientation) params.orientation = options.orientation;
  if (options.size) params.size = options.size;

  return pexelsRequest<PexelsSearchResult<PexelsVideo>>(
    `${VIDEO_BASE_URL}/search?${new URLSearchParams(params as any).toString()}`
  );
}

export async function getPopularVideos(
  options: { page?: number; per_page?: number } = {}
): Promise<PexelsSearchResult<PexelsVideo>> {
  return pexelsRequest<PexelsSearchResult<PexelsVideo>>(
    `${VIDEO_BASE_URL}/popular?page=${options.page || 1}&per_page=${options.per_page || 15}`
  );
}

export async function getVideo(id: number): Promise<PexelsVideo> {
  return pexelsRequest<PexelsVideo>(`${VIDEO_BASE_URL}/videos/${id}`);
}

// ========================================
// YouCast-Specific Functions
// ========================================

// Diverse creator search terms for content creator imagery
const DIVERSE_CREATOR_QUERIES = [
  'diverse content creator studio',
  'african american podcaster',
  'asian streamer gaming',
  'hispanic content creator',
  'woman creator laptop',
  'man recording video',
  'diverse people camera equipment',
  'professional streaming setup',
  'people recording podcast studio',
  'multiethnic team office technology',
];

// Get diverse creator profile images
export async function getDiverseCreatorPhotos(
  count: number = 20
): Promise<PexelsPhoto[]> {
  const photos: PexelsPhoto[] = [];
  const photosPerQuery = Math.ceil(count / DIVERSE_CREATOR_QUERIES.length);

  // Fetch from multiple diverse queries to ensure variety
  const promises = DIVERSE_CREATOR_QUERIES.map((query) =>
    searchPhotos(query, {
      per_page: photosPerQuery,
      orientation: 'square',
    }).catch(() => ({ photos: [] }))
  );

  const results = await Promise.all(promises);

  results.forEach((result) => {
    if (result.photos) {
      photos.push(...result.photos);
    }
  });

  // Shuffle and return requested count
  return shuffleArray(photos).slice(0, count);
}

// Get stream background images
export async function getStreamBackgrounds(
  count: number = 10
): Promise<PexelsPhoto[]> {
  const queries = [
    'abstract gradient background',
    'studio lighting background',
    'neon lights dark',
    'modern office background',
    'minimalist desk setup',
  ];

  const photos: PexelsPhoto[] = [];
  const photosPerQuery = Math.ceil(count / queries.length);

  const promises = queries.map((query) =>
    searchPhotos(query, {
      per_page: photosPerQuery,
      orientation: 'landscape',
    }).catch(() => ({ photos: [] }))
  );

  const results = await Promise.all(promises);

  results.forEach((result) => {
    if (result.photos) {
      photos.push(...result.photos);
    }
  });

  return shuffleArray(photos).slice(0, count);
}

// Get church/ministry themed images
export async function getChurchMinstryPhotos(
  count: number = 15
): Promise<PexelsPhoto[]> {
  const queries = [
    'church worship service',
    'diverse congregation',
    'pastor preaching microphone',
    'church community gathering',
    'prayer group diverse',
    'church technology streaming',
  ];

  const photos: PexelsPhoto[] = [];
  const photosPerQuery = Math.ceil(count / queries.length);

  const promises = queries.map((query) =>
    searchPhotos(query, {
      per_page: photosPerQuery,
    }).catch(() => ({ photos: [] }))
  );

  const results = await Promise.all(promises);

  results.forEach((result) => {
    if (result.photos) {
      photos.push(...result.photos);
    }
  });

  return shuffleArray(photos).slice(0, count);
}

// Get category-specific images
export async function getCategoryPhotos(
  category: 'gaming' | 'music' | 'education' | 'entertainment' | 'technology' | 'lifestyle',
  count: number = 10
): Promise<PexelsPhoto[]> {
  const categoryQueries: Record<string, string[]> = {
    gaming: ['gaming setup neon', 'esports gaming', 'streamer gaming'],
    music: ['music studio recording', 'musician streaming', 'live performance'],
    education: ['online teaching', 'educational content', 'teacher laptop'],
    entertainment: ['content creator camera', 'vlogger filming', 'entertainer performance'],
    technology: ['tech reviewer', 'coding streaming', 'software developer screen'],
    lifestyle: ['lifestyle vlogger', 'influencer camera', 'daily vlog'],
  };

  const queries = categoryQueries[category] || ['content creator'];
  const photos: PexelsPhoto[] = [];
  const photosPerQuery = Math.ceil(count / queries.length);

  const promises = queries.map((query) =>
    searchPhotos(query, { per_page: photosPerQuery }).catch(() => ({ photos: [] }))
  );

  const results = await Promise.all(promises);

  results.forEach((result) => {
    if (result.photos) {
      photos.push(...result.photos);
    }
  });

  return shuffleArray(photos).slice(0, count);
}

// Get B-roll stock videos for stream intros/outros
export async function getStreamBRollVideos(
  count: number = 10
): Promise<PexelsVideo[]> {
  const queries = [
    'tech abstract motion',
    'digital particles',
    'network connection animation',
    'stream intro background',
    'broadcast graphics',
  ];

  const videos: PexelsVideo[] = [];
  const videosPerQuery = Math.ceil(count / queries.length);

  const promises = queries.map((query) =>
    searchVideos(query, {
      per_page: videosPerQuery,
      orientation: 'landscape',
    }).catch(() => ({ videos: [] }))
  );

  const results = await Promise.all(promises);

  results.forEach((result) => {
    if (result.videos) {
      videos.push(...result.videos);
    }
  });

  return shuffleArray(videos).slice(0, count);
}

// ========================================
// Utility Functions
// ========================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get optimized image URL based on use case
export function getOptimizedUrl(
  photo: PexelsPhoto,
  size: 'tiny' | 'small' | 'medium' | 'large' | 'original' = 'medium'
): string {
  return photo.src[size];
}

// Get best quality video file under a certain resolution
export function getBestVideoFile(
  video: PexelsVideo,
  maxWidth: number = 1920
): string | null {
  const sorted = video.video_files
    .filter((f) => f.width <= maxWidth)
    .sort((a, b) => b.width - a.width);

  return sorted[0]?.link || null;
}

// Pre-built collections for quick access
export const CREATOR_IMAGE_COLLECTIONS = {
  diverse: getDiverseCreatorPhotos,
  backgrounds: getStreamBackgrounds,
  church: getChurchMinstryPhotos,
  gaming: () => getCategoryPhotos('gaming'),
  music: () => getCategoryPhotos('music'),
  education: () => getCategoryPhotos('education'),
  entertainment: () => getCategoryPhotos('entertainment'),
  technology: () => getCategoryPhotos('technology'),
  lifestyle: () => getCategoryPhotos('lifestyle'),
};

export const CONFIG = {
  BASE_URL: "https://incy-tmdb-api.vercel.app/api/v1",
  IMG_BASE_URL: "https://image.tmdb.org/t/p/w500",
  HIGH_IMG_BASE_URL: "https://image.tmdb.org/t/p/original",

  API_CONFIG: {
    POSTER_URL: "https://image.tmdb.org/t/p/w500",
  },

  getImage: (path) => {
    return `${CONFIG.IMG_BASE_URL}${path}`;
  },
  getBackdrop: (path) => {
    return `${CONFIG.HIGH_IMG_BASE_URL}${path}`;
  },
  getLogo: (path) => {
    return `${CONFIG.HIGH_IMG_BASE_URL}${path}`;
  },
};

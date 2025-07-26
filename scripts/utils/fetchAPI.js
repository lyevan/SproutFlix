import { CONFIG } from "../config.js";

export const fetchPopularMovies = async () => {
  try {
    const response = await fetch(
      `${CONFIG.BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc`,
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${CONFIG.API_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error("Error fetching trending movies:", error);
  }
};

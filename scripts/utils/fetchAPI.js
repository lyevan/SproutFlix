import { CONFIG } from "../config.js";

export const fetchTrendingShows = async () => {
  const response = await fetch(`${CONFIG.BASE_URL}/discover/trending`);
  const data = await response.json();
  console.log("Fetching trending shows from:", data);
  return data.results;
};

export const fetchShowInfo = async (id, media_type) => {
  if (!id && !media_type) {
    throw new Error("Show ID and media type are required to fetch show info.");
  }

  if (media_type === "tv") {
    media_type = "series";
  }
  const response = await fetch(`${CONFIG.BASE_URL}/${media_type}/info/${id}`);
  if (!response.ok) {
    throw new Error(`Error fetching show info: ${response.statusText}`);
  }
  const data = await response.json();
  // console.log("Fetching show info for ID:", id, data);
  return data;
};

document.querySelectorAll("#movie-card").forEach((card) => {
  card.addEventListener("click", () => {
    const movieId = card.getAttribute("data-movie-id");
    window.location.href = `../pages/movie.html?id=${movieId}`;
  });
});

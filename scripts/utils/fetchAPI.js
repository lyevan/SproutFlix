import { CONFIG } from "../config.js";

export const fetchTrendingShows = async () => {
  const response = await fetch(`${CONFIG.BASE_URL}/discover/trending`);
  const data = await response.json();
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
  return data;
};

document.querySelectorAll("#movie-card").forEach((card) => {
  card.addEventListener("click", () => {
    const movieId = card.getAttribute("data-movie-id");
    window.location.href = `../pages/movie.html?id=${movieId}`;
  });
});

export const searchShows = async (query, page = 1) => {
  if (!query) {
    throw new Error("Search query is required.");
  }

  const response = await fetch(
    `${CONFIG.BASE_URL}/discover/search?query=${encodeURIComponent(
      query
    )}&page=${page}`
  );
  if (!response.ok) {
    throw new Error(`Error searching shows: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

export const fetchMoodRecommendation = async (mood) => {
  if (!mood) {
    throw new Error("Mood is required for recommendation.");
  }

  const response = await fetch(
    `${CONFIG.BASE_URL}/gemini/mood-recommendation-id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mood: mood.trim() }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Error getting mood recommendation: ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
};

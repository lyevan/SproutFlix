import { fetchPopularMovies } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

await fetchPopularMovies().then((movies) => {
  const posterPath = movies[0].poster_path;
  const movieTitle = movies[0].title;
  const vote = movies[0].vote_average;
  const movieContainer = document.getElementById("popular-movies-list");

  const movieCard = document.createElement("div");
  movieCard.className = "movie-card";
  movieCard.innerHTML = `
    <img src="${CONFIG.IMG_BASE_URL}${posterPath}" alt="${movieTitle}" />
    <div>
      <h2>${movieTitle}</h2>
      <p>Rating: ${vote}</p>
      <i class="fa-solid fa-star"></i>
    </div>
  `;
  movieContainer.appendChild(movieCard);
});

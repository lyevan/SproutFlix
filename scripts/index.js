import { fetchPopularMovies } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

await fetchPopularMovies()
  .then((movies) => {
    movies.forEach((movie) => {
      console.log(movie);
      const posterPath = movie.poster_path;
      const movieTitle = movie.title;
      const movieYear = movie.release_date.split("-")[0];
      const vote = movie.vote_average.toFixed(1);
      const movieContainer = document.getElementById("popular-movies-list");

      const movieCard = document.createElement("div");
      movieCard.className = "movie-card";
      movieCard.innerHTML = `
        <img src="../assets/pot-background.png" class="pot-background" />
        <div class="movie-poster-container">
          <img src="${CONFIG.IMG_BASE_URL}${posterPath}" alt="${movieTitle}" class="movie-poster" />
        </div>
        <img src="../assets/pot-foreground.png" class="pot-foreground" />
        <img src="../assets/leaf.png" class="leaf-frame" />
    `;
      movieContainer.appendChild(movieCard);
    });
  })
  .catch((error) => {
    console.error("Error fetching popular movies:", error);
    const movieContainer = document.getElementById("popular-movies-list");
    movieContainer.innerHTML =
      "<p>Failed to load popular movies. Please try again later.</p>";
  });

// // <div class="movie-title-container">
//         <h2>${movieTitle}</h2>
//         <h2>${movieYear}</h2>
//       </div>

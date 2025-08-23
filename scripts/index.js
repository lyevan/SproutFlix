import { fetchTrendingShows, fetchShowInfo } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

const renderShowCard = (show) => {
  const showCard = document.createElement("div");
  showCard.setAttribute("data-movie-id", show.id);
  showCard.className = "show-card";
  showCard.innerHTML = `

        <div class="show-poster-container">
          
          <img src="${CONFIG.getImage(show.poster_path)}" alt="${
    show.title
  }" class="show-poster"/>

        </div>
        <div class="show-title-container">
          <h2 class="show-title">${show.title || show.name}</h2>
        </div>
        <h1 class="show-type" style="${
          show.media_type === "movie"
            ? "background: var(--accent);"
            : "background: var(--secondary);"
        }">${show.media_type === "movie" ? "Movie" : "TV"}</h1>

    `;
  showCard.addEventListener("click", () => {
    window.location.href = `./pages/show.html?id=${show.id}&type=${show.media_type}`;
  });
  return showCard;
};

// Create skeleton card
const renderSkeletonCard = () => {
  const skeletonCard = document.createElement("div");
  skeletonCard.className = "show-card skeleton card";
  skeletonCard.innerHTML = `
    <div class="show-poster-container skeleton-poster">
      <div class="skeleton-shimmer"></div>
    </div>
    <div class="show-title-container">
      <div class="skeleton-title"></div>
    </div>
    <div class="skeleton-type"></div>
  `;
  return skeletonCard;
};

// Cache for preloaded images
const imageCache = new Map();

// Preload image function
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src));
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Preload all images for shows
const preloadShowImages = async (shows) => {
  const imagePromises = [];

  for (const show of shows) {
    // Preload backdrop
    if (show.backdrop_path) {
      imagePromises.push(preloadImage(CONFIG.getBackdrop(show.backdrop_path)));
    }

    // Preload poster
    if (show.poster_path) {
      imagePromises.push(preloadImage(CONFIG.getImage(show.poster_path)));
    }

    // Preload logo (fetch show info first)
    try {
      const info = await fetchShowInfo(show.id, show.media_type);
      if (info?.results?.logo) {
        imagePromises.push(preloadImage(CONFIG.getLogo(info.results.logo)));
      }
    } catch (error) {
      console.warn(`Could not preload logo for ${show.title || show.name}`);
    }
  }

  await Promise.allSettled(imagePromises);
};

const renderCurrentTrending = async (show) => {
  const currentTrending = document.createElement("div");
  const info = await fetchShowInfo(show.id, show.media_type).catch((error) => {
    console.error("Error fetching show info:", error);
  });
  console.log("Current trending show:", info);
  currentTrending.className = "current-trending-container";
  currentTrending.style.backgroundImage = `url('${CONFIG.getBackdrop(
    show.backdrop_path
  )}')`;
  currentTrending.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  currentTrending.style.backgroundBlendMode = "overlay";
  currentTrending.innerHTML = `
    <div class="current-trending">
      <div class="current-trending-info-container">
        ${
          info.results.logo
            ? `<img src="${CONFIG.getLogo(info.results.logo)}" alt="${
                show.title || show.name
              }" class="current-trending-logo"/>`
            : `<h1>${show.title || show.name}</h1>`
        }
        <div class="current-trending-badges">
          <p class="current-trending-overview">${show.overview}</p>
          <div class="current-trending-media-info">
            <span class="current-trending-media-type" style="${
              show.media_type === "movie"
                ? "background: var(--accent);"
                : "background: var(--secondary);"
            }">${show.media_type === "movie" ? "Movie" : "Series"}
            </span>
            ${
              show.media_type === "movie"
                ? `<span class="current-trending-runtime">${Math.floor(
                    info.results.runtime / 60
                  )}h ${info.results.runtime % 60}m</span>`
                : `<span class="current-trending-seasons">${
                    info.results.number_of_seasons > 1
                      ? info.results.number_of_seasons + " Seasons"
                      : "1 Season"
                  }</span><span class="is-ongoing">${
                    info.results.in_production ? "Ongoing" : "Completed"
                  }</span>`
            }
            <span class="current-trending-year">${new Date(
              show.first_air_date || show.release_date
            ).getFullYear()}</span>
            <span class="current-trending-votes">⭐ ${info.results.vote_average.toFixed(
              1
            )} (${info.results.vote_count} votes)</span>
          </div>
        </div> 
      </div>
    </div>
  `;
  // -----------------
  //      CLASSES
  // -----------------
  // current-trending-container
  // current-trending
  // current-trending-logo
  // current-trending-overview
  // current-trending-media-info
  // current-trending-media-type
  // current-trending-runtime
  // current-trending-seasons
  // current-trending-year
  // current-trending-votes

  return currentTrending;
};

await fetchTrendingShows()
  .then(async (shows) => {
    // Preload all images first
    console.log("Preloading images...");
    await preloadShowImages(shows);
    console.log("Images preloaded!");

    let index = 0;
    let trendingContainer = document.getElementById("trending-movies");
    let currentTrending = await renderCurrentTrending(shows[index]);
    trendingContainer.appendChild(currentTrending);

    setInterval(async () => {
      index = (index + 1) % shows.length;
      const nextTrending = await renderCurrentTrending(shows[index]);

      // Add smooth transition
      nextTrending.style.opacity = "0";
      trendingContainer.appendChild(nextTrending);

      // Fade out current, fade in next
      const oldTrending = trendingContainer.firstElementChild;

      // Animate transition
      oldTrending.style.transition = "opacity 0.8s ease-in-out";
      nextTrending.style.transition = "opacity 0.8s ease-in-out";

      oldTrending.style.opacity = "0";
      nextTrending.style.opacity = "1";

      // Remove old element after transition
      setTimeout(() => {
        if (oldTrending && oldTrending.parentNode) {
          oldTrending.remove();
        }
      }, 0);
    }, 2000);
  })
  .catch((error) => {
    console.error("Error fetching trending shows:", error);
    const trendingContainer = document.getElementById("trending-movies");
    trendingContainer.innerHTML =
      "<p>Failed to load trending shows. Please try again later.</p>";
  });

// Show skeleton cards initially
const showSkeletonCards = () => {
  const movieContainer = document.getElementById("popular-movies-list");
  // Clear existing content
  movieContainer.innerHTML = "";

  // Add 8 skeleton cards
  for (let i = 0; i < 20; i++) {
    const skeletonCard = renderSkeletonCard();
    movieContainer.appendChild(skeletonCard);
  }
};

// Remove skeleton cards
const removeSkeletonCards = () => {
  const movieContainer = document.getElementById("popular-movies-list");
  movieContainer.innerHTML = "";
};

// Show skeleton cards immediately
showSkeletonCards();

await fetchTrendingShows()
  .then((shows) => {
    removeSkeletonCards();
    shows.forEach((show) => {
      const movieContainer = document.getElementById("popular-movies-list");

      const movieCard = renderShowCard(show);
      movieContainer.appendChild(movieCard);
    });
  })
  .catch((error) => {
    console.error("Error fetching popular movies:", error);
    const movieContainer = document.getElementById("popular-movies-list");
    movieContainer.innerHTML =
      "<p>Failed to load popular movies. Please try again later.</p>";
  });

document.getElementById("popular-movies-list").addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    event.currentTarget.scrollLeft += event.deltaY * 10;
  },
  { passive: false }
);

document.querySelector(".btn-swipe-r").addEventListener("click", () => {
  if (window.innerWidth > 600 && window.innerWidth <= 900) {
    document.getElementById("popular-movies-list").scrollLeft += 500;
  } else if (window.innerWidth > 900 && window.innerWidth <= 1200) {
    document.getElementById("popular-movies-list").scrollLeft += 700;
  } else if (window.innerWidth > 1200 && window.innerWidth <= 1450) {
    document.getElementById("popular-movies-list").scrollLeft += 900;
  } else if (window.innerWidth > 1450) {
    document.getElementById("popular-movies-list").scrollLeft += 2000;
  }
});

document.querySelector(".btn-swipe-l").addEventListener("click", () => {
  if (window.innerWidth > 600 && window.innerWidth <= 900) {
    document.getElementById("popular-movies-list").scrollLeft -= 500;
  } else if (window.innerWidth > 900 && window.innerWidth <= 1200) {
    document.getElementById("popular-movies-list").scrollLeft -= 700;
  } else if (window.innerWidth > 1200 && window.innerWidth <= 1450) {
    document.getElementById("popular-movies-list").scrollLeft -= 900;
  } else if (window.innerWidth > 1450) {
    document.getElementById("popular-movies-list").scrollLeft -= 2000;
  }
});

// Hide the buttons if there is nothing to scroll

// const movieContainer = document.getElementById("popular-movies-list");
// if (movieContainer.scrollWidth <= movieContainer.clientWidth) {
//   document.querySelector(".btn-swipe-r").style.display = "none";
//   document.querySelector(".btn-swipe-l").style.display = "none";
// }

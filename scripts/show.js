import { fetchShowInfo } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

const dialogCloseButton = document.getElementById("dialog-close-button");
function closeDisclaimer() {
  const dialogWrapper = document.getElementById("dialog-wrapper");
  dialogWrapper.classList.add("hidden");
}

dialogCloseButton.addEventListener("click", closeDisclaimer);

const urlParams = new URLSearchParams(window.location.search);
const showId = urlParams.get("id");
const showType = urlParams.get("type");
const season = urlParams.get("season") || 1;
const episode = urlParams.get("episode") || 1;

let embedUrl = "";
let showData = null;

const loadShowData = async () => {
  try {
    const response = await fetchShowInfo(showId, showType);
    showData = response.results;
    return showData;
  } catch (error) {
    return null;
  }
};

if (showType === "movie") {
  embedUrl = `https://vidsrc.xyz/embed/movie?tmdb=${showId}&ds_lang=en`;
} else {
  embedUrl = `https://vidsrc.xyz/embed/tv?tmdb=${showId}&season=${season}&episode=${episode}&ds_lang=en`;
}

const createSkeletonEpisodeCards = (episodeCount = 12) => {
  let skeletonCards = "";
  for (let i = 1; i <= episodeCount; i++) {
    skeletonCards += `
      <div class="skeleton-episode-card">
        <div class="skeleton-episode-number"></div>
        <div class="skeleton-episode-title"></div>
      </div>
    `;
  }
  return skeletonCards;
};

const createPlayerInterface = async () => {
  const movieDetailsContainer = document.getElementById("movie-player-wrapper");
  const isMovie = showType === "movie";

  movieDetailsContainer.className = "player-container";
  movieDetailsContainer.innerHTML = `
    <div class="player-header">
      <h1 class="player-title">
        <i class="fas fa-play-circle"></i>
        Now watching: Loading...
      </h1>
      <a href="../index.html" class="back-button">
        <i class="fas fa-arrow-left"></i> Back to Home
      </a>
    </div>
      <div class="player-wrapper">
      <iframe
        src="${embedUrl}"
        width="100%"
        height="100%"
        frameborder="0"
        allowfullscreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        loading="lazy"
      ></iframe>
    </div>
      ${
        !isMovie ? createSkeletonEpisodesSection() : ""
      }    ${createSkeletonRecommendationsSection()}
  `;

  try {
    const data = await loadShowData();
    const showTitle = data?.title || data?.name || "Unknown Title";

    const playerTitle = document.querySelector(".player-title");
    playerTitle.innerHTML = `
      <i class="fas fa-play-circle"></i>      Now watching: ${showTitle}
      ${!isMovie ? ` - S${season}E${episode}` : ""}
    `;
    if (!isMovie && data) {
      const episodesSection = document.getElementById("episodes-section");
      const loadingIndicator = document.querySelector(".episodes-loading");
      if (episodesSection) {
        if (loadingIndicator) {
          loadingIndicator.style.display = "none";
        }

        episodesSection.innerHTML = createEpisodeCards(data);
      }
    }
    const recommendationsSection = document.getElementById(
      "recommendations-section"
    );
    const recommendationsLoading = document.querySelector(
      ".recommendations-loading"
    );
    if (recommendationsSection && data?.recommendations) {
      if (recommendationsLoading) {
        recommendationsLoading.style.display = "none";
      }

      recommendationsSection.innerHTML = createRecommendationsSection(
        data.recommendations
      );
    } else if (recommendationsSection) {
      if (recommendationsLoading) {
        recommendationsLoading.style.display = "none";
      }

      recommendationsSection.innerHTML = `
        <div class="recommendations-header">
          <h3><i class="fas fa-lightbulb"></i> You might also like</h3>
        </div>
        <div class="no-recommendations">
          <p><i class="fas fa-info-circle"></i> No recommendations available for this title</p>
        </div>
      `;
    }
  } catch (error) {
    const playerTitle = document.querySelector(".player-title");
    playerTitle.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      Error loading show information
    `;
    if (!isMovie) {
      const episodesSection = document.getElementById("episodes-section");
      const loadingIndicator = document.querySelector(".episodes-loading");
      if (episodesSection) {
        if (loadingIndicator) {
          loadingIndicator.style.display = "none";
        }

        episodesSection.innerHTML = `
          <div class="season-selector">
            <h3>Episodes</h3>
          </div>          <div class="episodes-grid">
            <p class="no-episodes">Failed to load episode information</p>
          </div>
        `;
      }
    }

    const recommendationsSection = document.getElementById(
      "recommendations-section"
    );
    const recommendationsLoading = document.querySelector(
      ".recommendations-loading"
    );

    if (recommendationsSection) {
      if (recommendationsLoading) {
        recommendationsLoading.style.display = "none";
      }

      recommendationsSection.innerHTML = `
        <div class="recommendations-header">
          <h3><i class="fas fa-lightbulb"></i> You might also like</h3>
        </div>
        <div class="recommendations-error">
          <p><i class="fas fa-exclamation-triangle"></i> Failed to load recommendations</p>
        </div>
      `;
    }
  }
};

const createSkeletonRecommendationsSection = () => {
  return `
    <div class="recommendations-section" id="recommendations-section">
      <div class="recommendations-header">
        <h3><i class="fas fa-lightbulb"></i> You might also like</h3>
      </div>
      
      <div class="recommendations-loading">
        <i class="fas fa-spinner"></i>
        Loading recommendations...
      </div>
      
      <div class="recommendations-scroll-container">
        <div class="recommendations-grid">
          ${createSkeletonRecommendationCards(6)}
        </div>
      </div>
    </div>
  `;
};

const createSkeletonRecommendationCards = (count = 6) => {
  let skeletonCards = "";
  for (let i = 1; i <= count; i++) {
    skeletonCards += `
      <div class="skeleton-recommendation-card">
        <div class="skeleton-recommendation-poster"></div>
        <div class="skeleton-recommendation-info">
          <div class="skeleton-recommendation-title"></div>
          <div class="skeleton-recommendation-year"></div>
        </div>
      </div>
    `;
  }
  return skeletonCards;
};

const createRecommendationsSection = (recommendations) => {
  if (!recommendations || recommendations.length === 0) {
    return `
      <div class="recommendations-header">
        <h3><i class="fas fa-lightbulb"></i> You might also like</h3>
      </div>
      <div class="no-recommendations">
        <p><i class="fas fa-info-circle"></i> No recommendations available for this title</p>
      </div>
    `;
  }

  return `
    <div class="recommendations-header">
      <h3><i class="fas fa-lightbulb"></i> You might also like</h3>
    </div>
    <div class="recommendations-scroll-container">
      <div class="recommendations-grid" id="recommendations-grid">
        ${recommendations.slice(0, 12).map(createRecommendationCard).join("")}
      </div>
    </div>
  `;
};

const createRecommendationCard = (item) => {
  const title = item.title || item.name || "Unknown Title";
  const year = item.release_date
    ? new Date(item.release_date).getFullYear()
    : item.first_air_date
    ? new Date(item.first_air_date).getFullYear()
    : "";
  const poster = item.poster_path
    ? `${CONFIG.API_CONFIG.POSTER_URL}${item.poster_path}`
    : "../assets/images/logo.png";
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";

  return `
    <div class="recommendation-card" onclick="openRecommendation(${
      item.id
    }, '${mediaType}')">
      <div class="recommendation-poster-container">
        <img src="${poster}" alt="${title}" class="recommendation-poster" loading="lazy" />
        <div class="recommendation-type">${mediaType.toUpperCase()}</div>
        <div class="recommendation-overlay">
          <i class="fas fa-play"></i>
        </div>
      </div>
      <div class="recommendation-info">
        <div class="recommendation-title">${title}</div>
        <div class="recommendation-details">
          ${year ? `<span class="recommendation-year">${year}</span>` : ""}
          <span class="recommendation-rating">
            <i class="fas fa-star"></i> ${rating}
          </span>
        </div>
      </div>
    </div>
  `;
};

window.openRecommendation = (id, type) => {
  window.location.href = `show.html?id=${id}&type=${type}`;
};

const createSkeletonEpisodesSection = () => {
  return `
    <div class="episodes-section" id="episodes-section">
      <div class="season-selector">
        <h3>Episodes - Loading...</h3>
      </div>
      
      <div class="episodes-loading">
        <i class="fas fa-spinner"></i>
        Loading episodes...
      </div>
      
      <div class="episodes-grid">
        ${createSkeletonEpisodeCards(12)}
      </div>
    </div>
  `;
};

const createEpisodeCards = (data) => {
  if (!data.seasons || data.seasons.length === 0) {
    return `
      <div class="season-selector">
        <h3>Episodes</h3>
      </div>
      <div class="episodes-grid">
        <p class="no-episodes">Episode information not available for this series.</p>
      </div>
    `;
  }

  const currentSeason =
    data.seasons.find((s) => s.season_number == season) || data.seasons[0];

  return `
    <div class="season-selector">
      <h3>Episodes - Season ${season}</h3>
      <select id="season-select" onchange="changeSeason(this.value)">
        ${data.seasons
          .map(
            (s) =>
              `<option value="${s.season_number}" ${
                s.season_number == season ? "selected" : ""
              }>
            Season ${s.season_number} ${
                s.episode_count ? `(${s.episode_count} episodes)` : ""
              }
          </option>`
          )
          .join("")}
      </select>
    </div>
    
    <div class="episodes-grid" id="episodes-grid">
      ${generateEpisodeCards(currentSeason)}
    </div>
  `;
};

const generateEpisodeCards = (seasonData) => {
  if (!seasonData || !seasonData.episode_count) {
    return '<p class="no-episodes">No episodes available for this season</p>';
  }

  let episodeCards = "";
  for (let i = 1; i <= seasonData.episode_count; i++) {
    const isActive = i == episode;
    episodeCards += `
      <div class="episode-card ${
        isActive ? "active" : ""
      }" onclick="changeEpisode(${i})">
        <div class="episode-number">E${i}</div>
        <div class="episode-title">Episode ${i}</div>
        ${isActive ? '<i class="fas fa-play"></i>' : ""}
      </div>
    `;
  }
  return episodeCards;
};

window.changeSeason = (newSeason) => {
  window.location.href = `show.html?id=${showId}&type=${showType}&season=${newSeason}&episode=1`;
};

window.changeEpisode = (newEpisode) => {
  window.location.href = `show.html?id=${showId}&type=${showType}&season=${season}&episode=${newEpisode}`;
};

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button-pc");
const mobileSearchButton = document.getElementById("search-button-mobile");
let isSearchVisible = false;

const performSearch = () => {
  const query = searchInput.value.trim();
  if (query) {
    window.location.href = `search.html?query=${encodeURIComponent(query)}`;
  }
};

searchButton.addEventListener("click", performSearch);
mobileSearchButton.addEventListener("click", () => {
  if (window.innerWidth > 678) {
    performSearch();
    return;
  }

  const isVisible = searchInput.style.display === "block";
  searchInput.style.display = isVisible ? "none" : "block";
  isSearchVisible = !isSearchVisible;

  if (!isSearchVisible) {
    searchInput.style.display = "none";
  } else {
    searchInput.focus();
  }
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    performSearch();
  }
});

createPlayerInterface();

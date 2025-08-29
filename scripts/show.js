import { fetchShowInfo } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

const dialogCloseButton = document.getElementById("dialog-close-button");
// Disclaimer functionality
function closeDisclaimer() {
  const dialogWrapper = document.getElementById("dialog-wrapper");
  dialogWrapper.classList.add("hidden");
}

dialogCloseButton.addEventListener("click", closeDisclaimer);

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const showId = urlParams.get("id");
const showType = urlParams.get("type");
const season = urlParams.get("season") || 1;
const episode = urlParams.get("episode") || 1;

let embedUrl = "";
let showData = null;

// Fetch show information
const loadShowData = async () => {
  try {
    const response = await fetchShowInfo(showId, showType);
    showData = response.results;
    return showData;
  } catch (error) {
    console.error("Error fetching show data:", error);
    return null;
  }
};

// Generate embed URL
if (showType === "movie") {
  embedUrl = `https://vidsrc.to/embed/movie/${showId}`;
} else {
  embedUrl = `https://vidsrc.to/embed/tv/${showId}/${season}/${episode}`;
}

// Create skeleton episode cards
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

// Create the player interface
const createPlayerInterface = async () => {
  const movieDetailsContainer = document.getElementById("movie-player-wrapper");
  const isMovie = showType === "movie";

  // Show initial interface with loading state
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
        autoplay
        allow="autoplay; fullscreen"
      ></iframe>
    </div>
    
    ${!isMovie ? createSkeletonEpisodesSection() : ""}
  `;

  // Load data and update the interface
  try {
    const data = await loadShowData();
    const showTitle = data?.title || data?.name || "Unknown Title";

    // Update the header title
    const playerTitle = document.querySelector(".player-title");
    playerTitle.innerHTML = `
      <i class="fas fa-play-circle"></i>
      Now watching: ${showTitle}
      ${!isMovie ? ` - S${season}E${episode}` : ""}
    `; // Update episodes section if it's a TV show
    if (!isMovie && data) {
      const episodesSection = document.getElementById("episodes-section");
      const loadingIndicator = document.querySelector(".episodes-loading");

      if (episodesSection) {
        // Hide loading indicator
        if (loadingIndicator) {
          loadingIndicator.style.display = "none";
        }

        // Replace the content
        episodesSection.innerHTML = createEpisodeCards(data);
      }
    }
  } catch (error) {
    console.error("Error loading show data:", error);
    // Update with error state
    const playerTitle = document.querySelector(".player-title");
    playerTitle.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      Error loading show information
    `;
    if (!isMovie) {
      const episodesSection = document.getElementById("episodes-section");
      const loadingIndicator = document.querySelector(".episodes-loading");

      if (episodesSection) {
        // Hide loading indicator
        if (loadingIndicator) {
          loadingIndicator.style.display = "none";
        }

        episodesSection.innerHTML = `
          <div class="season-selector">
            <h3>Episodes</h3>
          </div>
          <div class="episodes-grid">
            <p class="no-episodes">Failed to load episode information</p>
          </div>
        `;
      }
    }
  }
};

// Create skeleton episodes section
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

// Create episode cards for TV series
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

// Generate episode cards
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

// Season change handler
window.changeSeason = (newSeason) => {
  window.location.href = `show.html?id=${showId}&type=${showType}&season=${newSeason}&episode=1`;
};

// Episode change handler
window.changeEpisode = (newEpisode) => {
  window.location.href = `show.html?id=${showId}&type=${showType}&season=${season}&episode=${newEpisode}`;
};

// Search functionality for show page
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

// Initialize the player
createPlayerInterface();

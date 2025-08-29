import { searchShows } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button-pc");
const mobileSearchButton = document.getElementById("search-button-mobile");
const searchResults = document.getElementById("search-results");
const searchLoading = document.getElementById("search-loading");
const searchError = document.getElementById("search-error");
const noResults = document.getElementById("no-results");
const loadMoreContainer = document.getElementById("load-more-container");
const loadMoreBtn = document.getElementById("load-more-btn");
const searchTitle = document.getElementById("search-title");
const searchSubtitle = document.getElementById("search-subtitle");

let currentQuery = "";
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

const urlParams = new URLSearchParams(window.location.search);
const initialQuery = urlParams.get("query");

const initializeSearch = () => {
  if (initialQuery) {
    searchInput.value = initialQuery;
    performSearch(initialQuery, 1, true);
  }

  searchButton.addEventListener("click", handleSearchClick);
  mobileSearchButton.addEventListener("click", handleMobileSearchClick);
  searchInput.addEventListener("keydown", handleSearchKeydown);
  loadMoreBtn.addEventListener("click", handleLoadMore);
};

const handleSearchClick = () => {
  const query = searchInput.value.trim();
  if (query) {
    performSearch(query, 1, true);
    updateURL(query);
  }
};

const handleMobileSearchClick = () => {
  if (window.innerWidth > 678) {
    handleSearchClick();
    return;
  }

  const isVisible = searchInput.style.display === "block";
  searchInput.style.display = isVisible ? "none" : "block";

  if (!isVisible) {
    searchInput.focus();
  }
};

const handleSearchKeydown = (event) => {
  if (event.key === "Enter") {
    handleSearchClick();
  }
};

const handleLoadMore = () => {
  if (currentQuery && currentPage < totalPages && !isLoading) {
    performSearch(currentQuery, currentPage + 1, false);
  }
};

const updateURL = (query) => {
  const newURL = `${window.location.pathname}?query=${encodeURIComponent(
    query
  )}`;
  window.history.pushState({}, "", newURL);
};

const showLoading = () => {
  hideAllStates();
  searchLoading.classList.remove("hidden");
  isLoading = true;
};

const showError = () => {
  hideAllStates();
  searchError.classList.remove("hidden");
  isLoading = false;
};

const showNoResults = () => {
  hideAllStates();
  noResults.classList.remove("hidden");
  isLoading = false;
};

const hideAllStates = () => {
  searchLoading.classList.add("hidden");
  searchError.classList.add("hidden");
  noResults.classList.add("hidden");
  isLoading = false;
};

const createSkeletonCards = (count = 20) => {
  let skeletonHTML = "";
  for (let i = 0; i < count; i++) {
    skeletonHTML += `
      <div class="skeleton-search-card">
        <div class="skeleton-poster"></div>
        <div class="skeleton-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-year"></div>
        </div>
      </div>
    `;
  }
  return skeletonHTML;
};

const createSearchCard = (show) => {
  const title = show.title || show.name || "Unknown Title";
  const year =
    show.release_date || show.first_air_date
      ? new Date(show.release_date || show.first_air_date).getFullYear()
      : "N/A";
  const mediaType = show.media_type || (show.title ? "movie" : "tv");
  const rating = show.vote_average ? show.vote_average.toFixed(1) : "N/A";
  const posterPath = show.poster_path
    ? CONFIG.getImage(show.poster_path)
    : "../assets/images/logo.png";

  return `
    <a href="show.html?id=${show.id}&type=${mediaType}${
    mediaType === "tv" ? "&season=1&episode=1" : ""
  }" 
       class="search-card" 
       data-id="${show.id}" 
       data-type="${mediaType}">
      <div class="search-card-poster-container">
        <img src="${posterPath}" alt="${title}" class="search-card-poster" 
             onerror="this.src='../assets/images/logo.png'">
        <div class="search-card-type">${
          mediaType === "tv" ? "TV" : "Movie"
        }</div>
      </div>
      <div class="search-card-info">
        <h3 class="search-card-title">${title}</h3>
        <div class="search-card-year">${year}</div>
        <div class="search-card-rating">
          <i class="fas fa-star"></i>
          <span>${rating}</span>
        </div>
      </div>
    </a>
  `;
};

const performSearch = async (query, page = 1, clearResults = true) => {
  if (isLoading) return;
  currentQuery = query;

  searchTitle.textContent = `Search Results for "${query}"`;
  searchSubtitle.textContent = `Showing results for your search`;

  if (clearResults) {
    searchResults.innerHTML = createSkeletonCards(20);
    hideAllStates();
  } else {
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;
  }

  showLoading();
  try {
    const data = await searchShows(query, page);

    hideAllStates();
    if (data.results && data.results.length > 0) {
      if (clearResults) {
        searchResults.innerHTML = "";
      }

      data.results.forEach((show) => {
        searchResults.innerHTML += createSearchCard(show);
      });

      currentPage = page;
      totalPages = data.total_pages || 1;

      if (currentPage < totalPages) {
        loadMoreContainer.classList.remove("hidden");
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
        loadMoreBtn.disabled = false;
      } else {
        loadMoreContainer.classList.add("hidden");
      }
    } else {
      if (clearResults) {
        searchResults.innerHTML = "";
        showNoResults();
      }
      loadMoreContainer.classList.add("hidden");
    }
  } catch (error) {
    if (clearResults) {
      searchResults.innerHTML = "";
      showError();
    } else {
      loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
      loadMoreBtn.disabled = false;
    }

    loadMoreContainer.classList.add("hidden");
  }
};

document.addEventListener("DOMContentLoaded", initializeSearch);

initializeSearch();

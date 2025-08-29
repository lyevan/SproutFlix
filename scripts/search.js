// filepath: c:\Users\Ivan Lester Elmido\Downloads\Basics\scripts\search.js
import { searchShows } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

// Get search elements
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

// Search state
let currentQuery = "";
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

// Get query from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const initialQuery = urlParams.get("query");

// Initialize search functionality
const initializeSearch = () => {
  // Set up search input value and perform initial search if query exists
  if (initialQuery) {
    searchInput.value = initialQuery;
    performSearch(initialQuery, 1, true);
  }

  // Add event listeners
  searchButton.addEventListener("click", handleSearchClick);
  mobileSearchButton.addEventListener("click", handleMobileSearchClick);
  searchInput.addEventListener("keydown", handleSearchKeydown);
  loadMoreBtn.addEventListener("click", handleLoadMore);
};

// Handle search button click
const handleSearchClick = () => {
  const query = searchInput.value.trim();
  if (query) {
    performSearch(query, 1, true);
    updateURL(query);
  }
};

// Handle mobile search button click
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

// Handle search input keydown
const handleSearchKeydown = (event) => {
  if (event.key === "Enter") {
    handleSearchClick();
  }
};

// Handle load more button click
const handleLoadMore = () => {
  if (currentQuery && currentPage < totalPages && !isLoading) {
    performSearch(currentQuery, currentPage + 1, false);
  }
};

// Update URL with search query
const updateURL = (query) => {
  const newURL = `${window.location.pathname}?query=${encodeURIComponent(
    query
  )}`;
  window.history.pushState({}, "", newURL);
};

// Show loading state
const showLoading = () => {
  hideAllStates();
  searchLoading.classList.remove("hidden");
  isLoading = true;
};

// Show error state
const showError = () => {
  hideAllStates();
  searchError.classList.remove("hidden");
  isLoading = false;
};

// Show no results state
const showNoResults = () => {
  hideAllStates();
  noResults.classList.remove("hidden");
  isLoading = false;
};

// Hide all state elements
const hideAllStates = () => {
  searchLoading.classList.add("hidden");
  searchError.classList.add("hidden");
  noResults.classList.add("hidden");
  isLoading = false;
};

// Create skeleton cards
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

// Create search card HTML
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

// Perform search
const performSearch = async (query, page = 1, clearResults = true) => {
  if (isLoading) return;

  currentQuery = query;

  // Update header
  searchTitle.textContent = `Search Results for "${query}"`;
  searchSubtitle.textContent = `Showing results for your search`;

  // Show loading state if clearing results or show skeleton cards
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

    // Hide loading state
    hideAllStates();

    if (data.results && data.results.length > 0) {
      // Clear results if this is a new search
      if (clearResults) {
        searchResults.innerHTML = "";
      }

      // Add new results
      data.results.forEach((show) => {
        searchResults.innerHTML += createSearchCard(show);
      });

      // Update pagination info
      currentPage = page;
      totalPages = data.total_pages || 1;

      // Show/hide load more button
      if (currentPage < totalPages) {
        loadMoreContainer.classList.remove("hidden");
        loadMoreBtn.innerHTML = '<i class="fas fa-plus"></i> Load More';
        loadMoreBtn.disabled = false;
      } else {
        loadMoreContainer.classList.add("hidden");
      }
    } else {
      // No results found
      if (clearResults) {
        searchResults.innerHTML = "";
        showNoResults();
      }
      loadMoreContainer.classList.add("hidden");
    }
  } catch (error) {
    console.error("Search error:", error);

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

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeSearch);

// Initialize search functionality
initializeSearch();

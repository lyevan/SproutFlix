import { fetchTrendingShows, fetchShowInfo } from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

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

const dialogCloseButton = document.getElementById("dialog-close-button");
// Disclaimer functionality
function closeDisclaimer() {
  const dialogWrapper = document.getElementById("dialog-wrapper");
  dialogWrapper.classList.add("hidden");
}

dialogCloseButton.addEventListener("click", closeDisclaimer);

await fetchTrendingShows().then(async (shows) => {
  // Start preloading images in background (non-blocking)
  preloadShowImages(shows).then(() => {
    console.log("All images preloaded!");
  });

  let trendingList = document.querySelector(".trending-list");
  let thumbnailContainer = document.querySelector(".thumbnail");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const thumbnail = document.querySelector(".thumbnail");

  let currentIndex = 0; // Track current active item
  let processedShows = []; // Track shows that have been processed

  // Function to update active states
  const updateActiveStates = (newIndex) => {
    // Remove active class from all items
    document
      .querySelectorAll(".trending-item")
      .forEach((item) => item.classList.remove("active"));
    document
      .querySelectorAll(".thumbnail-item")
      .forEach((item) => item.classList.remove("active"));

    // Add active class to current items
    const activeMainItem = document.querySelector(
      `.trending-item[data-index="${newIndex}"]`
    );
    const activeThumbnailItem = document.querySelector(
      `.thumbnail-item[data-index="${newIndex}"]`
    );

    if (activeMainItem) activeMainItem.classList.add("active");
    if (activeThumbnailItem) activeThumbnailItem.classList.add("active");

    currentIndex = newIndex;
  };

  // Process shows asynchronously
  const processShow = async (show, index) => {
    const info = await fetchShowInfo(show.id, show.media_type).catch(
      (error) => {
        console.error("Error fetching show info:", error);
        return null;
      }
    );
    const handleClick = (id, type) => {
      console.log("Navigating to show:", id, type);
      if (type === "tv") {
        // For TV shows, default to season 1, episode 1
        window.location.href = `./pages/show.html?id=${id}&type=${type}&season=1&episode=1`;
      } else {
        // For movies, no season/episode needed
        window.location.href = `./pages/show.html?id=${id}&type=${type}`;
      }
    };

    // Create trending item
    const trendingItem = document.createElement("div");
    trendingItem.className = `trending-item ${index === 0 ? "active" : ""}`;
    trendingItem.setAttribute("data-index", index);
    trendingItem.innerHTML = `
      <img src="${CONFIG.getBackdrop(show.backdrop_path)}" alt="${
      show.title || show.name
    }" class="trending-backdrop"/>
    <!-- Content -->
    <div class="trending-info">
      <!-- Backdrop -->
      <img src="${CONFIG.getLogo(info?.results?.logo || "")}" alt="${
      show.title || show.name
    }" class="trending-logo"/>
      <p class="trending-overview">${show.overview}</p>
       <!-- CTA Buttons -->
    <div class="action-buttons">
      <button class="watch-button" id="trending-watch-btn"><i class="fa fa-play"></i>Watch</button>
      <button class="later-button" id="trending-info-btn"><i class="fa fa-clock"></i>Watch Later</button>
    </div>
    </div>
    `;

    const watchButton = trendingItem.querySelector("#trending-watch-btn");
    watchButton.addEventListener("click", () => {
      handleClick(show.id, show.media_type);
    });

    // Create thumbnail item
    const thumbnailItem = document.createElement("div");
    thumbnailItem.className = `thumbnail-item ${index === 0 ? "active" : ""}`;
    thumbnailItem.setAttribute("data-index", index);
    thumbnailItem.innerHTML = `
      <img src="${CONFIG.getImage(show.poster_path)}" alt="${
      show.title || show.name
    }" class="thumbnail-poster"/>
    <div class="thumbnail-info">
      <p class="thumbnail-title">${show.title || show.name}</p>
    </div>
    `; // Add click functionality to thumbnail
    thumbnailItem.addEventListener("click", () => {
      const index = parseInt(thumbnailItem.dataset.index);
      updateActiveStates(index);
      // Scroll thumbnail horizontally without affecting page scroll
      const thumbnailContainer = thumbnailItem.parentElement;
      const itemLeft = thumbnailItem.offsetLeft;
      const containerWidth = thumbnailContainer.clientWidth;
      const itemWidth = thumbnailItem.offsetWidth;
      const scrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;

      thumbnailContainer.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: "smooth",
      });
    });

    // Insert in correct position
    const existingTrendingItems = trendingList.children;
    const existingThumbnailItems = thumbnailContainer.children;

    if (index < existingTrendingItems.length) {
      trendingList.insertBefore(trendingItem, existingTrendingItems[index]);
      thumbnailContainer.insertBefore(
        thumbnailItem,
        existingThumbnailItems[index]
      );
    } else {
      trendingList.appendChild(trendingItem);
      thumbnailContainer.appendChild(thumbnailItem);
    }

    processedShows[index] = show;
  };

  // Process first show immediately for instant display
  await processShow(shows[0], 0);

  // Process remaining shows in background
  shows.slice(1).forEach((show, i) => {
    processShow(show, i + 1);
  });
  // Next button event listener
  nextButton.addEventListener("click", () => {
    const newIndex = (currentIndex + 1) % shows.length;
    updateActiveStates(newIndex);

    // Scroll to center the active thumbnail
    const activeThumbnail = document.querySelector(
      `.thumbnail-item[data-index="${newIndex}"]`
    );
    if (activeThumbnail) {
      const thumbnailContainer = activeThumbnail.parentElement;
      const itemLeft = activeThumbnail.offsetLeft;
      const containerWidth = thumbnailContainer.clientWidth;
      const itemWidth = activeThumbnail.offsetWidth;
      const scrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;

      thumbnailContainer.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: "smooth",
      });
    }
  });

  // Previous button event listener
  prevButton.addEventListener("click", () => {
    const newIndex = (currentIndex - 1 + shows.length) % shows.length;
    updateActiveStates(newIndex);

    // Scroll to center the active thumbnail
    const activeThumbnail = document.querySelector(
      `.thumbnail-item[data-index="${newIndex}"]`
    );
    if (activeThumbnail) {
      const thumbnailContainer = activeThumbnail.parentElement;
      const itemLeft = activeThumbnail.offsetLeft;
      const containerWidth = thumbnailContainer.clientWidth;
      const itemWidth = activeThumbnail.offsetWidth;
      const scrollLeft = itemLeft - containerWidth / 2 + itemWidth / 2;

      thumbnailContainer.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: "smooth",
      });
    }
  });

  thumbnail.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      thumbnail.scrollLeft += event.deltaY;
    },
    { passive: false }
  );
});

// Search functionality
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button-pc");
const mobileSearchButton = document.getElementById("search-button-mobile");
let isSearchVisible = false;

const performSearch = () => {
  const query = searchInput.value.trim();
  if (query) {
    window.location.href = `./pages/search.html?query=${encodeURIComponent(
      query
    )}`;
  }
};
searchButton.addEventListener("click", performSearch);
mobileSearchButton.addEventListener("click", () => {
  if (window.innerWidth > 678) {
    return; // Do nothing on larger screens
  }
  searchInput.style.display = "block";
  isSearchVisible = !isSearchVisible;
  if (!isSearchVisible) {
    searchInput.style.display = "none";
  }
});
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    performSearch();
  }
});

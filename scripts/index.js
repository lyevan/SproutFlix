import {
  fetchTrendingShows,
  fetchShowInfo,
  fetchMoodRecommendation,
} from "./utils/fetchAPI.js";
import { CONFIG } from "./config.js";

const imageCache = new Map();

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

const preloadShowImages = async (shows) => {
  const imagePromises = [];

  for (const show of shows) {
    if (show.backdrop_path) {
      imagePromises.push(preloadImage(CONFIG.getBackdrop(show.backdrop_path)));
    }

    if (show.poster_path) {
      imagePromises.push(preloadImage(CONFIG.getImage(show.poster_path)));
    }

    try {
      const info = await fetchShowInfo(show.id, show.media_type);
      if (info?.results?.logo) {
        imagePromises.push(preloadImage(CONFIG.getLogo(info.results.logo)));
      }
    } catch (error) {}
  }

  await Promise.allSettled(imagePromises);
};

const dialogCloseButton = document.getElementById("dialog-close-button");

function closeDisclaimer() {
  const dialogWrapper = document.getElementById("dialog-wrapper");
  dialogWrapper.classList.add("hidden");
}

dialogCloseButton.addEventListener("click", closeDisclaimer);

await fetchTrendingShows().then(async (shows) => {
  preloadShowImages(shows);

  let trendingList = document.querySelector(".trending-list");
  let thumbnailContainer = document.querySelector(".thumbnail");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const thumbnail = document.querySelector(".thumbnail");

  let currentIndex = 0;
  let processedShows = [];

  const updateActiveStates = (newIndex) => {
    document
      .querySelectorAll(".trending-item")
      .forEach((item) => item.classList.remove("active"));
    document
      .querySelectorAll(".thumbnail-item")
      .forEach((item) => item.classList.remove("active"));

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
  const processShow = async (show, index) => {
    const info = await fetchShowInfo(show.id, show.media_type).catch(
      () => null
    );

    const handleClick = (id, type) => {
      if (type === "tv") {
        window.location.href = `./pages/show.html?id=${id}&type=${type}&season=1&episode=1`;
      } else {
        window.location.href = `./pages/show.html?id=${id}&type=${type}`;
      }
    };

    const trendingItem = document.createElement("div");
    trendingItem.className = `trending-item ${index === 0 ? "active" : ""}`;
    trendingItem.setAttribute("data-index", index);
    trendingItem.innerHTML = `
      <img src="${CONFIG.getBackdrop(show.backdrop_path)}" alt="${
      show.title || show.name
    }" class="trending-backdrop"/>
    <div class="trending-info">
      <img src="${CONFIG.getLogo(info?.results?.logo || "")}" alt="${
      show.title || show.name
    }" class="trending-logo"/>
      <p class="trending-overview">${show.overview}</p>
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
    `;
    thumbnailItem.addEventListener("click", () => {
      const index = parseInt(thumbnailItem.dataset.index);
      updateActiveStates(index);
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

  await processShow(shows[0], 0);

  shows.slice(1).forEach((show, i) => {
    processShow(show, i + 1);
  });
  nextButton.addEventListener("click", () => {
    const newIndex = (currentIndex + 1) % shows.length;
    updateActiveStates(newIndex);

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

  prevButton.addEventListener("click", () => {
    const newIndex = (currentIndex - 1 + shows.length) % shows.length;
    updateActiveStates(newIndex);

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

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button-pc");
const mobileSearchButton = document.getElementById("search-button-mobile");
let isSearchVisible = false;

const moodInput = document.getElementById("mood-input");
const moodButton = document.getElementById("mood-button-pc");
const moodButtonMobile = document.getElementById("mood-button-mobile");
let isMoodVisible = false;

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
    return;
  }
  if (isMoodVisible) {
    isMoodVisible = false;
    moodInput.style.display = "none";
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

const performMoodRecommendation = async () => {
  const mood = moodInput.value.trim();
  if (!mood) {
    return;
  }

  moodButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  moodButton.disabled = true;

  try {
    const recommendation = await fetchMoodRecommendation(mood);

    if (
      recommendation.success &&
      recommendation.movie &&
      recommendation.movie.id
    ) {
      window.location.href = `./pages/show.html?id=${recommendation.movie.id}&type=movie`;
    } else {
      alert(
        "Sorry, couldn't find a movie recommendation for your mood. Please try a different description."
      );
    }
  } catch (error) {
    alert("Error getting mood recommendation. Please try again.");
  } finally {
    moodButton.innerHTML = '<i class="fas fa-magic"></i>';
    moodButton.disabled = false;
  }
};

moodButton.addEventListener("click", performMoodRecommendation);
moodButtonMobile.addEventListener("click", () => {
  if (window.innerWidth > 678) {
    return;
  }
  if (isSearchVisible) {
    isSearchVisible = false;
    searchInput.style.display = "none";
  }
  moodInput.style.display = "block";
  isMoodVisible = !isMoodVisible;
  if (!isMoodVisible) {
    moodInput.style.display = "none";
  }
});
moodInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    performMoodRecommendation();
  }
});

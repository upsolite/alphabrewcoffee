document.addEventListener("DOMContentLoaded", function () {
  // Generate unique IDs for elements to prevent conflicts with multiple instances
  const sectionId = "-" + new Date().getTime();

  // Add unique IDs to elements
  const thumbnailContainer = document.getElementById("thumbnail-container");
  if (thumbnailContainer)
    thumbnailContainer.id = "thumbnail-container-" + sectionId;

  const indicatorsContainer = document.getElementById("thumbnail-indicators");
  if (indicatorsContainer)
    indicatorsContainer.id = "thumbnail-indicators-" + sectionId;

  // Select elements with their new IDs
  const thumbnails = document.querySelectorAll(".shop-thumbnail");
  const mainImages = document.querySelectorAll(".shop-main-image");
  const prevArrow = document.querySelector(".shop-prev-arrow");
  const nextArrow = document.querySelector(".shop-next-arrow");

  const totalThumbnails = thumbnails.length;
  let visibleCount = 5;
  let startIndex = 0;
  let endIndex = Math.min(startIndex + visibleCount - 1, totalThumbnails - 1);

  function isMobile() {
    return window.innerWidth <= 767;
  }

  function updateVisibleCount() {
    visibleCount = isMobile() ? 5 : 7;
    if (startIndex + visibleCount > totalThumbnails) {
      startIndex = Math.max(0, totalThumbnails - visibleCount);
    }
    endIndex = Math.min(startIndex + visibleCount - 1, totalThumbnails - 1);

    updateVisibleThumbnails();
    updateNavArrows();
    updateIndicators();
  }

  function updateVisibleThumbnails() {
    thumbnails.forEach((thumb, index) => {
      if (index >= startIndex && index <= endIndex) {
        thumb.style.display = "block";
      } else {
        thumb.style.display = "none";
      }
    });
  }

  function getTotalPages() {
    return Math.ceil(totalThumbnails / visibleCount);
  }

  function getCurrentPage() {
    return Math.floor(startIndex / visibleCount);
  }

  function updateIndicators() {
    const totalPages = getTotalPages();
    const currentPage = getCurrentPage();

    if (totalPages > 1) {
      indicatorsContainer.innerHTML = "";
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("div");
        dot.className =
          i === currentPage
            ? "shop-indicator-dot active"
            : "shop-indicator-dot";
        dot.setAttribute("data-page", i);
        dot.addEventListener("click", () => {
          startIndex = i * visibleCount;
          endIndex = Math.min(
            startIndex + visibleCount - 1,
            totalThumbnails - 1
          );
          updateVisibleThumbnails();
          updateNavArrows();
          updateIndicators();
        });
        indicatorsContainer.appendChild(dot);
      }
      indicatorsContainer.style.display = "flex";
    } else {
      indicatorsContainer.style.display = "none";
      indicatorsContainer.innerHTML = "";
    }
  }

  function updateNavArrows() {
    if (startIndex <= 0) {
      prevArrow.classList.add("disabled");
    } else {
      prevArrow.classList.remove("disabled");
    }

    if (endIndex >= totalThumbnails - 1) {
      nextArrow.classList.add("disabled");
    } else {
      nextArrow.classList.remove("disabled");
    }
  }

  function slideNext() {
    if (endIndex < totalThumbnails - 1) {
      startIndex++;
      endIndex++;
      updateVisibleThumbnails();
      updateNavArrows();
      updateIndicators();
    }
  }

  function slidePrev() {
    if (startIndex > 0) {
      startIndex--;
      endIndex--;
      updateVisibleThumbnails();
      updateNavArrows();
      updateIndicators();
    }
  }

  function ensureThumbnailVisible(index) {
    if (index < startIndex) {
      startIndex = index;
      endIndex = Math.min(startIndex + visibleCount - 1, totalThumbnails - 1);
      updateVisibleThumbnails();
    } else if (index > endIndex) {
      endIndex = index;
      startIndex = Math.max(0, endIndex - visibleCount + 1);
      updateVisibleThumbnails();
    }

    updateNavArrows();
    updateIndicators();
  }

  function switchImage(targetId) {
    thumbnails.forEach((t) => t.classList.remove("active"));
    // mainImages.forEach((img) => img.classList.remove("active"));
    mainImages.forEach((img) => {
      img.classList.remove("active");
      img.style.display = "none";
    });
    const targetThumb = document.querySelector(`[data-target="${targetId}"]`);
    const targetImage = document.getElementById(targetId);

    if (targetThumb && targetImage) {
      targetThumb.classList.add("active");
      targetImage.classList.add("active");
      targetImage.style.display = "block";
      const thumbIndex = parseInt(targetThumb.getAttribute("data-index"));
      ensureThumbnailVisible(thumbIndex);
    }
  }

  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      switchImage(targetId);
    });
  });

  if (!prevArrow || !nextArrow) return;

  prevArrow.addEventListener("click", function () {
    if (!this.classList.contains("disabled")) {
      slidePrev();
    }
  });

  nextArrow.addEventListener("click", function () {
    if (!this.classList.contains("disabled")) {
      slideNext();
    }
  });

  updateVisibleCount();

  window.addEventListener("resize", function () {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(function () {
      updateVisibleCount();
    }, 200);
  });

  window.productCarousel = window.productCarousel || {};
  window.productCarousel[sectionId] = {
    next: function () {
      const activeThumb = document.querySelector(".shop-thumbnail.active");
      if (!activeThumb) return;

      const activeIndex = parseInt(activeThumb.getAttribute("data-index"));
      const nextIndex = (activeIndex + 1) % totalThumbnails;

      const nextThumb = document.querySelector(
        `.shop-thumbnail[data-index="${nextIndex}"]`
      );
      if (nextThumb) {
        const targetId = nextThumb.getAttribute("data-target");
        switchImage(targetId);
      }
    },
    prev: function () {
      const activeThumb = document.querySelector(".shop-thumbnail.active");
      if (!activeThumb) return;

      const activeIndex = parseInt(activeThumb.getAttribute("data-index"));
      const prevIndex = (activeIndex - 1 + totalThumbnails) % totalThumbnails;

      const prevThumb = document.querySelector(
        `.shop-thumbnail[data-index="${prevIndex}"]`
      );
      if (prevThumb) {
        const targetId = prevThumb.getAttribute("data-target");
        switchImage(targetId);
      }
    },
  };

  // Read More/Less functionality for description
  const readMoreLinks = document.querySelectorAll(".shop-read-more");
  const readLessLinks = document.querySelectorAll(".shop-read-less");

  readMoreLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const parent = this.closest(".shop-product-description");
      parent.querySelector(".shop-truncated-description").style.display =
        "none";
      parent.querySelector(".shop-full-description").style.display = "block";
    });
  });

  readLessLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const parent = this.closest(".shop-product-description");
      parent.querySelector(".shop-truncated-description").style.display =
        "block";
      parent.querySelector(".shop-full-description").style.display = "none";
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  // Initialize all FAQ items
  const faqContainers = document.querySelectorAll("[data-faq-container]");

  faqContainers.forEach((container) => {
    const faqItems = container.querySelectorAll("[data-faq-item]");
    const isAccordion =
      container
        .querySelector(".faq-container")
        .getAttribute("data-accordion") === "true";

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");

      question.addEventListener("click", () => {
        const isActive = item.classList.contains("active");

        // Close all other items first if accordion mode is enabled
        if (isAccordion && !isActive) {
          faqItems.forEach((otherItem) => {
            // No need to check if otherItem !== item, just remove from all
            otherItem.classList.remove("active");
          });
        }

        // Toggle the clicked item
        item.classList.toggle("active");
      });
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const mainImages = document.querySelectorAll(".shop-main-image");
  const thumbnails = document.querySelectorAll(".shop-thumbnail");
  const prevArrow = document.querySelector(".shop-prev-arrow");
  const nextArrow = document.querySelector(".shop-next-arrow");
  const thumbnailContainer = document.getElementById("thumbnail-container");
  const indicatorsContainer = document.getElementById("thumbnail-indicators");

  let currentIndex = 0;
  const totalImages = mainImages.length;

  // Create indicators for mobile/tablet view
  if (indicatorsContainer) {
    for (let i = 0; i < totalImages; i++) {
      const dot = document.createElement("div");
      dot.className = "indicator-dot";
      if (i === 0) dot.classList.add("active");

      dot.addEventListener("click", function () {
        changeImage(i);
      });

      indicatorsContainer.appendChild(dot);
    }
  }

  // Initialize thumbnails
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", function () {
      changeImage(index);
    });
  });

  // Navigation arrows functionality
  if (prevArrow) {
    prevArrow.addEventListener("click", function (e) {
      // Check if this is the main image navigation arrow or thumbnail navigation arrow
      const isMainArrow = this.closest(".shop-main-image-wrapper");
      const isThumbnailArrow = this.closest(".shop-thumbnails-wrapper");

      if (isMainArrow) {
        // For main image navigation
        changeImage((currentIndex - 1 + totalImages) % totalImages);
      } else if (isThumbnailArrow) {
        // For thumbnail scrolling
        scrollThumbnails("prev");
      }
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener("click", function (e) {
      // Check if this is the main image navigation arrow or thumbnail navigation arrow
      const isMainArrow = this.closest(".shop-main-image-wrapper");
      const isThumbnailArrow = this.closest(".shop-thumbnails-wrapper");

      if (isMainArrow) {
        // For main image navigation
        changeImage((currentIndex + 1) % totalImages);
      } else if (isThumbnailArrow) {
        // For thumbnail scrolling
        scrollThumbnails("next");
      }
    });
  }

  // Function to change the active image
  function changeImage(index) {
    // Deactivate current
    // mainImages[currentIndex].classList.remove("active");
    // mainImages[currentIndex].style.display = 'none';
    mainImages.forEach((img) => {
      img.classList.remove("active");
      img.style.display = "none";
    });

    // thumbnails[currentIndex].classList.remove("active");
    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
    const currentDot = indicatorsContainer?.querySelector(
      `.indicator-dot:nth-child(${currentIndex + 1})`
    );
    if (currentDot) currentDot.classList.remove("active");

    // Activate new
    currentIndex = index;
    mainImages[currentIndex].classList.add("active");
    mainImages[currentIndex].style.display = "block";
    thumbnails[currentIndex].classList.add("active");
    const newDot = indicatorsContainer?.querySelector(
      `.indicator-dot:nth-child(${currentIndex + 1})`
    );
    if (newDot) newDot.classList.add("active");

    // Center the selected thumbnail in the visible area
    scrollToThumbnail(currentIndex);
  }

  // Function to scroll to thumbnail with smoother centering
  function scrollToThumbnail(index) {
    if (!thumbnailContainer) return;

    const thumbnail = thumbnails[index];
    if (!thumbnail) return;

    // Calculate appropriate scroll position to center the thumbnail
    const containerWidth = thumbnailContainer.offsetWidth;
    const thumbnailWidth = thumbnail.offsetWidth;
    const thumbnailLeft = thumbnail.offsetLeft;

    // Calculate center position
    const scrollPosition =
      thumbnailLeft - containerWidth / 2 + thumbnailWidth / 2;

    // Smooth scroll to position
    thumbnailContainer.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    });
  }

  // Specialized function for scrolling thumbnails by a set amount
  function scrollThumbnails(direction) {
    if (!thumbnailContainer) return;

    const scrollAmount = thumbnailContainer.offsetWidth * 0.8; // Scroll by 80% of visible width
    const currentScroll = thumbnailContainer.scrollLeft;
    const newPosition =
      direction === "next"
        ? currentScroll + scrollAmount
        : currentScroll - scrollAmount;

    thumbnailContainer.scrollTo({
      left: newPosition,
      behavior: "smooth",
    });

    // Update navigation arrow states after scrolling
    setTimeout(checkThumbnailScrollPosition, 100);
  }

  // Add click handlers for thumbnail navigation
  if (prevArrow && thumbnailContainer) {
    prevArrow.addEventListener("click", function (e) {
      // If user is directly clicking the arrows (not for image navigation)
      if (
        e.target.closest(".shop-nav-arrow") &&
        !e.target.closest(".shop-main-image-wrapper")
      ) {
        scrollThumbnails("prev");
        e.stopPropagation(); // Prevent triggering image change
      }
    });
  }

  if (nextArrow && thumbnailContainer) {
    nextArrow.addEventListener("click", function (e) {
      // If user is directly clicking the arrows (not for image navigation)
      if (
        e.target.closest(".shop-nav-arrow") &&
        !e.target.closest(".shop-main-image-wrapper")
      ) {
        scrollThumbnails("next");
        e.stopPropagation(); // Prevent triggering image change
      }
    });
  }

  // Handle keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") {
      changeImage((currentIndex - 1 + totalImages) % totalImages);
    } else if (e.key === "ArrowRight") {
      changeImage((currentIndex + 1) % totalImages);
    }
  });

  // Smooth scroll to product details when clicking on certain elements
  const smoothScrollTriggers = document.querySelectorAll(
    "[data-scroll-to-details]"
  );
  const productDetails = document.querySelector(".shop-product-info");

  smoothScrollTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      if (productDetails) {
        // On mobile/tablet, scroll to the product details
        if (window.innerWidth < 800) {
          productDetails.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  // Fix for sticky positioning on page load
  function updateStickyContainer() {
    const carousel = document.querySelector(".shop-carousel-container");
    if (carousel) {
      const productSection = document.querySelector(".shop-product-section");
      if (productSection) {
        // Set max-height for carousel to ensure it fits in viewport
        const viewportHeight = window.innerHeight;
        const sectionTop = productSection.getBoundingClientRect().top;
        const maxHeight = viewportHeight - sectionTop - 20; // 20px bottom margin

        if (window.innerWidth >= 800) {
          // Only for desktop
          carousel.style.maxHeight = `${maxHeight}px`;
        } else {
          carousel.style.maxHeight = "none"; // Reset on mobile
        }
      }
    }
  }

  // Run on page load and resize
  updateStickyContainer();
  window.addEventListener("resize", updateStickyContainer);

  // Initialize by centering the first thumbnail
  setTimeout(() => {
    scrollToThumbnail(0);
  }, 100);

  // Update navigation arrow states based on the current image index
  function updateNavigationArrows() {
    // For image carousel arrows
    if (totalImages <= 1) {
      // If there's only one image, disable both arrows
      document
        .querySelectorAll(".shop-main-image-wrapper .shop-nav-arrow")
        .forEach((arrow) => {
          arrow.classList.add("disabled");
        });
    } else {
      document
        .querySelectorAll(".shop-main-image-wrapper .shop-nav-arrow")
        .forEach((arrow) => {
          arrow.classList.remove("disabled");
        });
    }

    // For thumbnail navigation, we'll handle visibility based on scroll position
    checkThumbnailScrollPosition();
  }

  // Function to check if we've reached the start or end of thumbnail scrolling
  function checkThumbnailScrollPosition() {
    if (!thumbnailContainer) return;

    const scrollLeft = thumbnailContainer.scrollLeft;
    const maxScroll =
      thumbnailContainer.scrollWidth - thumbnailContainer.clientWidth;

    // Find thumbnail navigation arrows
    const thumbPrevArrow = document.querySelector(
      ".shop-thumbnails-wrapper .shop-prev-arrow"
    );
    const thumbNextArrow = document.querySelector(
      ".shop-thumbnails-wrapper .shop-next-arrow"
    );

    if (thumbPrevArrow) {
      // Disable prev arrow if at start
      if (scrollLeft <= 5) {
        // A small threshold to account for precision issues
        thumbPrevArrow.classList.add("disabled");
      } else {
        thumbPrevArrow.classList.remove("disabled");
      }
    }

    if (thumbNextArrow) {
      // Disable next arrow if at end
      if (maxScroll - scrollLeft <= 5) {
        // A small threshold
        thumbNextArrow.classList.add("disabled");
      } else {
        thumbNextArrow.classList.remove("disabled");
      }
    }
  }

  // Check scroll position whenever the thumbnails are scrolled
  if (thumbnailContainer) {
    thumbnailContainer.addEventListener("scroll", checkThumbnailScrollPosition);
  }

  // Call initially
  updateNavigationArrows();

  // --- Start Swipe Functionality ---
  const imageContainer = document.querySelector(".shop-main-image-wrapper"); // Changed target
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;
  const swipeThreshold = 30; // Lower threshold for faster response

  // Preload all images for faster transitions
  function preloadImages() {
    mainImages.forEach((img) => {
      if (img.getAttribute("src")) {
        const preloadLink = document.createElement("link");
        preloadLink.rel = "preload";
        preloadLink.as = "image";
        preloadLink.href = img.getAttribute("src");
        document.head.appendChild(preloadLink);
      }
    });
  }

  // Call preload function on page load
  preloadImages();

  if (imageContainer) {
    imageContainer.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isSwiping = true;
      },
      { passive: true }
    );

    // Add touchmove handler for more responsive feedback
    imageContainer.addEventListener(
      "touchmove",
      (e) => {
        if (!isSwiping) return;

        const currentX = e.changedTouches[0].screenX;
        const deltaX = currentX - touchStartX;

        // If the user has moved enough, provide visual feedback
        if (Math.abs(deltaX) > swipeThreshold / 2) {
          // Prevent default scrolling behavior when intentionally swiping
          e.preventDefault();
        }
      },
      { passive: false }
    );

    imageContainer.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipeGesture();
        isSwiping = false;
      },
      { passive: true }
    );
  }

  function handleSwipeGesture() {
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) > swipeThreshold) {
      // Access currentIndex and totalImages from the outer scope
      const currentImageIndex = currentIndex;
      const numImages = totalImages;

      // Cache the next/prev image index
      const nextIndex = (currentImageIndex + 1) % numImages;
      const prevIndex = (currentImageIndex - 1 + numImages) % numImages;

      if (deltaX < 0) {
        // Prepare next image for transition
        if (mainImages[nextIndex]) {
          mainImages[nextIndex].style.transition = "none";
          requestAnimationFrame(() => {
            mainImages[nextIndex].style.transition = "";
            changeImage(nextIndex);
          });
        }
      } else {
        // Prepare previous image for transition
        if (mainImages[prevIndex]) {
          mainImages[prevIndex].style.transition = "none";
          requestAnimationFrame(() => {
            mainImages[prevIndex].style.transition = "";
            changeImage(prevIndex);
          });
        }
      }
    }
    // Reset values
    touchStartX = 0;
    touchEndX = 0;
  }
  // --- End Swipe Functionality ---
});

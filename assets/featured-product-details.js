document.addEventListener("DOMContentLoaded", function () {
  // Initialize variant selection handler for both custom events and standard variant changes
  document.addEventListener("variantImageSelected", function (e) {
    if (e.detail && (e.detail.variantId || e.detail.mediaId)) {
      updateGalleryWithVariantImage(e.detail.variantId, e.detail.mediaId);
    }
  });

  // Add listener for the native variant change events
  document.addEventListener("variant:changed", function (e) {
    if (e.detail && e.detail.variant) {
      const variant = e.detail.variant;
      if (variant.featured_media) {
        updateGalleryWithVariantImage(variant.id, variant.featured_media.id);
      }
    }
  });

  // Also add direct listeners to the simple variant picker radios
  const variantRadios = document.querySelectorAll(
    ".simple-variant-picker__radio"
  );
  variantRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (!this.checked) return;

      // Find the variant ID from the form's variant input
      const formId = this.getAttribute("form");
      if (!formId) return;

      const form = document.getElementById(formId);
      if (!form) return;

      const variantInput = form.querySelector('input[name="id"]');
      if (!variantInput) return;

      const variantId = variantInput.value;

      // If this is a color option, check for an image URL
      const colorContainer = this.closest(".value--color");
      if (colorContainer) {
        const imageUrl = this.dataset.imageUrl;
        if (imageUrl) {
          // Try to find the matching gallery image
          const galleryImages = document.querySelectorAll(".shop-main-image");
          galleryImages.forEach((img, index) => {
            const imgSrc = img.getAttribute("src") || "";
            const imgDataSrc = img.getAttribute("data-src") || "";

            // Check if this image matches the variant
            if (
              imgSrc.includes(imageUrl) ||
              imgDataSrc.includes(imageUrl) ||
              img.getAttribute("data-variant-id") == variantId
            ) {
              // Call changeImage function if it exists
              if (typeof window.changeImage === "function") {
                window.changeImage(index);
              }
            }
          });
        }
      }
    });
  });

  function updateGalleryWithVariantImage(variantId, mediaId) {
    // Find all images in the carousel
    const mainImages = document.querySelectorAll(".shop-main-image");
    const thumbnails = document.querySelectorAll(".shop-thumbnail");
    const indicators = document.querySelectorAll(".shop-indicator-dot");

    let matchFound = false;
    let matchIndex = 0;

    // First try to find by media ID
    if (mediaId) {
      mainImages.forEach((img, index) => {
        if (img.dataset.mediaId == mediaId) {
          matchFound = true;
          matchIndex = index;
        }
      });
    }

    // Then try to find by variant ID
    if (!matchFound && variantId) {
      mainImages.forEach((img, index) => {
        if (img.dataset.variantId == variantId) {
          matchFound = true;
          matchIndex = index;
        }
      });

      // If still no match, check thumbnails for variant ID
      if (!matchFound) {
        thumbnails.forEach((thumb, index) => {
          if (thumb.dataset.variantId == variantId) {
            matchFound = true;
            matchIndex = index;
          }
        });
      }
    }

    // Update gallery if we found a match
    if (matchFound) {
      // Update main images
      mainImages.forEach((img, index) => {
        if (index === matchIndex) {
          img.style.display = "block";
        } else {
          img.style.display = "none";
        }
      });

      // Update thumbnails
      thumbnails.forEach((thumb, index) => {
        if (index === matchIndex) {
          thumb.classList.add("active");
        } else {
          thumb.classList.remove("active");
        }
      });

      // Update indicators
      indicators.forEach((dot, index) => {
        if (index === matchIndex) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });

      // Call changeImage function if it exists
      if (typeof window.changeImage === "function") {
        window.changeImage(matchIndex);
      }
    } else if (mainImages.length > 0) {
      // If no match found, show the first image
      mainImages[0].style.display = "block";
      console.log("featured product 1+++");
      if (thumbnails.length > 0) thumbnails[0].classList.add("active");
      if (indicators.length > 0) indicators[0].classList.add("active");
    }
  }

  // Initialize product carousel
  initProductCarousel();
});

function initProductCarousel() {
  const mainImages = document.querySelectorAll(".shop-main-image");
  const thumbnails = document.querySelectorAll(".shop-thumbnail");
  const prevArrow = document.querySelector(".shop-prev-arrow");
  const nextArrow = document.querySelector(".shop-next-arrow");
  const indicatorsContainer = document.getElementById("thumbnail-indicators");

  let currentIndex = 0;
  let visibleThumbnails = 4;
  const maxIndex = mainImages.length - 1;

  // Update arrow states
  function updateArrowStates() {
    if (prevArrow) prevArrow.classList.toggle("disabled", currentIndex === 0);
    if (nextArrow)
      nextArrow.classList.toggle("disabled", currentIndex === maxIndex);
  }

  function updateVisibleThumbnails() {
    const containerWidth = document.querySelector(
      ".shop-thumbnails-wrapper"
    ).offsetWidth;
    if (containerWidth < 400) {
      visibleThumbnails = 3;
    } else {
      visibleThumbnails = 4;
    }
  }

  function updateThumbnailVisibility() {
    const totalThumbnails = thumbnails.length;

    if (totalThumbnails <= visibleThumbnails) {
      // Hide navigation arrows if all thumbnails can be shown
      if (prevArrow) prevArrow.style.display = "none";
      if (nextArrow) nextArrow.style.display = "none";

      thumbnails.forEach((thumb) => {
        thumb.style.display = "flex";
      });
    } else {
      // Show navigation arrows
      if (prevArrow) prevArrow.style.display = "flex";
      if (nextArrow) nextArrow.style.display = "flex";

      const startIndex = Math.max(
        0,
        Math.min(
          currentIndex - Math.floor(visibleThumbnails / 2),
          totalThumbnails - visibleThumbnails
        )
      );

      thumbnails.forEach((thumb, index) => {
        if (index >= startIndex && index < startIndex + visibleThumbnails) {
          thumb.style.display = "flex";
        } else {
          thumb.style.display = "none";
        }
      });
    }

    // Update arrow states
    updateArrowStates();
  }

  // Create indicators
  if (indicatorsContainer && mainImages.length > 1) {
    for (let i = 0; i < mainImages.length; i++) {
      const dot = document.createElement("div");
      dot.classList.add("shop-indicator-dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => changeImage(i));
      indicatorsContainer.appendChild(dot);
    }
  }

  window.changeImage = function (index) {
    if (index < 0 || index > maxIndex) return;

    // Hide all images
    mainImages.forEach((img) => {
      img.style.display = "none";
    });

    // Show the selected image
    if (mainImages[index]) {
      mainImages[index].style.display = "block";
    }

    // Update thumbnails
    thumbnails.forEach((thumb) => {
      thumb.classList.remove("active");
    });

    if (thumbnails[index]) {
      console.log("change image active++++");
      thumbnails[index].classList.add("active");
    }

    // Update indicators
    const indicators = document.querySelectorAll(".shop-indicator-dot");
    indicators.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });

    // Update current index
    currentIndex = index;

    // Ensure the thumbnail is visible in the scroll area
    if (thumbnails[currentIndex]) {
      thumbnails[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }

    updateThumbnailVisibility();
  };

  // Initialize thumbnails
  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => {
      changeImage(index);
    });
  });

  // Add navigation events
  if (prevArrow) {
    prevArrow.addEventListener("click", () => {
      if (currentIndex > 0) {
        changeImage(currentIndex - 1);
        currentIndex -= 1;
      }
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener("click", () => {
      if (currentIndex < maxIndex) {
        changeImage(currentIndex + 1);
        currentIndex += 1;
      }
    });
  }

  // Initialize
  updateVisibleThumbnails();
  updateThumbnailVisibility();

  // Update on window resize
  window.addEventListener("resize", () => {
    updateVisibleThumbnails();
    updateThumbnailVisibility();
  });

  // Show the first image
  if (mainImages.length > 0) {
    mainImages[0].style.display = "block";
    updateArrowStates();
  }
}

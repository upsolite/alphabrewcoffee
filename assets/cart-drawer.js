class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener(
      "keyup",
      (evt) => evt.code === "Escape" && this.close()
    );
    this.querySelector("#CartDrawer-Overlay").addEventListener(
      "click",
      this.close.bind(this)
    );
    this.setHeaderCartIconAccessibility();
    this.bindUpsellButton();
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
    if (!cartLink) return;

    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  bindUpsellButton() {
    this.addEventListener("click", (event) => {
      const upsellButton = event.target.closest(".upsell-add-button");
      if (upsellButton) {
        event.preventDefault();

        const form = upsellButton.closest(".upsell-form");
        const variantId = form.querySelector('input[name="id"]').value;

        this.addItemToCart(variantId);
      }
    });
  }

  async addItemToCart(variantId) {
    const sections = this.getSectionsToRender().map((section) => section.id);

    const body = JSON.stringify({
      id: variantId,
      quantity: 1,
      sections: sections,
      sections_url: window.location.pathname,
    });

    try {
      const response = await fetch(`${routes.cart_add_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: `application/json`,
        },
        body,
      });

      if (response.status === 422) {
        const errorData = await response.json();
        // Handle error (e.g., show a notification)
        console.error("Error adding item to cart:", errorData.description);
        return;
      }

      const parsedState = await response.json();
      this.renderContents(parsedState);
    } catch (error) {
      console.error("Error adding item to cart:", error);
    }
  }

  startCountdownTimer() {
    const timerElement = document.getElementById("cart-countdown-timer");
    if (!timerElement) return;

    // Reset timer to 10 minutes
    let minutes = 10;
    let seconds = 0;

    // Clear any existing timer
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Update the timer display
    const updateTimer = () => {
      timerElement.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    // Initial display
    updateTimer();

    // Start the countdown
    this.countdownInterval = setInterval(() => {
      if (seconds === 0) {
        if (minutes === 0) {
          clearInterval(this.countdownInterval);
          return;
        }
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }

      updateTimer();
    }, 1000);
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role"))
      this.setSummaryAccessibility(cartDrawerNote);
    // here the animation doesn't seem to always get triggered. A timeout seem to help
    setTimeout(() => {
      this.classList.add("animate", "active");
    });

    this.addEventListener(
      "transitionend",
      () => {
        const containerToTrapFocusOn = this.classList.contains("is-empty")
          ? this.querySelector(".drawer__inner-empty")
          : document.getElementById("CartDrawer");
        const focusElement =
          this.querySelector(".drawer__inner") ||
          this.querySelector(".drawer__close");
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add("overflow-hidden");

    $(".gbfrequently-bought-with-main-whole-slider").slick({
      infinite: true,
      autoplaySpeed: 1000,
      autoplay: false,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: true,
    });
    $(".gbfrequently-bought-with-main-whole-slider").css("opacity", "1");

    // Start the countdown timer when drawer opens
    this.startCountdownTimer();
  }

  close() {
    // Check if cart customization mode is active
    const cartCustomizationMode = document
      .querySelector("cart-drawer")
      .classList.contains("customization-mode");
    if (cartCustomizationMode) {
      alert(
        "Cart Customization Mode is active. Disable it in Theme Settings > Cart Drawer to allow closing."
      );
      return;
    }

    this.classList.remove("active");
    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");

    // Clear the countdown timer when drawer closes
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");

    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute(
        "aria-controls",
        cartDrawerNote.nextElementSibling.id
      );
    }

    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute(
        "aria-expanded",
        !event.currentTarget.closest("details").hasAttribute("open")
      );
    });

    cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector(".drawer__inner").classList.contains("is-empty") &&
      this.querySelector(".drawer__inner").classList.remove("is-empty");
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      if (section.id == "cart-drawer" || section.selector == "#CartDrawer") {
        const newCartDrawer = this.getSectionDOM(
          parsedState.sections[section.id],
          section.selector
        );
        updateCartDrawer(sectionElement, newCartDrawer);
      } else {
        sectionElement.innerHTML = this.getSectionInnerHTML(
          parsedState.sections[section.id],
          section.selector
        );
      }
    });

    setTimeout(() => {
      this.querySelector("#CartDrawer-Overlay").addEventListener(
        "click",
        this.close.bind(this)
      );
      this.open();
    });

    $(".gbfrequently-bought-with-main-whole-slider").slick({
      infinite: true,
      autoplaySpeed: 1000,
      autoplay: false,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: false,
      dots: true,
    });
    $(".gbfrequently-bought-with-main-whole-slider").css("opacity", "1");
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    setTimeout(function () {
      var $slider = $(".gbfrequently-bought-with-main-whole-slider");
      if ($slider.length > 0 && !$slider.hasClass("slick-initialized")) {
        $slider.slick({
          infinite: true,
          autoplaySpeed: 1000,
          autoplay: false,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
          dots: true,
          // adaptiveHeight: true
          //prevArrow: $('.our-customer-slider-prev'),
          //nextArrow: $('.our-customer-slider-next'),
        });
        $slider.css("opacity", "1");
      }
    }, 500);

    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer",
      },
      {
        id: "cart-icon-bubble",
      },
    ];
  }

  getSectionDOM(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define("cart-drawer", CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    setTimeout(function () {
      $(".gbfrequently-bought-with-main-whole-slider").slick({
        infinite: true,
        autoplaySpeed: 1000,
        autoplay: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        dots: true,
      });
      $(".gbfrequently-bought-with-main-whole-slider").css("opacity", "1");
    }, 500);

    return [
      {
        id: "CartDrawer",
        section: "cart-drawer",
        selector: ".drawer__inner",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
    ];
  }
}

customElements.define("cart-drawer-items", CartDrawerItems);

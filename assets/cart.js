var parser = parser ?? new DOMParser();

window.cartFunctions = {
  animateProgressBar,
  replaceCartComponent,
  updateBubbleCount,
  addFreeProduct,
  removeFreeProduct,
  updateCartDrawer,
  removeAllGiftsFromSettings,
};

const cartSectionsList = [
  "#CartDrawer-CartItems",
  ".gb-discounts-cart-values",
  ".discount-banner",
  ".free-product-progress-bar-successfull",
];
const cartSectionsToRenderList = [
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

function removeAllGiftsFromSettings(callbackFn) {
  if (!freeGiftProductIds) return;
  const cartDrawerContainer = document.querySelector("cart-drawer");
  if (!cartDrawerContainer) {
    console.error("Cart drawer not found.");
    if (callbackFn) callbackFn();
    return;
  }

  fetch("/cart.js")
    .then((res) => res.json())
    .then((cart) => {
      const giftItems = cart.items.filter(
        (item) =>
          item.price === 0 && freeGiftProductIds.includes(`${item.product_id}`)
      );

      if (giftItems.length === 0) {
        if (callbackFn) callbackFn();
        return;
      }

      const updates = {};
      giftItems.forEach((gift) => {
        updates[gift.key] = 0;
      });

      return fetch(window.Shopify.routes.root + "cart/update.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates,
          sections: cartSectionsToRenderList.map((s) => s.section),
          sections_url: window.location.pathname,
        }),
      });
    })
    .then((res) => res?.text())
    .then((state) => {
      if (!state) return;
      const parsedState = JSON.parse(state);
      const newCartDrawer = parser
        .parseFromString(parsedState.sections["cart-drawer"], "text/html")
        .querySelector("#CartDrawer");

      if (newCartDrawer) {
        const oldCart = document.querySelector("cart-drawer")
        updateCartDrawer(oldCart, newCartDrawer, false, callbackFn);
        const newTotalValue = parseInt(
          newCartDrawer.querySelector(".gb-totals-total-value").innerText ?? "0"
        );
        console.log(newTotalValue)
        const variantInput = document.querySelector(
          "form.free-product-form .product-variant-id"
        );
        const freeProductId = variantInput ? variantInput.value : null;
        if (newTotalValue < amount_free_product && !!freeProductId && show_progress_bar) {
          removeFreeProduct(oldCart)
        }

      } else if (callbackFn) {
        callbackFn();
      }
    })
    .catch((error) => {
      console.error("Error while deleting free gift product :", error);
      if (callbackFn) callbackFn();
    });
}

function removeFreeProduct(cartDrawer, callbackFn) {
  if (cartDrawer.classList.contains('is-empty')) return;
  const removeBtn = cartDrawer
    .querySelector("button.gb-remove-product")
    .closest("cart-remove-button");
  if (!removeBtn) {
    console.error("Can't find remove button of the free product");
    if (callbackFn) callbackFn();
    return;
  }
  const cartIndex = removeBtn.dataset.index;
  const body = JSON.stringify({
    line: cartIndex,
    quantity: 0,
    sections: cartSectionsToRenderList.map((_item) => _item.section),
    sections_url: window.location.pathname,
  });

  fetch(window.routes.cart_change_url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body,
  })
    .then((response) => {
      return response.text();
    })
    .then((state) => {
      const parsedState = JSON.parse(state);
      const cartItemsCount = parsedState.item_count;
      updateBubbleCount(cartItemsCount);
      if (cartItemsCount == 0) {
        const parser = new DOMParser();
        cartDrawer.classList.toggle("is-empty", cartItemsCount === 0);
        const oldCartDrawer =
          cartDrawer.querySelector("#CartDrawer") ?? cartDrawer;
        const newCartDrawer = parser
          .parseFromString(parsedState.sections["cart-drawer"], "text/html")
          .querySelector("#CartDrawer");
        replaceCartComponent(oldCartDrawer, newCartDrawer);
        return;
      }

      if (parsedState.errors) {
        const cartStatus =
          document.getElementById("cart-live-region-text") ||
          document.getElementById("CartDrawer-LiveRegionText");
        cartStatus.setAttribute("aria-hidden", false);

        setTimeout(() => {
          cartStatus.setAttribute("aria-hidden", true);
        }, 1000);
        return;
      }
      const cartDrawerWrapper = document.querySelector("cart-drawer");
      const cartFooter = document.getElementById("main-cart-footer");

      if (cartFooter)
        cartFooter.classList.toggle("is-empty", cartItemsCount === 0);
      if (cartDrawerWrapper)
        cartDrawerWrapper.classList.toggle("is-empty", cartItemsCount === 0);

      cartSectionsToRenderList.forEach((section) => {
        const elementToReplace =
          document.getElementById(section.id) ||
          document.querySelector(section.selector) ||
          document.getElementById(section.id);

        if (section.section == "cart-drawer") {
          const cartDrawerContainer = elementToReplace;
          const newCartDrawer = parser.parseFromString(
            parsedState.sections[section.section],
            "text/html"
          );

          updateCartDrawer(cartDrawerContainer, newCartDrawer, false);
        } else {
          elementToReplace.innerHTML = new DOMParser()
            .parseFromString(parsedState.sections[section.section], "text/html")
            .querySelector(section.selector).innerHTML;
        }
      });

      if (callbackFn) callbackFn();
    })
    .catch((_err) => {
      console.error("Error________", _err);
      if (callbackFn) callbackFn();
    });
}


function animateProgressBar(progressBar, targetValue, duration = 500) {
  if (!progressBar) return;
  const startValue = progressBar.value;
  const startTime = performance.now();

  function updateProgress(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 2);
    progressBar.value = startValue + (targetValue - startValue) * easedProgress;
    if (progress < 1) {
      requestAnimationFrame(updateProgress);
    }
  }
  requestAnimationFrame(updateProgress);
}

function replaceCartComponent(oldComponent, newComponent) {
  if (oldComponent && !!newComponent) {
    oldComponent.parentNode.replaceChild(newComponent, oldComponent);
  }
}

function updateBubbleCount(newTotalCount) {
  /**
   ** update cart bubble number
   */
  const cartBubbleSpan = document.querySelector(".cart-count-bubble span");
  if (newTotalCount == "0" && cartBubbleSpan) {
    const cartBubbleContainer = cartBubbleSpan.parentNode;
    cartBubbleContainer.innerHTML = "";
  } else if (cartBubbleSpan) cartBubbleSpan.innerText = newTotalCount;
  else {
    const bubbleIcon = document.createElement("div");
    bubbleIcon.classList.add("cart-count-bubble");
    bubbleIcon.style.backgroundColor = "var(--global-section-text-color)";
    bubbleIcon.style.color = "var(--global-section-background-color)";
    bubbleIcon.innerHTML = `<span aria-hidden="true">${newTotalCount}</span>`;
    const bubbleContainer = document.querySelector("#cart-icon-bubble");
    if (bubbleContainer) bubbleContainer.appendChild(bubbleIcon);
  }
}

async function addFreeProduct(cartDrawer, callbackFn) {
  const form = document.querySelector("form.free-product-form");
  const formData = new FormData(form);
  const freeProductId = document.querySelector(
    "form.free-product-form .product-variant-id"
  ).value;
  if (!freeProductId) {
    if (callbackFn) callbackFn();
    return;
  }
  try {
    const response = await fetch(window.routes.cart_add_url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: formData,
    });

    if (response.ok) {
      fetch(window.routes.cart_url + "?view=drawer")
        .then((response) => response.text())
        .then((html) => {
          const parsedCartHtml = parser.parseFromString(html, "text/html");
          const newCartDrawer = parsedCartHtml.querySelector("#CartDrawer");
          if (newCartDrawer) {
            updateCartDrawer(cartDrawer, newCartDrawer, false, callbackFn);
          } else if (callbackFn) {
            callbackFn();
          }
        });
    }
  } catch (_err) {
    console.error("Error while adding free product", _err);
    if (callbackFn) callbackFn();
  }
}



function updateCartDrawer(
  oldCartDrawer,
  newCartDrawer,
  checkFreeProduct = true,
  callbackFn
) {
  if (!oldCartDrawer || !newCartDrawer) return;
  const cartDrawerContainer =
    oldCartDrawer.closest("cart-drawer") ?? oldCartDrawer;
  const cartDrawer =
    cartDrawerContainer.querySelector("#CartDrawer") ?? cartDrawerContainer;
  const variantInput = document.querySelector(
    "form.free-product-form .product-variant-id"
  );
  const freeProductId = variantInput ? variantInput.value : null;

  const oldTotalCount = cartDrawerContainer.querySelector(
    ".gb-cart-total-item"
  ).textContent;
  const newTotalCount = newCartDrawer.querySelector(
    ".gb-cart-total-item"
  ).textContent;
  if (newTotalCount == "" || newTotalCount == "0") {
    cartDrawerContainer.classList.add("is-empty");
    replaceCartComponent(cartDrawer, newCartDrawer);
    updateBubbleCount(newTotalCount);
    if (callbackFn) callbackFn();
  } else if (oldTotalCount == "" || oldTotalCount == "0") {
    const newTotalValue = parseInt(
      newCartDrawer.querySelector(".gb-totals-total-value").innerText ?? "0"
    );
    const newFreeProduct = newCartDrawer.querySelector(
      ".gb-find-remove-product.cart-item"
    );

    // amount_free_product and free_shipping_price declared on the theme.liquid file
    if (
      newTotalValue >= amount_free_product &&
      newFreeProduct == null &&
      !!freeProductId &&
      show_progress_bar
    )
      addFreeProduct(cartDrawerContainer, callbackFn);
    else {
      cartDrawerContainer.classList.remove("is-empty");
      replaceCartComponent(cartDrawer, newCartDrawer);
      updateBubbleCount(newTotalCount);
      initUpsellOnCart();
      if (callbackFn) callbackFn();
    }
  } else {
    cartDrawerContainer.querySelector(".gb-cart-total-item").innerText =
      newTotalCount;
    /**
     * * Progress bar animation
     */
    const newTotalValue = parseInt(
      newCartDrawer.querySelector(".gb-totals-total-value").innerText ?? "0"
    );
    if (show_progress_bar) {
      const progressbar = cartDrawerContainer.querySelector(
        ".free-product-progress-bar-main progress"
      );
      const startValue =
        progressbar?.value ??
        parseInt(
          document.querySelector(".cart-drawer__footer .gb-totals-total-value")
            .innerText
        );

      animateProgressBar(progressbar, newTotalValue, 1000);
      colorSVG(cartDrawerContainer, startValue, newTotalValue);
    }
    // * check free product eligibility
    const currentFreeProduct = cartDrawerContainer.querySelector(
      ".gb-find-remove-product.cart-item"
    );
    if (
      newTotalValue >= amount_free_product &&
      currentFreeProduct == null &&
      checkFreeProduct &&
      !!freeProductId &&
      show_progress_bar
    ) {
      addFreeProduct(cartDrawerContainer, callbackFn);
    } else if (
      newTotalValue < amount_free_product &&
      currentFreeProduct != null &&
      checkFreeProduct &&
      !!freeProductId && show_progress_bar
    ) {
      removeFreeProduct(cartDrawerContainer, callbackFn);
    } else {
      /**
       * * end of progress bar animation
       */
      cartSectionsList.forEach((selector) => {
        const element = cartDrawerContainer.querySelector(selector);
        const newElement = newCartDrawer.querySelector(selector);

        replaceCartComponent(element, newElement);
      });
      updateBubbleCount(newTotalCount);
      if (callbackFn) callbackFn();
    }
  }
}
function detectDiscountWrap() {
  const container = document.querySelector(
    ".cart-drawer .discount_price-container"
  );
  const discount = container?.querySelector(".discount_discount-value");
  const price = container?.querySelector(".totals__total-value");

  if (!container || !discount || !price) return;
  const discountTop = discount.getBoundingClientRect().top;
  const priceTop = price.getBoundingClientRect().top;
  console.log(discountTop, priceTop);
  if (discountTop + 5 < priceTop) {
    container.classList.add("wrap");
  } else {
    container.classList.remove("wrap");
  }
}

function colorSVG(cartDrawerContainer, startValue, newTotalValue) {
  const freeProductSvg = cartDrawerContainer.querySelector(
    ".free-product-progress-bar-main .free-gift-main"
  );
  const freeShipSvg = cartDrawerContainer.querySelector(
    ".free-product-progress-bar-main .free-shipping-main"
  );

  if (
    startValue < amount_free_product &&
    newTotalValue >= amount_free_product
  ) {
    freeProductSvg.classList.add("free-gift-main-color");
  } else if (
    startValue >= amount_free_product &&
    newTotalValue < amount_free_product
  ) {
    freeProductSvg.classList.remove("free-gift-main-color");
  }
  if (
    startValue < free_shipping_price &&
    newTotalValue >= free_shipping_price
  ) {
    freeShipSvg.classList.add("free-shipping-main-color");
  } else if (
    startValue >= free_shipping_price &&
    newTotalValue < free_shipping_price
  ) {
    freeShipSvg.classList.remove("free-shipping-main-color");
  }
}

function startLoading(buttonElem) {
  if (!buttonElem) return;
  const spinAnim = buttonElem.querySelector(".spin-animation");
  const contentElem = buttonElem.querySelector(".content");
  if (spinAnim) spinAnim.style.display = "block";
  if (contentElem) contentElem.style.display = "none";
}

function stopLoading(buttonElem) {
  if (!buttonElem) return;
  const spinAnim = buttonElem.querySelector(".spin-animation");
  const contentElem = buttonElem.querySelector(".content");
  if (spinAnim) spinAnim.style.display = "none";
  if (contentElem) contentElem.style.display = "block";
}

class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener("click", (event) => {
      event.preventDefault();
      const removeButton = event.target.closest("button.cart-remove-button");
      startLoading(removeButton);
      const cartItems =
        this.closest("cart-items") || this.closest("cart-drawer-items");
      cartItems.updateQuantity(this.dataset.index, 0, event);
    });
  }
}

customElements.define("cart-remove-button", CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById("shopping-cart-line-item-status") ||
      document.getElementById("CartDrawer-LineItemStatus");

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener("change", debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(
      PUB_SUB_EVENTS.cartUpdate,
      (event) => {
        if (event.source === "cart-items") {
          return;
        }
        return this.onCartUpdate();
      }
    );
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute("value");
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event, callbackFn) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    let message = "";

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace(
        "[min]",
        event.target.dataset.min
      );
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace(
        "[max]",
        event.target.max
      );
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace(
        "[step]",
        event.target.step
      );
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity("");
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        event,
        document.activeElement.getAttribute("name"),
        event.target.dataset.quantityVariantId,
        callbackFn
      );
    }
  }

  onChange(event) {
    const buttonType = event.detail?.buttonType;
    const quantityInput = event.target.closest(".cart-quantity");
    if (!quantityInput) return;
    const curButton = quantityInput.querySelector(`[name='${buttonType}']`);
    if (curButton) {
      startLoading(curButton);
      this.validateQuantity(event, () => stopLoading(curButton));
    } else this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === "CART-DRAWER-ITEMS") {
      return fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          const cartDrawerContainer = document.querySelector("cart-drawer");
          const newCartDrawer = html.querySelector("#CartDrawer");
          updateCartDrawer(cartDrawerContainer, newCartDrawer);
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      return fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          const sourceQty = html.querySelector("cart-items");
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "main-cart-items",
        section: document.getElementById("main-cart-items").dataset.id,
        selector: ".js-contents",
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section",
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section",
      },
      {
        id: "main-cart-footer",
        section: document.getElementById("main-cart-footer").dataset.id,
        selector: ".js-contents",
      },
    ];
  }

  updateQuantity(line, quantity, event, name, variantId, callbackFn) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    const eventTarget =
      event.currentTarget instanceof CartRemoveButton ? "clear" : "change";

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        // if the product is rely on gift product we remove all gifted product

        if (!parsedState.items.some(item => item.product_id == relyOnProductId) && parsedState.items_removed[0]?.product_id == relyOnProductId) {
          removeAllGiftsFromSettings()
        }


        CartPerformance.measure(
          `${eventTarget}:paint-updated-sections"`,
          () => {
            const quantityElement =
              document.getElementById(`Quantity-${line}`) ||
              document.getElementById(`Drawer-quantity-${line}`);
            const items = document.querySelectorAll(".cart-item");

            if (parsedState.errors) {
              quantityElement.value = quantityElement.getAttribute("value");
              this.updateLiveRegions(line, parsedState.errors);
              return;
            }

            this.classList.toggle("is-empty", parsedState.item_count === 0);
            const cartDrawerWrapper = document.querySelector("cart-drawer");
            const cartFooter = document.getElementById("main-cart-footer");

            if (cartFooter)
              cartFooter.classList.toggle(
                "is-empty",
                parsedState.item_count === 0
              );
            if (cartDrawerWrapper)
              cartDrawerWrapper.classList.toggle(
                "is-empty",
                parsedState.item_count === 0
              );

            this.getSectionsToRender().forEach((section) => {
              const elementToReplace =
                document.getElementById(section.id) ||
                document.querySelector(section.selector) ||
                document.getElementById(section.id);

              if (section.section == "cart-drawer") {
                const cartDrawerContainer = elementToReplace;
                const newCartDrawerContainer = parser.parseFromString(
                  parsedState.sections[section.section],
                  "text/html"
                );
                const newCartDrawer =
                  newCartDrawerContainer.getElementById(section.id) ||
                  newCartDrawerContainer.querySelector(section.selector) ||
                  newCartDrawerContainer.getElementById(section.id);

                updateCartDrawer(cartDrawerContainer, newCartDrawer);
              } else {
                elementToReplace.innerHTML = this.getSectionInnerHTML(
                  parsedState.sections[section.section],
                  section.selector
                );
              }
            });
            const updatedValue = parsedState.items[line - 1]
              ? parsedState.items[line - 1].quantity
              : undefined;
            let message = "";
            if (
              items.length === parsedState.items.length &&
              updatedValue !== parseInt(quantityElement.value)
            ) {
              if (typeof updatedValue === "undefined") {
                message = window.cartStrings.error;
              } else {
                message = window.cartStrings.quantityError.replace(
                  "[quantity]",
                  updatedValue
                );
              }
            }
            this.updateLiveRegions(line, message);

            const lineItem =
              document.getElementById(`CartItem-${line}`) ||
              document.getElementById(`CartDrawer-Item-${line}`);
            if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
              cartDrawerWrapper
                ? trapFocus(
                  cartDrawerWrapper,
                  lineItem.querySelector(`[name="${name}"]`)
                )
                : lineItem.querySelector(`[name="${name}"]`).focus();
            } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
              trapFocus(
                cartDrawerWrapper.querySelector(".drawer__inner-empty"),
                cartDrawerWrapper.querySelector("a")
              );
            } else if (
              document.querySelector(".cart-item") &&
              cartDrawerWrapper
            ) {
              trapFocus(
                cartDrawerWrapper,
                document.querySelector(".cart-item__name")
              );
            }
          }
        );

        CartPerformance.measureFromEvent(`${eventTarget}:user-action`, event);

        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: "cart-items",
          cartData: parsedState,
          variantId: variantId,
        });
      })
      .catch((err) => {
        this.querySelectorAll(".loading__spinner").forEach((overlay) =>
          overlay.classList.add("hidden")
        );
        const errors =
          document.getElementById("cart-errors") ||
          document.getElementById("CartDrawer-CartErrors");
        errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        this.disableLoading(line);
        if (callbackFn) callbackFn();
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) ||
      document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError && !!message) {
      lineItemError.querySelector(".cart-item__error-text").textContent =
        message;

      lineItemError.style.display = "block";
      lineItemError.style.marginBottom = "12px";
      setTimeout(() => {
        lineItemError.style.display = "none";
        lineItemError.style.marginBottom = "0";
      }, 4000);
    }

    this.lineItemStatusElement.setAttribute("aria-hidden", true);

    const cartStatus =
      document.getElementById("cart-live-region-text") ||
      document.getElementById("CartDrawer-LiveRegionText");
    cartStatus.setAttribute("aria-hidden", false);

    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) =>
      overlay.classList.remove("hidden")
    );

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }

  disableLoading(line) {
    const mainCartItems =
      document.getElementById("main-cart-items") ||
      document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("cart__items--disabled");

    const cartItemElements = this.querySelectorAll(
      `#CartItem-${line} .loading__spinner`
    );
    const cartDrawerItemElements = this.querySelectorAll(
      `#CartDrawer-Item-${line} .loading__spinner`
    );

    cartItemElements.forEach((overlay) => overlay.classList.add("hidden"));
    cartDrawerItemElements.forEach((overlay) =>
      overlay.classList.add("hidden")
    );
  }
}

customElements.define("cart-items", CartItems);

if (!customElements.get("cart-note")) {
  customElements.define(
    "cart-note",
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          "input",
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, {
              ...fetchConfig(),
              ...{ body },
            }).then(() =>
              CartPerformance.measureFromEvent("note-update:user-action", event)
            );
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}

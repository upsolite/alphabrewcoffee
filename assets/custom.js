/**
 * * end of cart upsell block part
 */
$(document).ready(function () {
  if (amount_free_product > 0 && show_progress_bar && free_product_id != null) {
    /*GB! free product added STARTS*/
    setTimeout(function () {
      var cart_total = $(".gb-totals-total-value").first().text();
      if (cart_total >= amount_free_product) {
        if ($(".cart-item").hasClass("gb-find-remove-product")) {
          console.log("Free product already in cart");
        } else {
          console.log("Adding free product");
          $(".gb-free-product-trigger").trigger("click");
        }
      } else {
        console.log("Removing free product - under threshold");
        $(".gb-remove-product").trigger("click");
      }
    }, 3000);
    $("body").on("click", ".gb-sumbit-free", function () {
      setTimeout(function () {
        var cart_total = $(".gb-totals-total-value").first().text();
        if (cart_total >= amount_free_product) {
          if ($(".cart-item").hasClass("gb-find-remove-product")) {
          } else {
            $(".gb-free-product-trigger").trigger("click");
          }
        } else {
          $(".gb-remove-product").trigger("click");
        }
      }, 3000);
    });

    // $("body").on("click", ".shop-add-to-cart-button", function () {
    //   setTimeout(function () {
    //     var cart_total = $(".gb-totals-total-value").first().text();
    //     if (cart_total >= amount_free_product) {
    //       if ($(".cart-item").hasClass("gb-find-remove-product")) {
    //       } else {
    //         $(".gb-free-product-trigger").trigger("click");
    //       }
    //     } else {
    //       $(".gb-remove-product").trigger("click");
    //     }
    //   }, 3000);
    // });
  }

  $("body").on(
    "click",
    ".gb-shipping-protection-button label.switch",
    async (e) => {
      if (e.target.tagName == "INPUT") return;
      const curElem = document.querySelector(
        ".gb-shipping-protection-button label.switch"
      );
      const curInputElem = document.querySelector(
        ".gb-shipping-protection-button label.switch input"
      );
      const spinAnim = document.querySelector(
        ".gb-shipping-protection-button .spin-animation"
      );
      const checkElem = document.querySelector(
        ".gb-shipping-protection-button .complete-check"
      );
      if (curElem.classList.contains("unchecked") && !curInputElem.checked) {
        if (spinAnim.style.display == "block" || curInputElem.checked) return;

        // $(".gb-product-shipping-protection-product-tirgger").trigger("click");
        const form = document.querySelector("form.shipping-protection-form");

        const formData = new FormData(form);
        if (!formData.get("id")) {
          console.error(
            "There is no shipping protection product selected. Please select the shipping product in the global theme settings"
          );
          return;
        }

        spinAnim.style.display = "block";

        try {
          const response = await fetch(routes.cart_add_url, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
          });

          if (response.ok) {
            spinAnim.style.display = "none";

            checkElem.style.display = "block";
          }
        } catch (err) {
          console.error("error at shipping protection form submission", err);
        }
        fetch(routes.cart_url + "?view=drawer")
          .then((response) => response.text())
          .then((html) => {
            const cartDrawer = document.querySelector("#CartDrawer");
            const parsedCartHtml = parser.parseFromString(html, "text/html");
            const newCartDrawer = parsedCartHtml.querySelector("#CartDrawer");
            if (cartDrawer && newCartDrawer) {
              updateCartDrawer(cartDrawer, newCartDrawer, true, () => {
                curElem.classList.remove("unchecked");
                curElem.classList.add("checked");
                curInputElem.checked = true;
              });
            }
          })
          .catch((_err) => {
            curElem.classList.remove("unchecked");
            curElem.classList.add("checked");
            curInputElem.checked = true;
          });
      } else if (
        curElem.classList.contains("checked") &&
        curInputElem.checked
      ) {
        checkElem.style.display = "none";
        const cartDrawer = document.querySelector("#CartDrawer");
        const removeButton = cartDrawer.querySelector(
          `cart-remove-button[data-id="${shipping_product}"]`
        );
        const shippingItemIndex = removeButton?.dataset.index;
        if (!removeButton || !shippingItemIndex) {
          return;
        }

        const cartItems =
          cartDrawer.querySelector("cart-items") ||
          cartDrawer.querySelector("cart-drawer-items");

        const event = new CustomEvent("remove-shipping-protection", {
          detail: null,
        });
        cartItems.updateQuantity(shippingItemIndex, 0, event, "", "", () => {
          curElem.classList.remove("checked");
          curElem.classList.add("unchecked");
          curInputElem.removeAttribute("checked");
        });
      }
    }
  );

  $("body").on("change", ".gb-change-variant_id", function () {
    var id_change = $(this).find(":selected").attr("data-variant-id");
    if (!id_change) {
      console.error("No data-variant-id found on selected option");
      return;
    }
    $(this)
      .closest(".gb-get-main-freq-pro")
      .find(".product-variant-id")
      .val(id_change);
  });
});

document.addEventListener("change", function (e) {
  if (
    e.target.matches(
      ".cart-drawer .gbfrequently-bought-with-main-whole .select__select"
    )
  ) {
    const parentBlock = e.target.closest(".gb-get-main-freq-pro");
    if (!parentBlock) {
      console.log("Error: Could not find parent block");
      return;
    }

    const allValues = Array.from(
      parentBlock.querySelectorAll(".select__select")
    )
      .map((sel) => sel.value)
      .join(" / ");

    const variantSelect = parentBlock.querySelector('[name="variants"]');
    if (!variantSelect) {
      console.log("Error: Could not find variant selector");
      return;
    }

    const matchedOption = Array.from(variantSelect.options).find((option) =>
      option.text.includes(allValues)
    );

    const idInput = parentBlock.querySelector('[name="id"]');
    if (!idInput) {
      console.log("Error: Could not find id input field");
      return;
    }

    if (matchedOption) {
      console.log("Matched variant option value:", matchedOption.value);
      idInput.value = matchedOption.value;
      console.log("Set ID input value to:", idInput.value);
    } else {
      console.log("No matching variant found for:", allValues);
    }
  }
});

// Add validation for form submissions to ensure ID parameter is present
document.addEventListener("submit", function (e) {
  if (e.target.action && e.target.action.includes("/cart/add")) {
    const idInput = e.target.querySelector('[name="id"]');
    if (!idInput || !idInput.value) {
      console.log("Preventing submission - missing id parameter");
      e.preventDefault();
      return false;
    }
  }
});

// Improve cart quantity handlers
$(document).ready(function () {
  // Ensure all cart quantity changes include product ID
  $(".cart-item .quantity__button, .cart-item .quantity__input").on(
    "click change input",
    function () {
      const cartItem = $(this).closest(".cart-item");
      const variantId = $(this)
        .closest(".quantity-input")
        .find(".quantity__input")
        .data("quantity-variant-id");

      // If this is a form submission, ensure the ID is included
      if ($(this).closest("form").length > 0) {
        let idInput = $(this).closest("form").find('input[name="id"]');
        if (idInput.length === 0 && variantId) {
          console.log("Adding missing ID input to cart form");
          $("<input>")
            .attr({
              type: "hidden",
              name: "id",
              value: variantId,
            })
            .appendTo($(this).closest("form"));
        } else if (idInput.length > 0 && variantId) {
          idInput.val(variantId);
        }
      }
    }
  );

  // Add validation for cart drawer checkout button
  $("#CartDrawer-Checkout").on("click", function (e) {
    const form = $("#CartDrawer-Form");
    if (form.length === 0) return;

    // Check if there are any items in the cart
    const cartItems = form.find(".cart-item");
    if (cartItems.length === 0) {
      console.log("No items in cart, preventing checkout");
      e.preventDefault();
      return false;
    }

    console.log("Cart checkout with", cartItems.length, "items");
  });

  /**
   * * Prevent redirecting to checkout when pressing enter at quantity input
   */
  $(document).on("keydown", ".quantity__input", function (e) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      $(this).trigger("blur");
    }
  });
  // * End of handler
});

// Fix for frequently bought products add to cart
$(document).ready(function () {
  // Find all frequently bought product forms or buttons
  $(
    ".gbfrequently-bought-with-main-whole button, .gbfrequently-bought-with-main-whole .gb-sumbit-free, .gb-free-product-trigger, .gb-product-shipping-protection-product-tirgger, .gb-product-sticky-add-to-cart-form"
  ).on("click", function (e) {
    const parentBlock = $(this).closest(".gb-get-main-freq-pro, form");
    if (!parentBlock) {
      console.error(
        "Could not find parent block for frequently bought product"
      );
      return;
    }

    // Find the product ID input or data attribute
    let productId = null;

    // Check for direct ID input
    const idInput = parentBlock.find('input[name="id"]');
    if (idInput.length > 0 && idInput.val()) {
      productId = idInput.val();
    }
    // Check for variant ID on select
    else if (parentBlock.find(".gb-change-variant_id").length > 0) {
      const selectedOption = parentBlock.find(
        ".gb-change-variant_id option:selected"
      );
      if (selectedOption.length > 0) {
        productId = selectedOption.data("variant-id");
      }
    }
    // Check for product-variant-id input
    else if (parentBlock.find(".product-variant-id").length > 0) {
      productId = parentBlock.find(".product-variant-id").val();
    }
    // Check for data attributes on the button itself
    else if ($(this).data("variant-id")) {
      productId = $(this).data("variant-id");
    }

    console.log("Frequently bought product add to cart - ID:", productId);

    if (
      this.classList.contains("gb-free-product-trigger") &&
      !show_progress_bar
    )
      return;

    // If no product ID found, prevent submission
    if (!productId) {
      console.error("Missing product ID for frequently bought product");
      e.preventDefault();
      return false;
    }

    // Update or create the ID input
    if (idInput.length === 0) {
      console.log("Adding missing ID input to frequently bought product form");
      $("<input>")
        .attr({
          type: "hidden",
          name: "id",
          value: productId,
        })
        .appendTo(parentBlock);
    } else {
      idInput.val(productId);
    }

    // Ensure quantity is included
    let quantityInput = parentBlock.find('input[name="quantity"]');
    if (quantityInput.length === 0) {
      console.log(
        "Adding default quantity input to frequently bought product form"
      );
      $("<input>")
        .attr({
          type: "hidden",
          name: "quantity",
          value: 1,
        })
        .appendTo(parentBlock);
    } else if (!quantityInput.val() || quantityInput.val() < 1) {
      quantityInput.val(1);
    }
  });
});

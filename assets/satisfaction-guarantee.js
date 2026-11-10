class SatisfactionGuarantee{constructor(){this.init()}
init(){if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",()=>this.attachEventListeners())}else{this.attachEventListeners()}}
attachEventListeners(){const ctaButtons=document.querySelectorAll(".guarantee-section__cta");ctaButtons.forEach((button)=>{button.addEventListener("click",(event)=>this.handleButtonClick(event,button))})}
handleButtonClick(event,button){if(button.hasAttribute('data-scroll-to-first-section')){return}
event.preventDefault();this.scrollToProduct();return!1}
scrollToProduct(){const productSection=document.querySelector(".shopify-section .product, "+'.shopify-section [data-section-type="product"], '+"main#MainContent .product-template, "+"main#MainContent .product, "+"#ProductSection, "+"#shopify-section-product-template, "+".product-section");if(productSection){productSection.scrollIntoView({behavior:"smooth",block:"start",})}else{window.scrollTo({top:0,behavior:"smooth",})}}}
document.addEventListener("DOMContentLoaded",function(){new SatisfactionGuarantee()})
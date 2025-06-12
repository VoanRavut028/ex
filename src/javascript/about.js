import { clientOnAbout, memberOnAbout, ourTrustPartner } from "./data.js";

slider();
function slider() {
  // Initialize Swiper
  const swiper = new Swiper(".mySwiper", {
    // Disable loop
    loop: true,

    // Enable navigation
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    autoplay: {
      delay: 2000, // 2 seconds
      disableOnInteraction: false, // Continue autoplay after user interaction
      pauseOnMouseEnter: true, // Pause when hovering
    },

    // Enable pagination
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },

    // Responsive breakpoints
    breakpoints: {
      // Mobile
      320: {
        slidesPerView: 1,
        spaceBetween: 20,
      },
      // Tablet
      768: {
        slidesPerView: 2,
        spaceBetween: 30,
      },
      // Desktop
      1024: {
        slidesPerView: 3,
        spaceBetween: 40,
      },
    },

    // Smooth transitions
    speed: 600,
    effect: "slide",

    // Center slides
    centeredSlides: false,

    // Enable grab cursor
    grabCursor: true,

    // Keyboard control
    keyboard: {
      enabled: true,
    },

    // Mouse wheel control
    mousewheel: {
      enabled: true,
      forceToAxis: true,
    },

    // Auto height
    autoHeight: false,

    // Slide change callbacks
  });
}

clientFeedBackOnAbout();
function clientFeedBackOnAbout() {
  let card = ``;
  clientOnAbout.forEach((value) => {
    card += `
  <div data-aos="zoom-in-up" class="swiper-slide">
          <div class="card client">
            <div class="card-title">
              <div
                class="star-rating d-flex justify-content-center text-warning fs-4">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
              </div>
              <p class="text-center py-3 fw-normal">
                "${value.description}"
              </p>
            </div>
            <div class="card-bofy">
              <div
                class="d-flex justify-content-center flex-column align-items-center">
                <img
                  src="${value.img}"
                  alt="Client Photo"
                  class="rounded-circle img-fluid"
                  style="width: 100px; height: 100px; object-fit:cover;" />
                <p class="fs-4 ">${value.name}</p>
                <p class="">${value.position}</p>
              </div>
            </div>
          </div>
        </div>
  `;
  });
  document.querySelector(".client-feedback").innerHTML = card;
}

function memberShipOnAbout() {
  let card = ``;
  memberOnAbout.forEach((value) => {
    card += `
   <div data-aos="zoom-in-up" class="col-lg-3 col-md-6 col-12">
          <div class="team-card">
            <img
              src="${value.img}"
              alt="${value.name}"
              class="team-image" />
            <div class="social-overlay">
              <div class="social-icons">
                <i class="fa-brands fa-facebook-f"></i>
                <i class="fa-brands fa-twitter"></i>
                <i class="fa-brands fa-linkedin"></i>
              </div>
            </div>
          </div>
          <div class="team-info">
            <h2>${value.name}</h2>
            <p>${value.position}</p>
          </div>
        </div>
  `;
  });
  document.querySelector(".team-member").innerHTML = card;
}
memberShipOnAbout();

function loadTrustpartner() {
  let c = ``;
  ourTrustPartner.forEach((items) => {
    c += `
      <div data-aos="zoom-in-up" class="col">
        <div class="logo-img-client p-3">
          <img alt="${items.img}"  class="client img-fluid" src="${items.img}">
        </div>
      </div>
    `;
  });
  document.querySelector(".load-trust-partner").innerHTML = c;
}

loadTrustpartner();

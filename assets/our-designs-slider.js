// Our Designs Slider - Swiper Configuration
document.addEventListener('DOMContentLoaded', function() {
  const swiper = new Swiper('.our-designs-swiper', {
    slidesPerView: 1.2,
    spaceBetween: 20,
    centeredSlides: false,
    freeMode: true,
    loop: true,
    grabCursor: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    breakpoints: {
      640: {
        slidesPerView: 2.2,
        spaceBetween: 24,
      },
      1024: {
        slidesPerView: 3.2,
        spaceBetween: 32,
      },
      1400: {
        slidesPerView: 4,
        spaceBetween: 40,
      },
    },
  });
});

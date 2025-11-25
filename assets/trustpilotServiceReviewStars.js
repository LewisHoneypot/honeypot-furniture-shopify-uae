// TrustPilot Service Reviews
// url for word
var environment = "live";

const serviceStarsUrl =
  `https://honeypot-trade.co.uk/` +
  environment +
  `/trustpilot/service-stars.php`;

// Fetch data using the Fetch API
fetch(serviceStarsUrl)
  .then((response) => response.json())
  .then((serviceStars) => {
    // console.log(serviceStars);
    const serviceStarsWordElement = document.querySelector(".serviceStarsWord");
    const numberOfReviewsImageElement = document.querySelector(".numberOfReviewsImage");

    if (serviceStarsWordElement) {
      serviceStarsWordElement.textContent = serviceStars ? serviceStars.string : "";
    }

    if (numberOfReviewsImageElement) {
      numberOfReviewsImageElement.innerHTML = serviceStars
        ? `<img src="//honeypot-furniture.myshopify.com/cdn/shop/files/trustpilot_${serviceStars.stars}.png" class="stars-image pb-1" alt="Trustpilot Stars" height="26" width="100">`
        : "";
    }
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
  });

fetch('https://honeypot-trade.co.uk/' + environment + '/trustpilot/service-reviews-total.php')
  .then((response) => response.json())
  .then((reviewData) => {

    var numberOfReviews = reviewData.numberOfReviews.total;
    // console.log('numberOfReviews: ', numberOfReviews)

    const numberOfReviewsElement = document.querySelector(".numberOfReviews");

    if (numberOfReviewsElement) {
      numberOfReviewsElement.innerHTML = numberOfReviewsElement
        ? 'Based on ' + numberOfReviews + ' reviews '
        : "";
    }
  });
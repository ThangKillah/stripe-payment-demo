// A reference to Stripe.js
var stripe;

var orderData = {
  items: [{ id: "photo-subscription" }],
  currency: "usd",
};

fetch("http://localhost:4242/create-payment-intent", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(orderData),
})
  .then(function (result) {
    return result.json();
  })
  .then(function (data) {
    return setupElements(data);
  })
  .then(function ({ stripe, card, clientSecret }) {
    document.querySelector("#submit").addEventListener("click", function (evt) {
      evt.preventDefault();
      // Initiate payment when the submit button is clicked
      pay(stripe, card, clientSecret);
    });
  });

// Set up Stripe.js and Elements to use in checkout form
var setupElements = function (data) {
  stripe = Stripe(data.publicKey);
  var elements = stripe.elements();
  var style = {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  };

  var card = elements.create("card", { style: style });
  card.mount("#card-element");

  return {
    stripe: stripe,
    card: card,
    clientSecret: data.clientSecret,
  };
};

/*
 * Calls stripe.handleCardPayment which creates a pop-up modal to
 * prompt the user to enter extra authentication details without leaving your page
 */
var pay = function (stripe, card, clientSecret) {
  changeLoadingState(true);

  // Initiate the payment.
  // If authentication is required, handleCardPayment will automatically display a modal
  stripe.handleCardPayment(clientSecret, card).then(function (result) {
    if (result.error) {
      // Show error to your customer
      showError(result.error.message);
    } else {
      // The payment has been processed!
      orderComplete(clientSecret);
    }
  });
};

/* ------- Post-payment helpers ------- */

/* Shows a success / error message when the payment is complete */
var orderComplete = function (clientSecret) {
  stripe.retrievePaymentIntent(clientSecret).then(function (result) {
    var paymentIntent = result.paymentIntent;
    var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

    document.querySelector(".sr-payment-form").classList.add("hidden");
    document.querySelector("pre").textContent = paymentIntentJson;

    document.querySelector(".sr-result").classList.remove("hidden");
    setTimeout(function () {
      document.querySelector(".sr-result").classList.add("expand");
    }, 200);

    changeLoadingState(false);
  });
};

var showError = function (errorMsgText) {
  changeLoadingState(false);
  var errorMsg = document.querySelector(".sr-field-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function () {
    errorMsg.textContent = "";
  }, 4000);
};

// Show a spinner on payment submission
var changeLoadingState = function (isLoading) {
  if (isLoading) {
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};

// Hide banner if window is too small
if (window.outerHeight < 600) {
  document.querySelector(".banner").classList.add("hidden");
}

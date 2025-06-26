/* eslint-disable */
// const catchAsync = require('../utils/catchAsync');
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51RYYV89IYE3O6zgl5UfdYyejYMWVY834i2Q6rsuO6aVdoIvhEttzZEHjvWsT0w5RqYza0gVumAY6vXbIo8faCi7u00kjHP5S7K',
);

export const bookTour = async (tourId) => {
  try {
    // 1 get session frfom server
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    console.log(session);
    // 2 create checkout form + carge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

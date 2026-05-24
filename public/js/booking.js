/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/bookings/book-tour/${tourId}`,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Tour booked successfully!');
      window.setTimeout(() => {
        location.assign('/my-tours');
      }, 800);
      return true;
    }
  } catch (err) {
    const message =
      err.response?.data?.message || 'Could not book this tour. Try again.';
    showAlert('error', message);
  }
  return false;
};

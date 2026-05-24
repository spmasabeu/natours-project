/*eslint-disable*/
// updateData
import axios from 'axios';
import { showAlert } from './alerts';

export const updateSettings = async (data, type) => {
  try {
    const urlMe = '/api/v1/users/updateMe';
    const urlPassword = '/api/v1/users/updateMyPassword';

    const url = type === 'password' ? urlPassword : urlMe;

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

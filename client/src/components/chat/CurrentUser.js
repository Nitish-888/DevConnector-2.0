import axios from 'axios';

const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  if (token) {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    return decodedToken.sub;
  }
  return null;
};

export { getCurrentUser  };
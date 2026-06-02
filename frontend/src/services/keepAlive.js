const BACKEND_URL = 'https://smarthubstudy-1.onrender.com';

export const startKeepAlive = () => {
  const ping = () => {
    fetch(`${BACKEND_URL}/`)
      .then(() => {})
      .catch(() => {});
  };
  ping();
  setInterval(ping, 14 * 60 * 1000);
};
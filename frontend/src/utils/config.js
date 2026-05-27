const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

const DEFAULT_BASE_URL = "http://localhost:5000";

const BASE_URL = rawBaseUrl
  ? rawBaseUrl.replace(/\/+$/, "")
  : (() => {
      if (!rawBaseUrl) {
        // Only warn once per session
        if (!config.__warned) {
          console.warn(
            `VITE_API_BASE_URL is not defined. Falling back to ${DEFAULT_BASE_URL}.`
          );
          config.__warned = true;
        }
      }
      return DEFAULT_BASE_URL;
    })();

export default BASE_URL;

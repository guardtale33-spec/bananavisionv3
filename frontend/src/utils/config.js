const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

const DEFAULT_BASE_URL = "https://bananavisionv3-production.up.railway.app/api";

// Module-level flag agar warning hanya muncul sekali
let _warnedMissingUrl = false;


const BASE_URL = rawBaseUrl
  ? rawBaseUrl.replace(/\/+$/, "")
  : (() => {
      if (!_warnedMissingUrl) {
        console.warn(
          `[BananaVision] VITE_API_BASE_URL is not defined. Falling back to ${DEFAULT_BASE_URL}.`
        );
        _warnedMissingUrl = true;
      }
      return DEFAULT_BASE_URL;
    })();

export default BASE_URL;

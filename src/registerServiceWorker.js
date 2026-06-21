if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const register = () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Keep the site usable if a browser blocks service worker registration.
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}

// just pass through Franz
module.exports = Franz => Franz;

// Remove the Ferdi user agent - probably not required, but done just in case SmarterMail has issues with this user agent string in future
overrideUserAgent() {
  return window.navigator.userAgent.replace(
    /(Ferdi|Electron)\/\S+ \([^)]+\)/g,
    ""
  );
}

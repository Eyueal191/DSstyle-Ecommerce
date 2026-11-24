/**
 * Telegram Mini App WebApp SDK Integration Utility for Admin FrontEnd
 * Handles Fullscreen, Expand, Vertical Swipe Protection, Theme & Admin Session Sync
 * Gracefully checks SDK version capability to avoid unsupported method errors on older clients (e.g. v6.0)
 */

export function initTelegramWebApp() {
  try {
    const tg = window.Telegram?.WebApp;
    if (!tg) return null;

    // Helper: Safely check if Telegram client version supports a feature
    const isSupported = (minVersion) => {
      try {
        if (typeof tg.isVersionAtLeast === "function") {
          return tg.isVersionAtLeast(minVersion);
        }
      } catch {}
      return false;
    };

    // 1. Notify Telegram client that the Mini App is initialized and ready
    try {
      tg.ready?.();
    } catch {}

    // Option 1: Standard Bottom-Sheet (Modal Window - Never full screen)
    // Disable vertical swipe gestures so page scrolling never drags the Telegram sheet to full screen or collapses it
    if (isSupported("7.7") && typeof tg.disableVerticalSwipes === "function") {
      try {
        tg.disableVerticalSwipes();
      } catch {}
    }

    // 5. Match Telegram header and background chrome (Requires Telegram Bot API 6.1+)
    if (isSupported("6.1")) {
      if (typeof tg.setHeaderColor === "function") {
        try {
          tg.setHeaderColor("#100f0d");
        } catch {}
      }

      if (typeof tg.setBackgroundColor === "function") {
        try {
          tg.setBackgroundColor("#100f0d");
        } catch {}
      }
    }

    // 6. Enable graceful closing confirmation if admin attempts to leave (Requires 6.2+)
    if (isSupported("6.2") && typeof tg.enableClosingConfirmation === "function") {
      try {
        tg.enableClosingConfirmation();
      } catch {}
    }

    // 7. Prevent auto-expansion on viewport changes (keeps standard bottom-sheet frame at all times)

    return tg;
  } catch {
    return null;
  }
}

export function isTelegramWebApp() {
  return Boolean(window.Telegram?.WebApp?.initData);
}


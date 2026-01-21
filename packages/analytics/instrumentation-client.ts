import posthog from "posthog-js";
import { keys } from "./keys";

export const initializeAnalytics = () => {
  const posthogKey = keys().NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = keys().NEXT_PUBLIC_POSTHOG_HOST;

  if (posthogKey && posthogHost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      defaults: "2025-05-24",
    });
  }
};

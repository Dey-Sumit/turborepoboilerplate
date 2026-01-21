import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    client: {
      NEXT_PUBLIC_POSTHOG_KEY: z.union([z.string().startsWith("phc_"), z.literal("")]).optional(),
      NEXT_PUBLIC_POSTHOG_HOST: z.union([z.string().url(), z.literal("")]).optional(),
      NEXT_PUBLIC_GA_MEASUREMENT_ID: z.union([z.string().startsWith("G-"), z.literal("")]).optional(),
    },
    runtimeEnv: {
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    },
  });

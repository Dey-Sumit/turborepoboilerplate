import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      LIVEBLOCKS_SECRET: z.union([z.string().startsWith("sk_"), z.literal("")]).optional(),
    },
    runtimeEnv: {
      LIVEBLOCKS_SECRET: process.env.LIVEBLOCKS_SECRET,
    },
  });

/**
 * Parser for focus annotation queries
 * Supports flag-based syntax: --delay=1.5 --color=blue
 */

export interface FocusData {
  delayInSeconds: number;
  fadeInDurationInSeconds: number; // Duration for the fade-in effect only
}

export interface ParseResult {
  data: FocusData;
}

/**
 * Default values for focus annotations
 */
const DEFAULTS: FocusData = {
  delayInSeconds: 0,
  fadeInDurationInSeconds: 0.5, // Quick fade-in, then stays focused
};

/**
 * Parse the annotation query string to extract focus parameters
 * @param query - The query string from annotation (e.g., "--delay=1.5")
 * @returns Parsed focus data with defaults applied
 */
export function parse(query: string): ParseResult {
  const data: FocusData = { ...DEFAULTS };

  // Split by spaces and process each flag
  const parts = query.trim().split(/\s+/);

  for (const part of parts) {
    if (part.startsWith("--")) {
      const [flag, value] = part.slice(2).split("=");

      switch (flag) {
        case "delay": {
          const delay = parseFloat(value);
          if (!isNaN(delay)) {
            data.delayInSeconds = delay;
          }
          break;
        }

        case "fade":
        case "fadeDuration": {
          const fadeDuration = parseFloat(value);
          if (!isNaN(fadeDuration)) {
            data.fadeInDurationInSeconds = fadeDuration;
          }
          break;
        }

        default:
          // Ignore unknown flags
          console.warn(`Unknown focus flag: --${flag}`);
      }
    }
  }

  console.log("Focus Parser Input:", query);
  console.log("Focus Parser Output:", data);

  return { data };
}

const focusParser = {
  parse,
};

export default focusParser;

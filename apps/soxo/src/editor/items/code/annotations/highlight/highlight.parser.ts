/**
 * Parser for highlight annotation queries
 * Supports flag-based syntax: --color=red --delay=1.5 --duration=2
 */

export interface HighlightData {
  color: string;
  delayInSeconds: number;
  durationInSeconds: number;
}

export interface ParseResult {
  data: HighlightData;
}

/**
 * Default values for highlight annotations
 */
const DEFAULTS: HighlightData = {
  color: "yellow",
  delayInSeconds: 0,
  durationInSeconds: 1,
};

/**
 * Parse the annotation query string to extract highlight parameters
 * @param query - The query string from annotation (e.g., "--color=red --delay=1.5 --duration=2")
 * @returns Parsed highlight data with defaults applied
 */
export function parse(query: string): ParseResult {
  const data: HighlightData = { ...DEFAULTS };

  // Split by spaces and process each flag
  const parts = query.trim().split(/\s+/);

  for (const part of parts) {
    if (part.startsWith("--")) {
      const [flag, value] = part.slice(2).split("=");

      switch (flag) {
        case "color":
          if (value) {
            data.color = value;
          }
          break;

        case "delay": {
          const delay = parseFloat(value);
          if (!isNaN(delay)) {
            data.delayInSeconds = delay;
          }
          break;
        }

        case "duration": {
          const duration = parseFloat(value);
          if (!isNaN(duration)) {
            data.durationInSeconds = duration;
          }
          break;
        }

        default:
          // Ignore unknown flags
          console.warn(`Unknown highlight flag: --${flag}`);
      }
    }
  }

  console.log("Highlight Parser Input:", query);
  console.log("Highlight Parser Output:", data);

  return { data };
}

const highlightParser = {
  parse,
};

export default highlightParser;

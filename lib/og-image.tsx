import { ImageResponse } from "next/og";
import { getConfig } from "@/lib/content";

// Shared renderer for the site's social share card. Both the `opengraph-image`
// and `twitter-image` file conventions (app/*.tsx) delegate here so the two
// images stay identical. Generated at build time (statically optimized), which
// is what keeps it compatible with `output: 'export'` — no request-time APIs.

// The standard 1.91:1 card social platforms crop to.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Alt text derived from config so it tracks the site title. */
export function ogAlt(): string {
  return `${getConfig().site.title} — weekly delivery tracker`;
}

// Brand colors, inlined from app/globals.css so the card matches the site.
const CARDANO_BLUE = "#0033ad";
const CARDANO_BLUE_STRONG = "#002a8f";

/**
 * Render the shared card as a PNG. Uses only flexbox and inline styles because
 * satori (behind `ImageResponse`) supports a limited CSS subset — no grid, and
 * every element with multiple children must set `display: flex` explicitly.
 */
export function renderOgImage(): ImageResponse {
  const { site } = getConfig();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: `linear-gradient(135deg, ${CARDANO_BLUE} 0%, ${CARDANO_BLUE_STRONG} 100%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Eyebrow label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: "26px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "9999px",
              background: "#3fc98d",
            }}
          />
          Input Output · High Assurance
        </div>

        {/* Title + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div style={{ fontSize: "84px", fontWeight: 700, lineHeight: 1.05 }}>
            {site.title}
          </div>
          <div
            style={{
              fontSize: "36px",
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.85)",
              maxWidth: "900px",
            }}
          >
            {site.tagline}
          </div>
        </div>

        {/* Footer: canonical URL */}
        <div
          style={{
            display: "flex",
            fontSize: "28px",
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          {site.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size },
  );
}

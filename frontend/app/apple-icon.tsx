import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

/**
 * Apple touch icon — reuses header BrandMark wave motif on forest ground
 * so home-screen icons match site branding.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B3A2D",
          borderRadius: 36
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14
          }}
        >
          {/* Fabric wave mark (same idea as header BrandMark) */}
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3 6c4 -3 14 -3 18 0M3 12c4 -3 14 -3 18 0M3 18c4 -3 14 -3 18 0"
              stroke="#FAF7F0"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              display: "flex",
              color: "#FAF7F0",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "0.12em",
              fontFamily: "ui-serif, Georgia, serif"
            }}
          >
            NTM
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

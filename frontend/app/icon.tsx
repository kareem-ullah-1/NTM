import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32
};

export const contentType = "image/png";

/** Tab favicon — forest field + bold NTM for legibility at 16–32px */
export default function Icon() {
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
          borderRadius: 8
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#FAF7F0",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontFamily: "ui-sans-serif, system-ui, sans-serif"
          }}
        >
          NTM
        </div>
      </div>
    ),
    { ...size }
  );
}

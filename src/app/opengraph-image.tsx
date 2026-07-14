import { ImageResponse } from "next/og";

export const alt = "Threadline - Every signal, traced to source";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#080b0d",
          color: "#f2f5ef",
          fontFamily: "Arial, sans-serif",
          padding: "68px 76px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 82% 2%, rgba(184,246,106,0.16), transparent 42%), linear-gradient(135deg, transparent 55%, rgba(99,216,238,0.06))",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "32px",
            display: "flex",
            border: "1px solid rgba(227,239,226,0.12)",
            borderRadius: "24px",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 22,
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                marginRight: 16,
                border: "1px solid rgba(184,246,106,0.35)",
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b8f66a",
              }}
            >
              T
            </div>
            THREADLINE
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            <div
              style={{
                color: "#b8f66a",
                fontSize: 17,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Evidence-native software intelligence
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 18,
                fontSize: 72,
                lineHeight: 1.02,
                fontWeight: 600,
                letterSpacing: "-0.045em",
              }}
            >
              <span>Every signal,</span>
              <span style={{ color: "#b8f66a" }}>traced to source.</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 48,
              color: "#88949a",
              fontSize: 18,
            }}
          >
            <span>Code</span>
            <span style={{ margin: "0 14px", color: "#3d484d" }}>to</span>
            <span>Deployments</span>
            <span style={{ margin: "0 14px", color: "#3d484d" }}>to</span>
            <span>Runtime</span>
            <span style={{ margin: "0 14px", color: "#3d484d" }}>to</span>
            <span>Customer impact</span>
            <span style={{ marginLeft: "auto", color: "#63d8ee" }}>evidence-linked demo</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

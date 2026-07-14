export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "threadline-web",
      mode: "deterministic-demo",
      checks: {
        application: "ready",
        demoData: "ready",
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}

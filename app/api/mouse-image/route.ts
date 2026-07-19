const DEFAULT_IMAGE_ORIGIN = "https://qyjffrmfirkwcwempawu.supabase.co/storage/v1/render/image/public/images/products/";

function imageOrigin() {
  const configured = process.env.MOUSE_IMAGE_ORIGIN?.trim();
  const origin = configured || DEFAULT_IMAGE_ORIGIN;
  return origin.endsWith("/") ? origin : `${origin}/`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file") || "";
  const requestedSize = Number(url.searchParams.get("size") || 560);
  const size = Math.min(1200, Math.max(160, Number.isFinite(requestedSize) ? requestedSize : 560));

  if (!file || file.includes("..") || !/^[a-zA-Z0-9._/+\- ]+$/.test(file)) {
    return new Response("Invalid image path", { status: 400 });
  }

  const path = file.split("/").map(encodeURIComponent).join("/");
  const origin = imageOrigin();
  const upstreamUrl = new URL(path, origin);

  // EloShapes' Supabase renderer accepts resize parameters. A self-hosted
  // COS/OSS mirror can serve the original image without these parameters.
  if (origin.includes("/storage/v1/render/image/")) {
    upstreamUrl.searchParams.set("width", String(size));
    upstreamUrl.searchParams.set("height", String(size));
    upstreamUrl.searchParams.set("resize", "contain");
  }

  const upstream = await fetch(upstreamUrl, {
    headers: { Accept: "image/avif,image/webp,image/png,image/jpeg" },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Image unavailable", { status: 404 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

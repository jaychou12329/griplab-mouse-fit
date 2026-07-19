const IMAGE_ORIGIN = "https://qyjffrmfirkwcwempawu.supabase.co/storage/v1/render/image/public/images/products/";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file") || "";
  const requestedSize = Number(url.searchParams.get("size") || 560);
  const size = Math.min(1200, Math.max(160, Number.isFinite(requestedSize) ? requestedSize : 560));

  if (!file || file.includes("..") || !/^[a-zA-Z0-9._/\- ]+$/.test(file)) {
    return new Response("Invalid image path", { status: 400 });
  }

  const path = file.split("/").map(encodeURIComponent).join("/");
  const upstream = await fetch(`${IMAGE_ORIGIN}${path}?width=${size}&height=${size}&resize=contain`, {
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

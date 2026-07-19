import type { Metadata } from "next";
import "./globals.css";

const fallbackSiteUrl = "https://griplab-mouse-fit.spunky-pin-3764.chatgpt.site";

function metadataBase() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    return new URL(configured || fallbackSiteUrl);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: "GRIPLAB｜电竞鼠标选择器与完整参数库",
  description: "收录 1,598 款电竞鼠标。输入手长与细分握法，按品牌、重量、价格、模具和传感器筛选，并支持详细参数对比。",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "GRIPLAB｜电竞鼠标选择器",
    description: "1,598 款鼠标 · 6 种握法 · 完整参数对比",
    images: [{ url: "/og.png", width: 1728, height: 927, alt: "GRIPLAB 电竞鼠标选择器" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

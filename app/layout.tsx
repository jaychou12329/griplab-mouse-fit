import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRIPLAB 握感研究所｜电竞鼠标智能推荐",
  description: "输入手长、握法和预算，按模具与详细参数找到适合你的电竞鼠标，并支持多款横向对比。",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}

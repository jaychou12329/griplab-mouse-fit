"use client";

import { useEffect } from "react";

export default function ShapeComparePage() {
  const target = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/#shape-compare`;
  useEffect(() => {
    window.location.replace(target);
  }, [target]);
  return <main style={{ padding: "3rem", fontFamily: "sans-serif" }}><a href={target}>返回鼠标模具对比</a></main>;
}

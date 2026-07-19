"use client";

import { useEffect, useMemo, useState } from "react";

type Alignment = "front" | "center" | "rear";

type Mouse = {
  id: number;
  handle: string;
  brand: string;
  name: string;
  image: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  shape: string | null;
  hand: string | null;
  hump: string | null;
  sideCurve: string | null;
  sensor: string | null;
  polling: number | null;
  wireless: boolean | null;
};

type MouseShape = { top: string | null; side: string | null; back: string | null };
type ShapeData = { total: number; available: number; shapes: Record<string, MouseShape> };
type ParsedSvg = { viewBox: string; paths: string[] };

const COLORS = ["#d7ff45", "#55c2ff", "#ff4fd8", "#ff8f3d"];
const DEFAULT_IDS = [2554, 1618, 2720];
const OUTLINE_SCALE = 2.25;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const STATIC_IMAGES = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const assetUrl = (path: string) => `${BASE_PATH}${path}`;

const zh: Record<string, string> = {
  symmetrical: "对称", ergonomic: "人体工学", hybrid: "混合型",
  right: "右手", left: "左手", ambidextrous: "双手",
  center: "居中", "back - minimal": "轻微后置", "back - moderate": "中度后置", "back - aggressive": "明显后置",
  flat: "平直", inward: "内收", outward: "外扩",
};

function label(value: string | null) {
  return value ? zh[value] || value.replaceAll(" - ", " · ") : "—";
}

function imageUrl(mouse: Mouse) {
  if (!mouse.image) return null;
  if (STATIC_IMAGES) return assetUrl(`/mouse-images/${encodeURIComponent(mouse.handle)}.webp`);
  return `/api/mouse-image?file=${encodeURIComponent(mouse.image)}&size=240`;
}

function parseSvg(source: string | null | undefined): ParsedSvg | null {
  if (!source) return null;
  const viewBox = source.match(/viewBox=["']([^"']+)["']/i)?.[1];
  if (!viewBox || !/^[-+\d.eE\s]+$/.test(viewBox)) return null;
  const paths = [...source.matchAll(/<path\b[^>]*\bd=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter((path) => /^[MmZzLlHhVvCcSsQqTtAa0-9.,+\-\sEe]+$/.test(path));
  return paths.length ? { viewBox, paths } : null;
}

function RealOutline({ source, color, className, labelText }: { source: string | null | undefined; color: string; className: string; labelText: string }) {
  const parsed = useMemo(() => parseSvg(source), [source]);
  if (!parsed) return null;
  return <svg className={className} viewBox={parsed.viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-label={labelText} style={{ color }}>
    {parsed.paths.map((path, index) => <path key={index} d={path} />)}
  </svg>;
}

function OutlineCanvas({ title, note, view, chosen, shapes, alignment, showGrid }: {
  title: string;
  note: string;
  view: "top" | "side";
  chosen: Mouse[];
  shapes: Record<string, MouseShape>;
  alignment: Alignment;
  showGrid: boolean;
}) {
  return <div className={`shape-canvas real-canvas ${showGrid ? "with-grid" : ""}`}>
    <div className="canvas-head"><span>{title}</span><small>{note}</small></div>
    <div className={`real-overlay ${view} align-${alignment}`}>
      {showGrid && <><div className="real-axis horizontal" /><div className="real-axis vertical" /></>}
      {chosen.map((mouse, index) => {
        const physicalWidth = view === "top" ? (mouse.width || 64) : (mouse.length || 125);
        const physicalHeight = view === "top" ? (mouse.length || 125) : (mouse.height || 40);
        const style = {
          width: `${physicalWidth * OUTLINE_SCALE}px`,
          aspectRatio: `${physicalWidth} / ${physicalHeight}`,
        } as React.CSSProperties;
        return <div className="real-outline-layer" style={style} key={mouse.id}>
          <RealOutline
            source={shapes[mouse.handle]?.[view]}
            color={COLORS[index]}
            className="real-outline-svg"
            labelText={`${mouse.brand} ${mouse.name} ${view === "top" ? "俯视" : "侧视"}真实轮廓`}
          />
        </div>;
      })}
      {!chosen.length && <span className="canvas-empty">搜索并加入鼠标后显示真实轮廓</span>}
    </div>
  </div>;
}

export default function ShapeCompareLab() {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [shapeData, setShapeData] = useState<ShapeData | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [alignment, setAlignment] = useState<Alignment>("center");
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(assetUrl("/mice-database.json")).then((response) => response.json() as Promise<Mouse[]>),
      fetch(assetUrl("/mouse-shapes.json")).then((response) => response.json() as Promise<ShapeData>),
    ]).then(([mouseRows, outlineRows]) => {
      setMice(mouseRows);
      setShapeData(outlineRows);
      setSelected(DEFAULT_IDS.filter((id) => mouseRows.some((mouse) => mouse.id === id)));
    });
  }, []);

  const chosen = selected.map((id) => mice.find((mouse) => mouse.id === id)).filter(Boolean) as Mouse[];
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return mice
      .filter((mouse) => !selected.includes(mouse.id) && `${mouse.brand} ${mouse.name}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(Boolean(shapeData?.shapes[b.handle]?.top && shapeData?.shapes[b.handle]?.side)) - Number(Boolean(shapeData?.shapes[a.handle]?.top && shapeData?.shapes[a.handle]?.side)))
      .slice(0, 14);
  }, [mice, query, selected, shapeData]);

  function addMouse(mouse: Mouse) {
    if (selected.length >= 4) return;
    setSelected((current) => [...current, mouse.id]);
    setQuery("");
  }

  return <section className="shape-home-section" id="shape-compare">
    <div className="shape-home-intro">
      <div><span className="section-kicker">SHAPE LAB / 真实模具叠加</span><h2>同一个网站，<br /><em>直接看真实轮廓。</em></h2></div>
      <p>不是根据长宽高生成的示意图。这里直接使用 EloShapes 公开数据中的真实 2D 俯视与侧视 SVG，俯视和侧视共用同一毫米比例，不再单独拉伸高度。</p>
    </div>

    <div className="shape-workbench embedded">
      <div className="shape-controls">
        <div className="mouse-picker">
          <label><span>⌕</span><input aria-label="搜索要对比的鼠标" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={selected.length >= 4 ? "最多选择 4 款" : "输入品牌或型号，例如 Viper V4 Pro…"} disabled={selected.length >= 4} /><small>{selected.length}/4</small></label>
          {query && <div className="mouse-results">{results.length ? results.map((mouse) => {
            const hasOutline = Boolean(shapeData?.shapes[mouse.handle]?.top && shapeData?.shapes[mouse.handle]?.side);
            return <button key={mouse.id} onClick={() => addMouse(mouse)}><span className="result-thumb">{imageUrl(mouse) ? <img src={imageUrl(mouse)!} alt="" /> : mouse.brand.slice(0, 2)}</span><span><small>{mouse.brand}</small><b>{mouse.name}</b></span><em>{hasOutline ? `${mouse.length ?? "—"} × ${mouse.width ?? "—"} × ${mouse.height ?? "—"} mm` : "参数完整 · 轮廓待补"}</em><i>＋</i></button>;
          }) : <p>没有找到匹配型号</p>}</div>}
        </div>
        <div className="view-controls"><span>对齐方式</span>{(["front", "center", "rear"] as Alignment[]).map((item) => <button key={item} className={alignment === item ? "active" : ""} onClick={() => setAlignment(item)}>{item === "front" ? "前端" : item === "center" ? "中心" : "尾部"}</button>)}<button className={showGrid ? "active" : ""} onClick={() => setShowGrid(!showGrid)}>毫米网格</button></div>
      </div>

      <div className="shape-stage real-shape-stage">
        <aside className="shape-selection">
          <div className="selection-title"><span>已选模具</span><button onClick={() => setSelected([])}>全部清空</button></div>
          {chosen.map((mouse, index) => <article key={mouse.id} style={{ "--mouse-color": COLORS[index] } as React.CSSProperties}><i /><div><small>{mouse.brand}</small><b>{mouse.name}</b><span>{mouse.length ?? "—"} × {mouse.width ?? "—"} × {mouse.height ?? "—"} mm　{mouse.weight ?? "—"}g</span></div><button aria-label={`移除 ${mouse.brand} ${mouse.name}`} onClick={() => setSelected((current) => current.filter((id) => id !== mouse.id))}>×</button></article>)}
          {!chosen.length && <div className="selection-empty">搜索并添加鼠标<br />开始模具叠加</div>}
          <div className="outline-note"><b>真实轮廓 · 统一毫米比例</b><p>{shapeData ? `${shapeData.available.toLocaleString()} / ${shapeData.total.toLocaleString()} 款已包含俯视和侧视轮廓。` : "正在载入完整轮廓库…"} 数据已随本站部署，不需要跳转到其他网站。</p></div>
        </aside>

        <div className="shape-canvases">
          <OutlineCanvas title="TOP / 俯视" note="真实轮廓 · 长度 × 宽度" view="top" chosen={chosen} shapes={shapeData?.shapes || {}} alignment={alignment} showGrid={showGrid} />
          <OutlineCanvas title="SIDE / 侧视" note="真实轮廓 · 长度 × 高度" view="side" chosen={chosen} shapes={shapeData?.shapes || {}} alignment={alignment} showGrid={showGrid} />
        </div>
      </div>
    </div>

    <div className="shape-specs embedded-specs">
      <div className="shape-spec-title"><span className="section-kicker">CURRENT FLAGSHIPS · SIDE BY SIDE</span><h2>模具与硬件参数一起比</h2></div>
      {chosen.length ? <div className="shape-table-wrap"><div className="shape-table" style={{ "--shape-columns": chosen.length } as React.CSSProperties}><div className="shape-row shape-products"><b>型号</b>{chosen.map((mouse, index) => <span key={mouse.id}><i style={{ background: COLORS[index] }} /><small>{mouse.brand}</small><strong>{mouse.name}</strong></span>)}</div>{[
        ["尺寸", (mouse: Mouse) => mouse.length ? `${mouse.length} × ${mouse.width} × ${mouse.height} mm` : "—"],
        ["重量", (mouse: Mouse) => mouse.weight == null ? "—" : `${mouse.weight} g`],
        ["模具类型", (mouse: Mouse) => label(mouse.shape)],
        ["背峰位置", (mouse: Mouse) => label(mouse.hump)],
        ["侧腰", (mouse: Mouse) => label(mouse.sideCurve)],
        ["适用手型", (mouse: Mouse) => label(mouse.hand)],
        ["传感器", (mouse: Mouse) => mouse.sensor || "—"],
        ["回报率", (mouse: Mouse) => mouse.polling == null ? "—" : `${mouse.polling} Hz`],
        ["连接", (mouse: Mouse) => mouse.wireless == null ? "—" : mouse.wireless ? "无线" : "有线"],
      ].map(([name, getter]) => <div className="shape-row" key={name as string}><b>{name as string}</b>{chosen.map((mouse) => <span key={mouse.id}>{(getter as (mouse: Mouse) => string)(mouse)}</span>)}</div>)}</div></div> : <div className="shape-empty"><b>还没有选择鼠标</b><p>在上方搜索框输入品牌或型号，最多添加 4 款。</p></div>}
      <p className="shape-attribution">轮廓和产品参数来源：EloShapes 公开数据。本站独立实现交互与界面，并将数据保存为本站静态资源。</p>
    </div>
  </section>;
}

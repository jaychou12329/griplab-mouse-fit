"use client";

import { useEffect, useMemo, useState } from "react";

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
  frontFlare: string | null;
  sideCurve: string | null;
  sensorPositionX: number | null;
  sensorPositionY: number | null;
  sensor: string | null;
  polling: number | null;
  wireless: boolean | null;
};

type Alignment = "front" | "center" | "rear";

const COLORS = ["#d7ff45", "#55c2ff", "#ff4fd8", "#ff8f3d"];
const DEFAULT_IDS = [2720, 524, 290];
const SCALE = 2.12;

const zh: Record<string, string> = {
  symmetrical: "对称", ergonomic: "人体工学", hybrid: "混合型",
  right: "右手", left: "左手", ambidextrous: "双手",
  center: "居中", "back - minimal": "轻微后置", "back - moderate": "中度后置", "back - aggressive": "明显后置",
};

function label(value: string | null) {
  return value ? zh[value] || value.replaceAll(" - ", " · ") : "—";
}

function imageUrl(file: string | null) {
  return file ? `/api/mouse-image?file=${encodeURIComponent(file)}&size=240` : null;
}

function topPath(mouse: Mouse, alignment: Alignment) {
  const length = (mouse.length || 120) * SCALE;
  const width = (mouse.width || 62) * SCALE;
  const half = width / 2;
  const cx = 190;
  const top = alignment === "front" ? 40 : alignment === "rear" ? 350 - length : 195 - length / 2;
  const front = half * (mouse.frontFlare?.includes("outward") ? .86 : mouse.frontFlare?.includes("inward") ? .58 : .70);
  const waist = half * (mouse.sideCurve?.includes("aggressive") ? .62 : mouse.sideCurve?.includes("inward") ? .70 : mouse.sideCurve?.includes("outward") ? .96 : .82);
  const rear = half * (mouse.shape === "ergonomic" ? .98 : .90);
  const shift = mouse.shape === "ergonomic" ? width * .055 : 0;
  const mid = cx + shift;
  const back = cx + shift * .55;
  return [
    `M ${cx - front} ${top}`,
    `C ${cx - half * .92} ${top + length * .12}, ${mid - waist} ${top + length * .34}, ${mid - waist} ${top + length * .49}`,
    `C ${mid - half * .92} ${top + length * .66}, ${back - rear} ${top + length * .90}, ${back} ${top + length}`,
    `C ${back + rear} ${top + length * .90}, ${mid + half * .92} ${top + length * .66}, ${mid + waist} ${top + length * .49}`,
    `C ${mid + waist} ${top + length * .34}, ${cx + half * .92} ${top + length * .12}, ${cx + front} ${top}`,
    `Q ${cx} ${top - length * .035}, ${cx - front} ${top}`,
    "Z",
  ].join(" ");
}

function sidePath(mouse: Mouse, alignment: Alignment) {
  const length = (mouse.length || 120) * SCALE;
  const height = (mouse.height || 39) * SCALE;
  const left = alignment === "front" ? 25 : alignment === "rear" ? 360 - length : 192 - length / 2;
  const baseline = 255;
  const hump = mouse.hump === "center" ? .50 : mouse.hump?.includes("aggressive") ? .72 : mouse.hump?.includes("moderate") ? .65 : .58;
  return [
    `M ${left} ${baseline}`,
    `C ${left + length * .04} ${baseline - height * .20}, ${left + length * Math.max(.12, hump - .23)} ${baseline - height * .78}, ${left + length * hump} ${baseline - height}`,
    `C ${left + length * Math.min(.90, hump + .24)} ${baseline - height * .93}, ${left + length * .94} ${baseline - height * .42}, ${left + length} ${baseline - height * .12}`,
    `Q ${left + length * .99} ${baseline}, ${left + length * .92} ${baseline}`,
    `L ${left + length * .08} ${baseline}`,
    `Q ${left + length * .01} ${baseline}, ${left} ${baseline}`,
    "Z",
  ].join(" ");
}

function sensorPoint(mouse: Mouse, alignment: Alignment) {
  const length = (mouse.length || 120) * SCALE;
  const top = alignment === "front" ? 40 : alignment === "rear" ? 350 - length : 195 - length / 2;
  const x = 190 + (mouse.sensorPositionX == null ? 0 : (mouse.sensorPositionX - 50) * .7);
  const y = top + length * ((mouse.sensorPositionY ?? 50) / 100);
  return { x, y };
}

export default function ShapeComparePage() {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [alignment, setAlignment] = useState<Alignment>("center");
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    fetch("/mice-database.json")
      .then((res) => res.json())
      .then((data: Mouse[]) => {
        setMice(data);
        setSelected(DEFAULT_IDS.filter((id) => data.some((mouse) => mouse.id === id)));
      });
  }, []);

  const chosen = selected.map((id) => mice.find((mouse) => mouse.id === id)).filter(Boolean) as Mouse[];
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return mice
      .filter((mouse) => !selected.includes(mouse.id) && `${mouse.brand} ${mouse.name}`.toLowerCase().includes(needle))
      .sort((a, b) => Number(Boolean(b.length && b.width && b.height)) - Number(Boolean(a.length && a.width && a.height)))
      .slice(0, 12);
  }, [mice, query, selected]);

  function addMouse(mouse: Mouse) {
    if (selected.length >= 4) return;
    setSelected((current) => [...current, mouse.id]);
    setQuery("");
  }

  return (
    <main className="shape-page">
      <header className="topbar shape-topbar">
        <a className="logo" href="/"><span className="logo-symbol">G</span><span><b>GRIPLAB</b><small>电竞鼠标选择器</small></span></a>
        <nav><a href="/">鼠标数据库</a><a className="active" href="/shape-compare">模具对比</a></nav>
        <a className="back-home" href="/">返回选鼠 →</a>
      </header>

      <section className="shape-hero">
        <div><span className="section-kicker">SHAPE LAB / 模具实验室</span><h1>把模具叠在一起，<br /><em>差多少一眼看清。</em></h1></div>
        <p>从全部鼠标库中选择最多 4 款，以统一毫米比例叠加俯视与侧视轮廓，同时比较尺寸、背峰、重量与传感器。</p>
      </section>

      <section className="shape-workbench">
        <div className="shape-controls">
          <div className="mouse-picker">
            <label><span>⌕</span><input aria-label="搜索要对比的鼠标" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={selected.length >= 4 ? "最多选择 4 款" : "输入品牌或型号，例如 Finalmouse…"} disabled={selected.length >= 4} /><small>{selected.length}/4</small></label>
            {query && <div className="mouse-results">{results.length ? results.map((mouse) => <button key={mouse.id} onClick={() => addMouse(mouse)}><span className="result-thumb">{imageUrl(mouse.image) ? <img src={imageUrl(mouse.image)!} alt="" /> : mouse.brand.slice(0, 2)}</span><span><small>{mouse.brand}</small><b>{mouse.name}</b></span><em>{mouse.length && mouse.width && mouse.height ? `${mouse.length} × ${mouse.width} × ${mouse.height} mm` : "尺寸待补充"}</em><i>＋</i></button>) : <p>没有找到匹配型号</p>}</div>}
          </div>
          <div className="view-controls"><span>对齐方式</span>{(["front", "center", "rear"] as Alignment[]).map((item) => <button key={item} className={alignment === item ? "active" : ""} onClick={() => setAlignment(item)}>{item === "front" ? "前端" : item === "center" ? "中心" : "尾部"}</button>)}<button className={showGrid ? "active" : ""} onClick={() => setShowGrid(!showGrid)}>毫米网格</button></div>
        </div>

        <div className="shape-stage">
          <aside className="shape-selection">
            <div className="selection-title"><span>已选模具</span><button onClick={() => setSelected([])}>全部清空</button></div>
            {chosen.map((mouse, index) => <article key={mouse.id} style={{ "--mouse-color": COLORS[index] } as React.CSSProperties}><i /><div><small>{mouse.brand}</small><b>{mouse.name}</b><span>{mouse.length ?? "—"} × {mouse.width ?? "—"} × {mouse.height ?? "—"} mm　{mouse.weight ?? "—"}g</span></div><button aria-label={`移除 ${mouse.brand} ${mouse.name}`} onClick={() => setSelected((current) => current.filter((id) => id !== mouse.id))}>×</button></article>)}
            {!chosen.length && <div className="selection-empty">搜索并添加鼠标<br />开始模具叠加</div>}
            <div className="outline-note"><b>统一真实比例</b><p>轮廓依据长宽高、背峰、侧腰与模具类型生成，用于快速判断体积差异，并非原厂 CAD 扫描图。</p></div>
          </aside>

          <div className="shape-canvases">
            <div className={`shape-canvas ${showGrid ? "with-grid" : ""}`}><div className="canvas-head"><span>TOP / 俯视</span><small>长度 × 宽度</small></div><svg viewBox="0 0 380 390" role="img" aria-label="鼠标俯视模具叠加图"><line x1="190" y1="20" x2="190" y2="370" className="axis" />{chosen.map((mouse, index) => { const sensor = sensorPoint(mouse, alignment); return <g key={mouse.id} style={{ color: COLORS[index] }}><path d={topPath(mouse, alignment)} /><circle cx={sensor.x} cy={sensor.y} r="3.2" /><text x={sensor.x + 7} y={sensor.y + 3}>S</text></g>; })}</svg></div>
            <div className={`shape-canvas ${showGrid ? "with-grid" : ""}`}><div className="canvas-head"><span>SIDE / 侧视</span><small>长度 × 高度</small></div><svg viewBox="0 0 385 300" role="img" aria-label="鼠标侧视模具叠加图"><line x1="20" y1="255" x2="370" y2="255" className="axis" />{chosen.map((mouse, index) => <path key={mouse.id} d={sidePath(mouse, alignment)} style={{ color: COLORS[index] }} />)}</svg></div>
          </div>
        </div>
      </section>

      <section className="shape-specs">
        <div className="shape-spec-title"><span className="section-kicker">SIDE BY SIDE</span><h2>模具参数横向比较</h2></div>
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
      </section>

      <footer><div className="footer-main"><div className="logo inverted"><span className="logo-symbol">G</span><span><b>GRIPLAB</b><small>电竞鼠标选择器</small></span></div><p>从手型出发，找到真正适合你的电竞鼠标。</p><a href="https://www.eloshapes.com/mouse/compare" target="_blank" rel="noreferrer">数据参考：EloShapes ↗</a></div><div className="creator"><span>CREATOR / 创作者</span><b>微信 p1341026</b></div><div className="legal">模具轮廓为参数化示意，实际握感请以实物为准。</div></footer>
    </main>
  );
}

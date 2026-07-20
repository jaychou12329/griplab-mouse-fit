"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ShapeCompareLab from "./components/ShapeCompareLab";
import { fitScore, idealLength, recommendedGripKeys, suitableHandRange, type GripKey } from "./mouse-fit";

type SortKey = "fit" | "newest" | "weight" | "polling" | "name";

type Part = { name: string | null; type: string | null; lifespan: number | null; force?: number | null; steps?: number | null };
type Mouse = {
  id: number;
  handle: string;
  brand: string;
  model: string;
  variant: string | null;
  name: string;
  releaseDate: string | null;
  image: string | null;
  localImage?: string | null;
  size: string | null;
  sizeRating: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  shape: string | null;
  hand: string | null;
  hump: string | null;
  frontFlare: string | null;
  sideCurve: string | null;
  thumbRest: boolean | null;
  ringRest: boolean | null;
  material: string | null;
  wireless: boolean | null;
  dpi: number | null;
  polling: number | null;
  sensor: string | null;
  sensorType: string | null;
  sensorDpi: number | null;
  trackingSpeed: number | null;
  acceleration: number | null;
  sensorPositionX: number | null;
  sensorPositionY: number | null;
  mcu: string | null;
  middleButtons: number | null;
  sideButtons: number | null;
  hotSwap: boolean | null;
  switches: Part[];
  encoders: Part[];
  has3d: boolean | null;
  price: number | null;
  priceOriginal?: number | null;
  priceCurrency?: string | null;
  priceType?: "listed" | "estimated" | null;
  globalMsrp?: number | null;
  globalCurrency?: string | null;
  priceStatus?: string | null;
  priceSource?: string | null;
  priceCheckedAt?: string | null;
  specialFeatures?: string[];
};

const grips: { key: GripKey; label: string; en: string; desc: string; mark: string }[] = [
  { key: "palm", label: "趴握", en: "PALM", desc: "手掌大面积贴合，优先支撑感", mark: "▰" },
  { key: "relaxedClaw", label: "抓趴", en: "RELAXED CLAW", desc: "掌根贴合，手指自然弯曲", mark: "◒" },
  { key: "forwardClaw", label: "前抓", en: "FORWARD CLAW", desc: "发力点靠前，偏好居中背峰", mark: "◓" },
  { key: "rearClaw", label: "后抓", en: "REAR CLAW", desc: "掌根锁定，偏好后置高背峰", mark: "◑" },
  { key: "claw", label: "标准抓握", en: "CLAW", desc: "掌心留空，兼顾稳定与灵活", mark: "⌁" },
  { key: "fingertip", label: "指握", en: "FINGERTIP", desc: "仅指尖接触，优先短小轻量", mark: "···" },
];

const quickBrands = ["Finalmouse", "Logitech", "Razer", "ZOWIE", "Pulsar", "LAMZU", "ATK", "VXE", "Endgame Gear", "WLmouse", "SteelSeries", "ASUS", "VAXEE"];
const budgetTiers = [
  { key: "all", label: "不限预算", range: "全部价位", min: 0, max: 5000 },
  { key: "under200", label: "200 元内", range: "入门实用", min: 0, max: 199 },
  { key: "200", label: "200–299", range: "高性价比", min: 200, max: 299 },
  { key: "300", label: "300–399", range: "主流进阶", min: 300, max: 399 },
  { key: "400", label: "400–499", range: "中高端", min: 400, max: 499 },
  { key: "500", label: "500–699", range: "高端竞技", min: 500, max: 699 },
  { key: "700", label: "700–999", range: "旗舰级", min: 700, max: 999 },
  { key: "1000", label: "1000 元以上", range: "顶级限定", min: 1000, max: 5000 },
] as const;
const PAGE_SIZE = 60;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const STATIC_IMAGES = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";
const assetUrl = (path: string) => `${BASE_PATH}${path}`;
const normalizeSearch = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\s\-_.·/（）()]+/g, "");
const matchesSearch = (haystack: string, query: string) => {
  const target = normalizeSearch(haystack);
  return query.trim().split(/\s+/).map(normalizeSearch).filter(Boolean).every((token) => target.includes(token));
};

const zh: Record<string, string> = {
  small: "小型", medium: "中型", large: "大型", fingertip: "指握型",
  symmetrical: "对称", ergonomic: "人体工学", hybrid: "混合型",
  right: "右手", left: "左手", ambidextrous: "双手",
  center: "居中", "back - minimal": "轻微后置", "back - moderate": "中度后置", "back - aggressive": "明显后置",
  flat: "平直", inward: "内收", outward: "外扩", optical: "光学", mechanical: "机械",
  plastic: "塑料", magnesium: "镁合金", carbon: "碳纤维",
};

const label = (value: string | null | undefined) => value ? (zh[value] || value.replaceAll(" - ", " · ")) : "—";
const num = (value: number | null | undefined, unit = "") => value == null ? "—" : `${value.toLocaleString()}${unit}`;

function priceLabel(mouse: Mouse) {
  if (mouse.priceType === "listed") return "官网 / 历史价";
  if (mouse.priceType === "estimated") return "规格估算价";
  return "参考价";
}

function priceNote(mouse: Mouse) {
  if (mouse.priceType === "listed") {
    const original = mouse.priceOriginal != null && mouse.priceCurrency
      ? `（原价 ${mouse.priceCurrency} ${mouse.priceOriginal.toLocaleString()}）`
      : "";
    return `${mouse.priceSource || "官网或零售商历史定价"}${original}`;
  }
  if (mouse.priceType === "estimated") return mouse.priceSource || "根据同品牌、同规格型号估算";
  return mouse.priceSource || "已收录参考价";
}

function imageUrl(mouse: Mouse, size = 560) {
  if (mouse.localImage) return assetUrl(`/${mouse.localImage.replace(/^\/+/, "")}`);
  if (!mouse.image) return null;
  if (STATIC_IMAGES) return assetUrl(`/mouse-images/${encodeURIComponent(mouse.handle)}.webp`);
  const file = mouse.image;
  return `/api/mouse-image?file=${encodeURIComponent(file)}&size=${size}`;
}

function bestGrips(mouse: Mouse, hand: number) {
  const keys = recommendedGripKeys(mouse, hand);
  return keys.map((key) => grips.find((item) => item.key === key)!).filter(Boolean);
}

function MouseImage({ mouse, eager = false }: { mouse: Mouse; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl(mouse);
  if (!src || failed) return <div className="image-fallback"><span>{mouse.brand.slice(0, 2)}</span><b>{mouse.model.slice(0, 1)}</b></div>;
  return <img className={mouse.localImage ? "local-product-photo" : undefined} src={src} alt={`${mouse.brand} ${mouse.name}`} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}

function Check({ value }: { value: boolean | null }) {
  return <span className={value ? "yes" : "no"}>{value == null ? "—" : value ? "有" : "无"}</span>;
}

export default function Home() {
  const [mice, setMice] = useState<Mouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [hand, setHand] = useState(18.5);
  const [grip, setGrip] = useState<GripKey>("relaxedClaw");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [shape, setShape] = useState("all");
  const [wireless, setWireless] = useState("all");
  const [weightMax, setWeightMax] = useState(180);
  const [budget, setBudget] = useState<[number, number]>([0, 5000]);
  const [includeUnknownPrice, setIncludeUnknownPrice] = useState(true);
  const [sort, setSort] = useState<SortKey>("fit");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Mouse | null>(null);
  const [compare, setCompare] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [fitOpen, setFitOpen] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(assetUrl("/mice-database.json"))
      .then((res) => res.json())
      .then((data: Mouse[]) => setMice(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === searchRef.current) searchRef.current?.blur();
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const brandCounts = useMemo(() => {
    const counts = new Map<string, number>();
    mice.forEach((mouse) => counts.set(mouse.brand, (counts.get(mouse.brand) || 0) + 1));
    return counts;
  }, [mice]);

  const priceTierCounts = useMemo(() => Object.fromEntries(budgetTiers.map((tier) => [
    tier.key,
    tier.key === "all" ? mice.length : mice.filter((mouse) => mouse.price != null && mouse.price >= tier.min && mouse.price <= tier.max).length,
  ])), [mice]);
  const activeBudgetKey = budgetTiers.find((tier) => tier.min === budget[0] && tier.max === budget[1])?.key || "custom";

  const visibleBrands = useMemo(() => {
    const needle = normalizeSearch(brandQuery.trim());
    return [...brandCounts.keys()]
      .filter((brand) => !needle || normalizeSearch(brand).includes(needle))
      .sort((a, b) => {
        const selectedDelta = Number(selectedBrands.includes(b)) - Number(selectedBrands.includes(a));
        return selectedDelta || (brandCounts.get(b) || 0) - (brandCounts.get(a) || 0) || a.localeCompare(b);
      })
      .slice(0, 60);
  }, [brandCounts, brandQuery, selectedBrands]);

  const results = useMemo(() => {
    const filtered = mice.filter((mouse) => {
      if (query.trim() && !matchesSearch(`${mouse.brand} ${mouse.name} ${mouse.sensor || ""}`, query)) return false;
      if (selectedBrands.length && !selectedBrands.includes(mouse.brand)) return false;
      if (shape !== "all" && mouse.shape !== shape) return false;
      if (wireless !== "all" && mouse.wireless !== (wireless === "wireless")) return false;
      if (weightMax < 180 && mouse.weight != null && mouse.weight > weightMax) return false;
      if (mouse.price == null) return includeUnknownPrice;
      return mouse.price >= budget[0] && mouse.price <= budget[1];
    }).map((mouse) => ({ ...mouse, score: fitScore(mouse, hand, grip) }));
    filtered.sort((a, b) => {
      if (sort === "weight") return (a.weight ?? 999) - (b.weight ?? 999);
      if (sort === "polling") return (b.polling ?? 0) - (a.polling ?? 0);
      if (sort === "newest") return (b.releaseDate || "").localeCompare(a.releaseDate || "");
      if (sort === "name") return `${a.brand}${a.name}`.localeCompare(`${b.brand}${b.name}`);
      return b.score - a.score;
    });
    return filtered;
  }, [budget, grip, hand, includeUnknownPrice, mice, query, selectedBrands, shape, sort, weightMax, wireless]);

  // The catalog page is UI state that must reset whenever its filter inputs change.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPage(1), [budget, grip, hand, includeUnknownPrice, query, selectedBrands, shape, sort, weightMax, wireless]);

  const hasActiveFilters = Boolean(
    query.trim() || selectedBrands.length || shape !== "all" || wireless !== "all" ||
    weightMax < 180 || budget[0] !== 0 || budget[1] !== 5000 || !includeUnknownPrice
  );
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleLimit = hasActiveFilters ? results.length : page * PAGE_SIZE;
  const visible = results.slice(0, visibleLimit);
  const remaining = Math.max(0, results.length - visible.length);
  const compared = compare.map((id) => mice.find((mouse) => mouse.id === id)).filter(Boolean) as Mouse[];
  const heroMouse = results[0] || mice.find((mouse) => mouse.handle === "razer-viper-v4-pro") || mice[0];
  const featureMouse = mice.find((mouse) => mouse.handle === "finalmouse-starlight-x") || heroMouse;
  const selectedGrip = grips.find((item) => item.key === grip)!;

  function toggleBrand(brand: string) {
    setSelectedBrands((current) => current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand]);
  }

  function toggleCompare(id: number) {
    setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }

  function resetFilters() {
    setQuery(""); setBrandQuery(""); setSelectedBrands([]); setShape("all"); setWireless("all"); setWeightMax(180); setBudget([0, 5000]); setIncludeUnknownPrice(true);
  }

  function selectBudgetTier(tier: (typeof budgetTiers)[number]) {
    setBudget([tier.min, tier.max]);
    setIncludeUnknownPrice(tier.key === "all");
  }

  return (
    <main>
      <header className="topbar">
        <a className="logo" href="#top"><span className="logo-symbol">G</span><span><b>GRIPLAB</b><small>电竞鼠标选择器</small></span></a>
        <label className="header-search"><span>⌕</span><input ref={searchRef} aria-label="搜索鼠标" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索品牌、型号、传感器…" /><kbd>/</kbd></label>
        <nav><a href="#finder">握感匹配</a><a href="#catalog">全部鼠标</a><a href="#shape-compare">模具对比</a><button onClick={() => setCompareOpen(true)}>参数对比 <b>{compare.length}</b></button></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="database-pill"><i /> ELOSHAPES DATA · 2026</div>
          <h1>不是最贵的。<br /><em>是最合手的。</em></h1>
          <p>完整收录 <b>{mice.length || "1,599"}</b> 款电竞鼠标、<b>{brandCounts.size || "192"}</b> 个品牌。先确定手型和握法，再看传感器、重量和价格。</p>
          <div className="hero-actions"><a href="#finder">开始测握感 <span>→</span></a><a href="#shape-compare" className="quiet">进入模具对比</a></div>
          <div className="hero-proof"><span><b>1,599</b>鼠标型号</span><span><b>40+</b>详细字段</span><span><b>6</b>种握法</span></div>
        </div>
        <div className="hero-product">
          <div className="hero-grid" />
          {featureMouse && <><div className="hero-image"><img src={assetUrl("/slx-nightfall-hero.jpg")} alt="Finalmouse SLX Nightfall 正面图" loading="eager" /></div><div className="hero-card"><small>2026 NEW · SLX NIGHTFALL</small><b>{featureMouse.brand}</b><strong>{featureMouse.name}</strong><span>{fitScore(featureMouse, hand, grip)}% 适配</span></div></>}
          <div className="measure-line measure-x">长度 / LENGTH</div><div className="measure-line measure-y">宽度 / WIDTH</div>
        </div>
      </section>

      <section className="fit-finder" id="finder">
        <div className="section-top"><div><span className="section-kicker">PERSONAL FIT</span><h2>告诉我你怎么握</h2></div><button onClick={() => setFitOpen(!fitOpen)}>{fitOpen ? "收起" : "展开"} <span>{fitOpen ? "−" : "+"}</span></button></div>
        {fitOpen && <div className="fit-content">
          <div className="hand-panel"><div className="step-title"><b>01</b><span>手长<small>中指尖至掌根第一条腕纹</small></span></div><div className="hand-number"><strong>{hand.toFixed(1)}</strong><em>CM</em></div><input aria-label="手长" type="range" min="14" max="23" step="0.5" value={hand} onChange={(e) => setHand(Number(e.target.value))} /><div className="range-labels"><span>14 小手</span><span>18.5 中手</span><span>23 大手</span></div><div className="fit-note">建议鼠标长度约 <b>{Math.round(idealLength(hand, grip) - 4)}–{Math.round(idealLength(hand, grip) + 4)} mm</b></div></div>
          <div className="grip-panel"><div className="step-title"><b>02</b><span>握法<small>细分前抓、后抓与抓趴</small></span></div><div className="grip-grid">{grips.map((item) => <button key={item.key} className={grip === item.key ? "active" : ""} onClick={() => setGrip(item.key)}><i>{item.mark}</i><span><b>{item.label}</b><small>{item.en}</small></span><p>{item.desc}</p></button>)}</div></div>
          <div className="fit-summary"><span>你的匹配档案</span><b>{hand.toFixed(1)} cm · {selectedGrip.label}</b><p>{selectedGrip.desc}。推荐结果会同时计算长度、宽度、背峰位置和重量。</p><a href="#catalog">查看 {results.length} 款结果 →</a></div>
        </div>}
      </section>

      <section className="brand-strip"><span>热门品牌</span><div>{quickBrands.filter((item) => brandCounts.has(item)).map((brand) => <button key={brand} className={selectedBrands.includes(brand) ? "active" : ""} onClick={() => toggleBrand(brand)}>{brand}<small>{brandCounts.get(brand)}</small></button>)}</div></section>

      <ShapeCompareLab />

      <section className="catalog" id="catalog">
        <div className="catalog-head"><div><span className="section-kicker">FULL DATABASE</span><h2>全部鼠标库</h2><p>全库 {mice.length.toLocaleString()} 款 · 符合条件 {results.length.toLocaleString()} 款 · 已显示 {visible.length.toLocaleString()} 款</p></div><div className="catalog-actions"><button className="mobile-filter-button" onClick={() => setMobileFilters(true)}>筛选器</button><select aria-label="排序" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="fit">适配度优先</option><option value="newest">新品优先</option><option value="weight">重量从轻到重</option><option value="polling">回报率从高到低</option><option value="name">品牌名称</option></select><button className="reset" onClick={resetFilters}>重置筛选</button></div></div>
        <div className="price-tier-panel">
          <div className="price-tier-heading"><span>PRICE RANGE</span><div><h3>按价位选鼠标</h3><p>全部型号均已补充参考价格，可直接选择价位或在左侧输入任意预算。</p></div></div>
          <div className="price-tier-list">{budgetTiers.map((tier) => <button key={tier.key} className={activeBudgetKey === tier.key ? "active" : ""} aria-pressed={activeBudgetKey === tier.key} onClick={() => selectBudgetTier(tier)}><span>{tier.label}</span><b>{tier.range}</b><small>{loading ? "…" : `${priceTierCounts[tier.key] || 0} 款`}</small></button>)}</div>
        </div>
        <div className="catalog-layout">
          <aside className={`filters ${mobileFilters ? "mobile-open" : ""}`}>
            <div className="filter-mobile-head"><b>筛选器</b><button onClick={() => setMobileFilters(false)}>×</button></div>
            <div className="filter-group"><h3>搜索全部品牌 <b>{brandCounts.size}</b></h3><label className="brand-search"><span>⌕</span><input aria-label="输入品牌名称" value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="输入品牌，例如 Ninjutso…" />{brandQuery && <button aria-label="清空品牌搜索" onClick={() => setBrandQuery("")}>×</button>}</label><div className="brand-checks brand-checks-scroll">{visibleBrands.map((brand) => <label key={brand}><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} /><span>{brand}</span><small>{brandCounts.get(brand)}</small></label>)}</div>{visibleBrands.length === 0 && <p className="filter-help">没有找到这个品牌，试试英文名称或缩短关键词。</p>}</div>
            <div className="filter-group"><h3>模具形状</h3><div className="choice-list">{[["all","全部形状"],["symmetrical","对称"],["ergonomic","人体工学"],["hybrid","混合型"]].map(([key,name]) => <button key={key} className={shape === key ? "active" : ""} onClick={() => setShape(key)}><span>{name}</span>{shape === key && <b>✓</b>}</button>)}</div></div>
            <div className="filter-group"><h3>连接方式</h3><div className="choice-list">{[["all","不限"],["wireless","无线"],["wired","有线"]].map(([key,name]) => <button key={key} className={wireless === key ? "active" : ""} onClick={() => setWireless(key)}><span>{name}</span>{wireless === key && <b>✓</b>}</button>)}</div></div>
            <div className="filter-group"><h3>最高重量 <b>{weightMax === 180 ? "不限" : `${weightMax}g`}</b></h3><input aria-label="最高重量" type="range" min="35" max="180" step="5" value={weightMax} onChange={(e) => setWeightMax(Number(e.target.value))} /><div className="range-labels"><span>35g</span><span>不限</span></div></div>
            <div className="filter-group"><h3>参考预算</h3><div className="budget-box"><label>¥<input aria-label="最低预算" type="number" value={budget[0]} min="0" max={budget[1]} onChange={(e) => setBudget([Number(e.target.value), budget[1]])} /></label><span>—</span><label>¥<input aria-label="最高预算" type="number" value={budget[1]} min={budget[0]} max="5000" onChange={(e) => setBudget([budget[0], Number(e.target.value)])} /></label></div><label className="unknown-toggle"><input type="checkbox" checked={includeUnknownPrice} onChange={(e) => setIncludeUnknownPrice(e.target.checked)} /><span>保留未来待补价的新型号</span></label><p className="filter-help">优先采用官网、零售商或历史定价；无法查到的型号使用同品牌同规格估算，并在卡片中明确标注。</p></div>
            <button className="apply-mobile" onClick={() => setMobileFilters(false)}>查看 {results.length} 款结果</button>
          </aside>

          <div className="product-area">
            {loading ? <div className="loading-grid">{Array.from({ length: 12 }).map((_, i) => <div key={i} />)}</div> : visible.length ? <div className="product-grid">{visible.map((mouse) => {
              const recommendations = bestGrips(mouse, hand);
              const handRange = suitableHandRange(mouse, grip);
              return <article className="product-card" key={mouse.id}>
                <div className="product-media"><div className="badges"><span>{label(mouse.size)}</span>{mouse.releaseDate && Number(mouse.releaseDate.slice(0,4)) >= 2025 && <b>NEW</b>}</div><button className={`compare-add ${compare.includes(mouse.id) ? "active" : ""}`} disabled={compare.length >= 4 && !compare.includes(mouse.id)} onClick={() => toggleCompare(mouse.id)} aria-label={`对比 ${mouse.brand} ${mouse.name}`}>{compare.includes(mouse.id) ? "✓" : "+"}</button><MouseImage mouse={mouse} /></div>
                <div className="product-info"><div className="product-brand">{mouse.brand}</div><h3>{mouse.name}</h3><div className="fit-line"><span style={{ width: `${fitScore(mouse, hand, grip)}%` }} /><b>{fitScore(mouse, hand, grip)}% 适配</b></div><div className="grip-tags"><span>手长 {handRange.min}–{handRange.max}cm</span>{recommendations.map((item) => <span key={item.key}>{item.label}</span>)}</div><div className="product-specs"><span><small>重量</small><b>{num(mouse.weight, "g")}</b></span><span><small>尺寸</small><b>{mouse.length ? `${mouse.length}mm` : "—"}</b></span><span><small>传感器</small><b title={mouse.sensor || ""}>{mouse.sensor || "—"}</b></span><span><small>回报率</small><b>{num(mouse.polling, "Hz")}</b></span></div><div className="product-bottom"><div title={priceNote(mouse)}>{mouse.price != null ? <><strong>¥{mouse.price}</strong><small>{priceLabel(mouse)}</small></> : <span>价格待核验</span>}</div><button onClick={() => setDetail(mouse)}>完整参数 <i>→</i></button></div></div>
              </article>;
            })}</div> : <div className="empty"><b>没有符合条件的鼠标</b><p>试试放宽重量、品牌或价格条件。</p><button onClick={resetFilters}>清空筛选</button></div>}
            {remaining > 0 && <div className="pagination"><span>已显示 <b>{visible.length.toLocaleString()}</b> / {results.length.toLocaleString()} 款</span><button onClick={() => setPage((current) => current + 1)}>继续显示 {Math.min(PAGE_SIZE, remaining)} 款</button><button className="show-all" onClick={() => setPage(totalPages)}>一次显示全部符合条件的鼠标</button></div>}
          </div>
        </div>
      </section>

      <section className="data-note"><div><span className="section-kicker">ABOUT THE DATA</span><h2>参数透明，推荐有依据。</h2></div><div className="data-points"><span><b>01</b><strong>完整目录</strong><p>收录 EloShapes 公开目录当前的 1,599 款鼠标，包含 192 个品牌。</p></span><span><b>02</b><strong>详细硬件</strong><p>尺寸、模具、传感器、MCU、微动、编码器与按键数据集中展示。</p></span><span><b>03</b><strong>握法推算</strong><p>适配分是基于尺寸与模具特征的算法建议，不代替实际试握。</p></span></div></section>

      <footer><div className="footer-main"><div className="logo inverted"><span className="logo-symbol">G</span><span><b>GRIPLAB</b><small>电竞鼠标选择器</small></span></div><p>从手型出发，找到真正适合你的电竞鼠标。</p><a href="https://www.eloshapes.com/mouse/browse?view=table" target="_blank" rel="noreferrer">数据与产品图片来源：EloShapes ↗</a></div><div className="creator"><span>CREATOR</span><b>作者：我的手机没电了 p1341026</b></div><div className="legal">数据更新时间：2026-07 · 价格仅供参考，购买前请以实际销售页面为准。</div></footer>

      {compare.length > 0 && <button className="compare-float" onClick={() => setCompareOpen(true)}><span>已选 {compare.length}/4</span><b>打开横向对比</b><i>↗</i></button>}

      {detail && <div className="drawer-backdrop" onClick={() => setDetail(null)}><aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={`${detail.brand} ${detail.name} 详细参数`} onClick={(e) => e.stopPropagation()}><button className="drawer-close" onClick={() => setDetail(null)}>×</button><div className="drawer-hero"><div className="drawer-image"><MouseImage mouse={detail} eager /></div><div><span>{detail.brand}</span><h2>{detail.name}</h2><p>{label(detail.size)} · {label(detail.shape)} · {label(detail.hand)}</p><div className={`drawer-price ${detail.price == null ? "unknown" : ""}`}><small>参考价</small><strong>{detail.price == null ? "价格待补充" : `¥${detail.price}`}</strong></div><div className="drawer-actions"><button onClick={() => toggleCompare(detail.id)}>{compare.includes(detail.id) ? "✓ 已加入对比" : "+ 加入对比"}</button><a href={`https://www.eloshapes.com/mouse/compare?p=${detail.handle}`} target="_blank" rel="noreferrer">查看 EloShapes ↗</a></div></div></div>{detail.specialFeatures && detail.specialFeatures.length > 0 && <div className="feature-callout"><small>FEATURE HIGHLIGHTS</small><div>{detail.specialFeatures.map((item) => <span key={item}>{item}</span>)}</div></div>}<SpecSection title="尺寸与模具" rows={[["长度",num(detail.length," mm")],["宽度",num(detail.width," mm")],["高度",num(detail.height," mm")],["重量",num(detail.weight," g")],["背峰位置",label(detail.hump)],["前端外扩",label(detail.frontFlare)],["侧腰曲线",label(detail.sideCurve)],["拇指托",<Check key="thumb" value={detail.thumbRest} />],["无名指托",<Check key="ring" value={detail.ringRest} />]]} /><SpecSection title="传感器与性能" rows={[["传感器",detail.sensor || "—"],["类型",label(detail.sensorType)],["鼠标最高 DPI",num(detail.dpi)],["传感器 DPI",num(detail.sensorDpi)],["回报率",num(detail.polling," Hz")],["追踪速度",num(detail.trackingSpeed," IPS")],["加速度",num(detail.acceleration," G")],["传感器位置",detail.sensorPositionY == null ? "—" : `${detail.sensorPositionY}%`],["MCU",detail.mcu || "—"]]} /><SpecSection title="按键与结构" rows={[["主按键微动",detail.switches.map((item) => item.name).filter(Boolean).join(" / ") || "—"],["微动类型",detail.switches.map((item) => label(item.type)).filter((v) => v !== "—").join(" / ") || "—"],["微动寿命",detail.switches.map((item) => item.lifespan ? `${item.lifespan}M` : null).filter(Boolean).join(" / ") || "—"],["滚轮编码器",detail.encoders.map((item) => item.name).filter(Boolean).join(" / ") || "—"],["侧键",num(detail.sideButtons)],["中键",num(detail.middleButtons)],["热插拔",<Check key="hot" value={detail.hotSwap} />],["连接",detail.wireless == null ? "—" : detail.wireless ? "无线" : "有线"],["材质",label(detail.material)]]} /><div className="source-disclaimer">资料来自 EloShapes 公开页面，字段为 “—” 表示原始资料暂未收录。</div></aside></div>}

      {compareOpen && <div className="compare-backdrop" onClick={() => setCompareOpen(false)}><section className="compare-modal" role="dialog" aria-modal="true" aria-label="横向对比" onClick={(e) => e.stopPropagation()}><div className="compare-head"><div><span>COMPARE / 横向比较</span><h2>{compared.length ? `${compared.length} 款鼠标对比` : "选择鼠标开始对比"}</h2></div><button onClick={() => setCompareOpen(false)}>×</button></div>{compared.length ? <div className="compare-scroll"><div className="compare-table"><div className="compare-row products"><b>产品</b>{compared.map((mouse) => <div key={mouse.id}><div className="compare-image"><MouseImage mouse={mouse} /></div><small>{mouse.brand}</small><strong>{mouse.name}</strong><button onClick={() => toggleCompare(mouse.id)}>移除</button></div>)}</div>{[["适配分",(m:Mouse)=>`${fitScore(m,hand,grip)}%`],["参考价",(m:Mouse)=>m.price?`¥${m.price}`:"待补充"],["重量",(m:Mouse)=>num(m.weight,"g")],["尺寸",(m:Mouse)=>m.length?`${m.length} × ${m.width} × ${m.height} mm`:"—"],["模具",(m:Mouse)=>`${label(m.size)} · ${label(m.shape)}`],["背峰",(m:Mouse)=>label(m.hump)],["传感器",(m:Mouse)=>m.sensor||"—"],["DPI",(m:Mouse)=>num(m.dpi)],["回报率",(m:Mouse)=>num(m.polling," Hz")],["微动",(m:Mouse)=>m.switches.map(s=>s.name).filter(Boolean).join(" / ")||"—"],["MCU",(m:Mouse)=>m.mcu||"—"],["连接",(m:Mouse)=>m.wireless?"无线":"有线"]].map(([name,getter]) => <div className="compare-row" key={name as string}><b>{name as string}</b>{compared.map((mouse) => <span key={mouse.id}>{(getter as (m: Mouse) => string)(mouse)}</span>)}</div>)}</div></div> : <div className="empty"><b>还没选择鼠标</b><p>在产品卡片右上角点击 +，最多可以选择四款。</p></div>}</section></div>}
    </main>
  );
}

function SpecSection({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return <section className="spec-section"><h3>{title}</h3><div>{rows.map(([name, value]) => <span key={name}><small>{name}</small><b>{value}</b></span>)}</div></section>;
}

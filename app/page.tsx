"use client";

import { useMemo, useState } from "react";

type Grip = "趴握" | "抓握" | "指握";
type Sort = "match" | "price" | "weight";

type Mouse = {
  id: string;
  brand: string;
  name: string;
  price: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  sensor: string;
  dpi: string;
  polling: string;
  switches: string;
  connection: string;
  battery: string;
  shape: "对称" | "人体工学";
  size: "小" | "中" | "大";
  grips: Grip[];
  handRange: [number, number];
  tone: string;
  verdict: string;
};

const mice: Mouse[] = [
  { id: "gpx2", brand: "Logitech", name: "G Pro X Superlight 2", price: 1099, weight: 60, length: 125, width: 63.5, height: 40, sensor: "HERO 2", dpi: "44,000", polling: "8,000 Hz", switches: "LIGHTFORCE 光混合", connection: "LIGHTSPEED / USB-C", battery: "约 95 小时", shape: "对称", size: "大", grips: ["抓握", "趴握"], handRange: [18, 21.5], tone: "#c7ff3d", verdict: "万金油大尺寸，稳定感和生态都很成熟。" },
  { id: "gpx", brand: "Logitech", name: "G Pro X Superlight", price: 699, weight: 63, length: 125, width: 63.5, height: 40, sensor: "HERO 25K", dpi: "25,600", polling: "1,000 Hz", switches: "欧姆龙机械", connection: "LIGHTSPEED / Micro-USB", battery: "约 70 小时", shape: "对称", size: "大", grips: ["抓握", "趴握"], handRange: [18, 21.5], tone: "#d7ff78", verdict: "预算更克制的经典选择，模具容错率高。" },
  { id: "g304", brand: "Logitech", name: "G304 Lightspeed", price: 199, weight: 99, length: 116.6, width: 62.2, height: 38.2, sensor: "HERO", dpi: "12,000", polling: "1,000 Hz", switches: "机械微动", connection: "LIGHTSPEED / AA", battery: "约 250 小时", shape: "对称", size: "小", grips: ["抓握", "指握"], handRange: [15.5, 18.5], tone: "#a8d64a", verdict: "入门无线标杆，适合小手与便携使用。" },
  { id: "vv3p", brand: "Razer", name: "Viper V3 Pro", price: 1199, weight: 54, length: 127.1, width: 63.9, height: 39.9, sensor: "Focus Pro 35K Gen-2", dpi: "35,000", polling: "8,000 Hz", switches: "第三代光学", connection: "HyperSpeed / USB-C", battery: "最高约 95 小时", shape: "对称", size: "大", grips: ["抓握", "趴握"], handRange: [18.5, 22], tone: "#44f36a", verdict: "长手抓握的竞技旗舰，低重量与高回报率兼得。" },
  { id: "dav3p", brand: "Razer", name: "DeathAdder V3 Pro", price: 899, weight: 63, length: 128, width: 68, height: 44, sensor: "Focus Pro 30K", dpi: "30,000", polling: "4,000 Hz*", switches: "第三代光学", connection: "HyperSpeed / USB-C", battery: "约 90 小时", shape: "人体工学", size: "大", grips: ["趴握", "抓握"], handRange: [18.5, 22.5], tone: "#28d95a", verdict: "饱满右手工学支撑，尤其适合趴握和大手。" },
  { id: "cobra", brand: "Razer", name: "Cobra Wired", price: 249, weight: 58, length: 119.6, width: 62.5, height: 38.1, sensor: "Razer 8500 DPI", dpi: "8,500", polling: "1,000 Hz", switches: "第三代光学", connection: "有线", battery: "无需充电", shape: "对称", size: "小", grips: ["指握", "抓握"], handRange: [15.5, 18.5], tone: "#58f777", verdict: "小手轻量入门，价格低但按键规格不含糊。" },
  { id: "u2", brand: "ZOWIE", name: "U2 Wireless", price: 899, weight: 60, length: 124, width: 65, height: 38, sensor: "PAW3395", dpi: "3,200", polling: "1,000 Hz", switches: "机械微动", connection: "2.4G / USB-C", battery: "约 70 小时", shape: "对称", size: "中", grips: ["抓握"], handRange: [17.5, 20.5], tone: "#ef3b42", verdict: "收腰与尾部支撑明确，专为抓握稳定发力。" },
  { id: "ec2cw", brand: "ZOWIE", name: "EC2-CW", price: 899, weight: 77, length: 123, width: 65, height: 42, sensor: "PAW3370", dpi: "3,200", polling: "1,000 Hz", switches: "机械微动", connection: "2.4G / USB-C", battery: "约 70 小时", shape: "人体工学", size: "中", grips: ["趴握", "抓握"], handRange: [17, 20.5], tone: "#ff555a", verdict: "CS 系玩家熟悉的右手工学，稳定优先于极致轻量。" },
  { id: "x2v3", brand: "Pulsar", name: "X2 v3", price: 699, weight: 53, length: 120, width: 63, height: 38, sensor: "Pulsar XS-1", dpi: "32,000", polling: "8,000 Hz", switches: "Pulsar 光学", connection: "2.4G / USB-C", battery: "最高约 100 小时", shape: "对称", size: "中", grips: ["抓握", "指握"], handRange: [16.5, 19.5], tone: "#7e70ff", verdict: "平直侧腰与居中背峰，抓握、指握都好调整。" },
  { id: "x2h", brand: "Pulsar", name: "X2H", price: 599, weight: 54, length: 120.4, width: 65, height: 39, sensor: "PAW3395", dpi: "26,000", polling: "4,000 Hz*", switches: "Pulsar 光学", connection: "2.4G / USB-C", battery: "约 70 小时", shape: "对称", size: "中", grips: ["抓握"], handRange: [16.5, 19.5], tone: "#8b7dff", verdict: "高后背峰顶住掌根，抓握锁定感很强。" },
  { id: "xlitev3", brand: "Pulsar", name: "Xlite V3 Medium", price: 649, weight: 55, length: 122, width: 66, height: 43, sensor: "PAW3395", dpi: "26,000", polling: "4,000 Hz*", switches: "Pulsar 光学", connection: "2.4G / USB-C", battery: "约 70 小时", shape: "人体工学", size: "中", grips: ["趴握", "抓握"], handRange: [17, 20], tone: "#a296ff", verdict: "轻量 EC 风格，右手支撑饱满但不笨重。" },
  { id: "maya", brand: "LAMZU", name: "MAYA 8K", price: 799, weight: 47, length: 119, width: 62, height: 38, sensor: "PAW3950", dpi: "30,000", polling: "8,000 Hz", switches: "光学微动", connection: "2.4G / USB-C", battery: "约 80 小时", shape: "对称", size: "小", grips: ["抓握", "指握"], handRange: [15.5, 18.5], tone: "#ff80bf", verdict: "短小灵活的旗舰配置，小手抓握尤其讨喜。" },
  { id: "atlantis", brand: "LAMZU", name: "Atlantis Mini 4K", price: 649, weight: 49, length: 117, width: 63, height: 37, sensor: "PAW3395", dpi: "26,000", polling: "4,000 Hz", switches: "Huano 蓝壳粉点", connection: "2.4G / USB-C", battery: "约 70 小时", shape: "对称", size: "小", grips: ["抓握", "指握"], handRange: [15.5, 18.5], tone: "#ff9bcb", verdict: "宽尾收腰，小手抓握时指尖控制很直接。" },
  { id: "op1", brand: "Endgame Gear", name: "OP1 8K", price: 599, weight: 50.5, length: 118.2, width: 60.5, height: 37.2, sensor: "PAW3395", dpi: "26,000", polling: "8,000 Hz", switches: "Kailh GX", connection: "有线", battery: "无需充电", shape: "对称", size: "小", grips: ["抓握", "指握"], handRange: [15.5, 18.5], tone: "#ffbc45", verdict: "窄腰小模具，有线 8K 延迟表现突出。" },
  { id: "xm2w", brand: "Endgame Gear", name: "XM2w 4K", price: 799, weight: 62, length: 122, width: 66, height: 38, sensor: "PAW3395", dpi: "26,000", polling: "4,000 Hz", switches: "Kailh GX", connection: "2.4G / USB-C", battery: "约 80 小时", shape: "对称", size: "中", grips: ["抓握"], handRange: [17, 20.5], tone: "#ffc85f", verdict: "宽尾低背，偏激进抓握玩家会很熟悉。" },
  { id: "f1", brand: "VXE", name: "Dragonfly R1 Pro", price: 249, weight: 48, length: 120.6, width: 64, height: 37.8, sensor: "PAW3395 SE", dpi: "26,000", polling: "4,000 Hz*", switches: "Huano 蓝壳粉点", connection: "2.4G / USB-C", battery: "约 75 小时", shape: "对称", size: "中", grips: ["抓握", "指握"], handRange: [16.5, 19.5], tone: "#43d9ff", verdict: "两百元级的重量与传感器配置非常突出。" },
  { id: "mad-r", brand: "VXE", name: "MAD R Major", price: 399, weight: 42, length: 120.1, width: 63.2, height: 38.1, sensor: "PAW3950", dpi: "30,000", polling: "8,000 Hz", switches: "欧姆龙光微动", connection: "2.4G / USB-C", battery: "约 70 小时", shape: "对称", size: "中", grips: ["抓握", "指握"], handRange: [16.5, 19.5], tone: "#5ee5ff", verdict: "极轻中小模具，预算内优先追求纸面性能。" },
  { id: "thorn", brand: "LAMZU", name: "Thorn 4K", price: 699, weight: 52, length: 119, width: 65, height: 42, sensor: "PAW3395", dpi: "26,000", polling: "4,000 Hz", switches: "光学微动", connection: "2.4G / USB-C", battery: "约 80 小时", shape: "人体工学", size: "中", grips: ["趴握", "抓握"], handRange: [16.5, 19.5], tone: "#ff72b8", verdict: "短机身高背工学，适合中小手贴掌操控。" },
];

const brands = ["全部", "Logitech", "Razer", "ZOWIE", "Pulsar", "LAMZU", "Endgame Gear", "VXE"];

function fitScore(mouse: Mouse, hand: number, grip: Grip) {
  const [min, max] = mouse.handRange;
  const center = (min + max) / 2;
  const distance = hand < min ? min - hand : hand > max ? hand - max : Math.abs(hand - center) * 0.18;
  const handScore = Math.max(42, 100 - distance * 18);
  const gripScore = mouse.grips[0] === grip ? 100 : mouse.grips.includes(grip) ? 88 : 58;
  return Math.round(handScore * 0.64 + gripScore * 0.36);
}

function MouseShape({ mouse, large = false }: { mouse: Mouse; large?: boolean }) {
  const ratio = mouse.width / mouse.length;
  return (
    <div className={`mouse-art ${large ? "mouse-art-large" : ""}`} style={{ "--mouse-tone": mouse.tone } as React.CSSProperties} aria-hidden="true">
      <div className={`mouse-body ${mouse.shape === "人体工学" ? "ergo" : "sym"}`} style={{ width: `${Math.round(92 + ratio * 38)}px` }}>
        <span className="mouse-split" />
        <span className="mouse-wheel" />
        <span className="mouse-sensor" />
      </div>
    </div>
  );
}

export default function Home() {
  const [hand, setHand] = useState(18.5);
  const [grip, setGrip] = useState<Grip>("抓握");
  const [budget, setBudget] = useState<[number, number]>([200, 1200]);
  const [brand, setBrand] = useState("全部");
  const [sort, setSort] = useState<Sort>("match");
  const [compare, setCompare] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);

  const results = useMemo(() => {
    const filtered = mice
      .filter((mouse) => mouse.price >= budget[0] && mouse.price <= budget[1])
      .filter((mouse) => brand === "全部" || mouse.brand === brand)
      .map((mouse) => ({ ...mouse, score: fitScore(mouse, hand, grip) }));
    return filtered.sort((a, b) => sort === "price" ? a.price - b.price : sort === "weight" ? a.weight - b.weight : b.score - a.score);
  }, [brand, budget, grip, hand, sort]);

  const compared = compare.map((id) => mice.find((mouse) => mouse.id === id)).filter(Boolean) as Mouse[];
  const top = results[0];

  function toggleCompare(id: string) {
    setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }

  return (
    <main>
      <header className="site-header">
        <a href="#top" className="brand-mark" aria-label="握感研究所首页">
          <span className="brand-dot" />
          <span>GRIPLAB</span>
          <small>握感研究所</small>
        </a>
        <nav aria-label="主导航">
          <a href="#finder">智能推荐</a>
          <a href="#results">鼠标库</a>
          <button className="compare-nav" onClick={() => setCompareOpen(true)} disabled={!compare.length}>对比台 <span>{compare.length}</span></button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> MOUSE FITTING SYSTEM / 01</p>
          <h1>先量手，<br /><em>再挑鼠标。</em></h1>
          <p className="hero-lead">别再只看参数买鼠标。输入手长、握法和预算，用模具尺寸与握持逻辑筛出真正适合你的那一只。</p>
          <a className="hero-cta" href="#finder">开始匹配 <span>↘</span></a>
        </div>
        <div className="hero-visual">
          <div className="measure measure-top"><span>125.0 mm</span></div>
          <div className="measure measure-side"><span>63.5 mm</span></div>
          <MouseShape mouse={mice[0]} large />
          <div className="hero-readout"><b>FIT ENGINE</b><span>测量尺寸 · 匹配握法 · 过滤预算</span></div>
        </div>
        <div className="hero-stats">
          <div><b>{mice.length}</b><span>精选型号</span></div>
          <div><b>10+</b><span>关键参数</span></div>
          <div><b>3</b><span>同时对比</span></div>
        </div>
      </section>

      <section className="finder" id="finder">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> FIND YOUR FIT / 02</p><h2>四步锁定你的模具</h2></div>
          <p>推荐分综合手型区间与握法倾向，仅作为选购起点；每个人的手指比例与发力习惯仍有差异。</p>
        </div>

        <div className="fit-panel">
          <div className="control-block hand-control">
            <div className="control-title"><span>01</span><div><b>手长</b><small>中指尖到掌根横纹</small></div></div>
            <div className="hand-value"><strong>{hand.toFixed(1)}</strong><span>cm</span></div>
            <input aria-label="手长" type="range" min="14" max="23" step="0.5" value={hand} onChange={(e) => setHand(Number(e.target.value))} />
            <div className="scale"><span>14 小手</span><span>18.5 中手</span><span>23 大手</span></div>
          </div>

          <div className="control-block">
            <div className="control-title"><span>02</span><div><b>握法</b><small>选择最常用姿势</small></div></div>
            <div className="grip-options">
              {(["趴握", "抓握", "指握"] as Grip[]).map((item, index) => (
                <button key={item} className={grip === item ? "active" : ""} onClick={() => setGrip(item)}>
                  <i>{index === 0 ? "▰" : index === 1 ? "⌁" : "···"}</i><b>{item}</b><small>{index === 0 ? "稳定贴掌" : index === 1 ? "灵活锁定" : "快速微操"}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="control-block budget-control">
            <div className="control-title"><span>03</span><div><b>预算区间</b><small>按当前参考价筛选</small></div></div>
            <div className="budget-inputs">
              <label>最低 ¥<input aria-label="最低预算" type="number" min="0" max={budget[1]} step="50" value={budget[0]} onChange={(e) => setBudget([Math.min(Number(e.target.value), budget[1]), budget[1]])} /></label>
              <span>—</span>
              <label>最高 ¥<input aria-label="最高预算" type="number" min={budget[0]} max="2000" step="50" value={budget[1]} onChange={(e) => setBudget([budget[0], Math.max(Number(e.target.value), budget[0])])} /></label>
            </div>
            <div className="budget-presets">
              {[[0,300],[300,600],[600,900],[900,1500]].map(([min,max]) => <button key={min} onClick={() => setBudget([min,max])}>¥{min}–{max}</button>)}
            </div>
          </div>

          <div className="control-block brand-control">
            <div className="control-title"><span>04</span><div><b>品牌</b><small>选择你信任的厂商</small></div></div>
            <div className="brand-options">
              {brands.map((item) => <button key={item} className={brand === item ? "active" : ""} onClick={() => setBrand(item)}>{item}</button>)}
            </div>
          </div>
        </div>
      </section>

      <section className="results" id="results">
        <div className="results-head">
          <div><p className="eyebrow"><span /> MATCHED MICE / 03</p><h2>为你找到 <em>{results.length}</em> 款</h2></div>
          <div className="result-actions">
            <p>{hand.toFixed(1)} cm · {grip} · ¥{budget[0]}–{budget[1]}</p>
            <select aria-label="排序方式" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="match">匹配度优先</option>
              <option value="price">价格从低到高</option>
              <option value="weight">重量从轻到重</option>
            </select>
          </div>
        </div>

        {top && <div className="top-pick">
          <div className="top-label">TOP MATCH <span>首选推荐</span></div>
          <MouseShape mouse={top} large />
          <div className="top-copy"><span>{top.brand}</span><h3>{top.name}</h3><p>{top.verdict}</p><div><b>{top.score}%</b><small>适配度</small></div></div>
          <div className="top-specs"><span><small>WEIGHT</small><b>{top.weight} g</b></span><span><small>SENSOR</small><b>{top.sensor}</b></span><span><small>SIZE</small><b>{top.length} × {top.width} × {top.height}</b></span></div>
        </div>}

        <div className="mouse-grid">
          {results.map((mouse, index) => (
            <article className={`mouse-card ${expanded === mouse.id ? "expanded" : ""}`} key={mouse.id}>
              <div className="card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="card-visual"><MouseShape mouse={mouse} /><span className="size-chip">{mouse.size}型 · {mouse.shape}</span></div>
              <div className="card-title"><div><span>{mouse.brand}</span><h3>{mouse.name}</h3></div><div className="fit-score"><b>{mouse.score}</b><small>FIT</small></div></div>
              <p className="verdict">{mouse.verdict}</p>
              <div className="quick-specs">
                <span><small>重量</small><b>{mouse.weight}g</b></span>
                <span><small>传感器</small><b>{mouse.sensor}</b></span>
                <span><small>回报率</small><b>{mouse.polling}</b></span>
              </div>
              <div className="price-row"><strong>¥{mouse.price}</strong><span>参考价</span></div>
              <div className="card-buttons">
                <button className="detail-button" onClick={() => setExpanded(expanded === mouse.id ? null : mouse.id)}>{expanded === mouse.id ? "收起数据" : "查看完整数据"} <span>↗</span></button>
                <button aria-label={`对比 ${mouse.name}`} title={compare.length >= 3 && !compare.includes(mouse.id) ? "最多选择 3 款" : "加入对比"} className={`compare-button ${compare.includes(mouse.id) ? "selected" : ""}`} onClick={() => toggleCompare(mouse.id)} disabled={compare.length >= 3 && !compare.includes(mouse.id)}>{compare.includes(mouse.id) ? "✓" : "+"}</button>
              </div>
              {expanded === mouse.id && <div className="detail-grid">
                <span><small>尺寸 L × W × H</small><b>{mouse.length} × {mouse.width} × {mouse.height} mm</b></span>
                <span><small>最高 DPI</small><b>{mouse.dpi}</b></span>
                <span><small>主按键</small><b>{mouse.switches}</b></span>
                <span><small>连接方式</small><b>{mouse.connection}</b></span>
                <span><small>续航</small><b>{mouse.battery}</b></span>
                <span><small>建议手长</small><b>{mouse.handRange[0]}–{mouse.handRange[1]} cm</b></span>
              </div>}
            </article>
          ))}
        </div>

        {!results.length && <div className="empty-state"><b>这个组合暂时没有结果</b><p>放宽预算或切换到“全部品牌”试试看。</p><button onClick={() => { setBudget([0, 1500]); setBrand("全部"); }}>重置筛选</button></div>}
      </section>

      <section className="method">
        <p className="eyebrow"><span /> HOW IT WORKS / 04</p>
        <div className="method-grid">
          <h2>参数很重要，<br />但模具永远排第一。</h2>
          <div><b>64%</b><h3>尺寸匹配</h3><p>判断手长是否落在模具建议区间，并结合鼠标长度、宽度和背高。</p></div>
          <div><b>36%</b><h3>握法倾向</h3><p>趴握偏好支撑，抓握看背峰锁定，指握更看重短机身与低重量。</p></div>
        </div>
      </section>

      <footer>
        <div className="brand-mark"><span className="brand-dot" /><span>GRIPLAB</span><small>握感研究所</small></div>
        <p>价格为参考区间，型号固件、接收器与地区版本可能影响回报率和续航。购买前请以厂商页面为准。</p>
        <a href="https://www.eloshapes.com/" target="_blank" rel="noreferrer">数据结构参考：EloShapes ↗</a>
      </footer>

      {compare.length > 0 && <button className="floating-compare" onClick={() => setCompareOpen(true)}><span>已选 {compare.length}/3</span> 打开对比台 <b>↗</b></button>}

      {compareOpen && <div className="modal-backdrop" onClick={() => setCompareOpen(false)}>
        <section className="compare-modal" role="dialog" aria-modal="true" aria-label="鼠标对比台" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head"><div><p className="eyebrow"><span /> COMPARE</p><h2>鼠标对比台</h2></div><button aria-label="关闭对比台" onClick={() => setCompareOpen(false)}>×</button></div>
          {!compared.length ? <div className="empty-state"><b>还没有加入鼠标</b><p>回到列表，点击卡片右下角的 +。</p></div> : <div className="compare-table">
            <div className="compare-row compare-products"><b>型号</b>{compared.map((mouse) => <div key={mouse.id}><MouseShape mouse={mouse} /><span>{mouse.brand}</span><strong>{mouse.name}</strong><button onClick={() => toggleCompare(mouse.id)}>移除</button></div>)}</div>
            {[
              ["参考价", (m: Mouse) => `¥${m.price}`],
              ["重量", (m: Mouse) => `${m.weight} g`],
              ["尺寸", (m: Mouse) => `${m.length} × ${m.width} × ${m.height} mm`],
              ["传感器", (m: Mouse) => m.sensor],
              ["最高 DPI", (m: Mouse) => m.dpi],
              ["回报率", (m: Mouse) => m.polling],
              ["主按键", (m: Mouse) => m.switches],
              ["连接", (m: Mouse) => m.connection],
              ["续航", (m: Mouse) => m.battery],
              ["模具", (m: Mouse) => `${m.size}型 · ${m.shape}`],
            ].map(([label, getter]) => <div className="compare-row" key={label as string}><b>{label as string}</b>{compared.map((mouse) => <span key={mouse.id}>{(getter as (m: Mouse) => string)(mouse)}</span>)}</div>)}
          </div>}
        </section>
      </div>}
    </main>
  );
}

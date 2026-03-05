import { useState, useMemo, useCallback } from "react";

// ══════════════════════════════════════════════════════════════
// ShipBob Domestic Standard Ground Rates (publicly available)
// Weight bracket (max oz) → cost per zone (1-12)
// ══════════════════════════════════════════════════════════════
const SHIPBOB_RATES = [
  { maxOz: 1, z: [7.58,7.58,7.58,7.58,7.58,7.63,7.73,7.98,9.58,11.03,8.16,8.16] },
  { maxOz: 2, z: [7.58,7.58,7.58,7.58,7.58,7.64,7.73,7.98,9.58,11.01,8.16,8.16] },
  { maxOz: 3, z: [7.58,7.58,7.58,7.58,7.58,7.64,7.73,7.98,9.58,11.09,8.16,8.16] },
  { maxOz: 4, z: [7.66,7.66,7.66,7.66,7.66,7.72,7.82,8.07,9.88,11.00,8.23,8.23] },
  { maxOz: 5, z: [8.01,8.01,8.01,8.01,8.01,8.01,8.01,8.16,9.93,11.27,8.54,8.54] },
  { maxOz: 6, z: [8.01,8.01,8.01,8.01,8.01,8.01,8.01,8.16,10.07,11.30,8.54,8.54] },
  { maxOz: 7, z: [8.01,8.01,8.01,8.01,8.01,8.01,8.01,8.16,10.07,11.35,8.54,8.54] },
  { maxOz: 8, z: [8.03,8.03,8.03,8.03,8.03,8.03,8.03,8.22,10.13,11.38,8.65,8.65] },
  { maxOz: 10, z: [8.33,8.34,8.34,8.34,8.34,8.34,8.34,8.38,10.79,11.11,10.16,10.16] },
  { maxOz: 12, z: [8.40,8.40,8.40,8.40,8.40,8.40,8.40,8.79,10.83,11.59,10.16,10.16] },
  { maxOz: 16, z: [9.62,9.62,9.96,9.96,10.19,10.30,10.53,10.74,11.56,16.01,14.23,14.23] },
  { maxOz: 32, z: [9.78,9.78,10.15,10.29,10.84,11.03,11.36,11.57,12.97,18.57,16.96,16.96] },
  { maxOz: 48, z: [10.07,10.07,10.50,10.67,11.28,11.60,11.95,12.22,14.56,21.37,19.32,19.32] },
  { maxOz: 64, z: [11.02,11.02,11.68,11.89,12.73,13.00,14.12,14.44,16.91,23.87,20.75,20.75] },
  { maxOz: 80, z: [12.26,12.27,13.01,13.28,14.33,14.76,16.55,17.17,19.86,27.01,22.95,22.95] },
  { maxOz: 96, z: [12.92,12.93,13.43,13.75,14.62,15.00,16.61,17.41,24.44,28.00,25.61,25.61] },
  { maxOz: 112, z: [13.23,13.23,13.79,14.37,15.40,15.71,17.43,18.37,25.84,29.62,27.29,27.29] },
  { maxOz: 128, z: [13.43,13.43,14.05,14.66,15.73,16.10,17.91,18.93,27.53,34.10,28.94,28.94] },
  { maxOz: 160, z: [14.68,14.68,15.43,15.81,18.00,18.37,20.79,22.41,32.07,35.47,32.69,32.69] },
  { maxOz: 192, z: [17.01,17.04,17.76,17.87,18.47,19.50,22.28,23.68,36.63,41.61,36.06,36.06] },
  { maxOz: 224, z: [17.87,17.93,18.32,18.32,19.34,21.06,24.85,26.46,40.37,46.18,39.75,39.75] },
  { maxOz: 256, z: [18.06,18.07,18.63,18.66,20.05,22.49,26.41,28.33,44.98,49.54,43.02,43.02] },
  { maxOz: 304, z: [18.37,18.39,19.28,19.28,21.79,24.52,28.70,31.30,48.33,55.35,46.93,46.93] },
  { maxOz: 384, z: [19.30,19.30,20.95,21.56,24.45,28.44,32.53,36.87,87.54,98.96,59.72,95.94] },
  { maxOz: 480, z: [20.42,20.42,22.94,24.24,27.77,33.23,37.93,43.23,105.17,136.37,68.80,132.56] },
  { maxOz: 640, z: [23.46,23.46,26.96,28.94,32.63,38.24,43.23,48.27,112.45,176.48,93.00,171.58] },
  { maxOz: 800, z: [25.13,25.19,29.22,32.29,36.98,43.86,50.82,55.26,132.63,213.13,108.44,205.11] },
  { maxOz: 1024, z: [27.55,27.55,31.90,34.20,40.14,46.20,52.56,60.81,164.53,255.05,134.06,244.60] },
  { maxOz: 1600, z: [49.03,49.03,49.41,51.78,55.68,63.23,68.75,75.04,237.68,255.05,205.77,258.95] },
  { maxOz: 2400, z: [73.09,73.09,75.55,78.70,80.55,87.49,93.55,104.04,341.17,255.05,318.69,258.95] },
];

function sbRate(oz, zi) {
  const w = Math.ceil(Math.max(oz, 1));
  const b = SHIPBOB_RATES.find((r) => w <= r.maxOz) || SHIPBOB_RATES[SHIPBOB_RATES.length - 1];
  return b.z[zi] || 0;
}
function sbAvg(oz) {
  const w = Math.ceil(Math.max(oz, 1));
  const b = SHIPBOB_RATES.find((r) => w <= r.maxOz) || SHIPBOB_RATES[SHIPBOB_RATES.length - 1];
  const v = b.z.filter((x) => x > 0);
  return v.reduce((a, c) => a + c, 0) / v.length;
}

function fmt(n) {
  if (!isFinite(n) || isNaN(n)) return "$0.00";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function pct(n) {
  if (!isFinite(n) || isNaN(n)) return "0.0%";
  return (n * 100).toFixed(1) + "%";
}

// ── Styles ──
const T = {
  bg: "#0d1117", card: "#161b22", border: "#30363d", accent: "#d4a04a",
  accentDim: "#d4a04a44", text: "#c9d1d9", muted: "#8b949e", dim: "#484f58",
  green: "#3fb950", red: "#f85149", amber: "#d29922", mono: "'IBM Plex Mono', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
};

// ── Tiny Components ──

function Card({ children, style }) {
  return <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, ...style }}>{children}</div>;
}

function Section({ title, sub, children }) {
  return (
    <Card>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: sub ? 2 : 12 }}>{title}</div>
      {sub && <div style={{ fontSize: 10, color: T.dim, marginBottom: 12 }}>{sub}</div>}
      {children}
    </Card>
  );
}

function Field({ label, value, onChange, min, max, step, pre, suf, note, wide }) {
  const [d, setD] = useState(String(value));
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 10, flex: wide ? "1 1 100%" : "1 1 120px", minWidth: 120 }}>
      <label style={{ display: "block", fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {pre && <span style={{ color: T.dim, fontSize: 13, fontWeight: 600 }}>{pre}</span>}
        <input
          type="text" inputMode="decimal"
          value={f ? d : (step && step < 1 ? value.toFixed(2) : String(value))}
          onFocus={(e) => { setF(true); setD(String(value)); e.target.select(); }}
          onBlur={() => { setF(false); const p = parseFloat(d); onChange(isNaN(p) ? (min || 0) : Math.min(Math.max(p, min ?? -Infinity), max ?? Infinity)); }}
          onChange={(e) => { const r = e.target.value; if (/^-?\d*\.?\d*$/.test(r)) { setD(r); const p = parseFloat(r); if (!isNaN(p)) onChange(Math.min(Math.max(p, min ?? -Infinity), max ?? Infinity)); } }}
          style={{
            background: T.bg, border: `1px solid ${T.border}`, borderRadius: 5, color: T.text,
            padding: "6px 8px", fontSize: 13, fontFamily: T.mono, width: "100%", outline: "none",
          }}
        />
        {suf && <span style={{ color: T.dim, fontSize: 11, whiteSpace: "nowrap" }}>{suf}</span>}
      </div>
      {note && <div style={{ fontSize: 9, color: T.dim, marginTop: 2 }}>{note}</div>}
      <style>{`input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input{-moz-appearance:textfield}`}</style>
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{children}</div>;
}

function Pill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer",
      border: active ? `1px solid ${T.accent}` : `1px solid ${T.border}`,
      background: active ? T.accentDim : T.bg,
      color: active ? T.accent : T.muted, transition: "all 0.15s",
    }}>{label}</button>
  );
}

function Stat({ label, val, sub, color }) {
  const c = color === "green" ? T.green : color === "red" ? T.red : color === "amber" ? T.amber : T.muted;
  return (
    <div style={{ flex: "1 1 130px", minWidth: 130, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: T.dim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: c, fontFamily: T.mono }}>{val}</div>
      {sub && <div style={{ fontSize: 10, color: T.dim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function CostLine({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: T.muted, marginBottom: 3, fontSize: 12 }}>
      <span>{label}</span><span style={{ fontFamily: T.mono }}>{val}</span>
    </div>
  );
}

function MarginBar({ margin }) {
  const cl = Math.max(-50, Math.min(100, margin * 100));
  const c = cl >= 50 ? T.green : cl >= 25 ? T.amber : cl >= 0 ? "#e3871c" : T.red;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.dim, marginBottom: 2 }}>
        <span>-50%</span><span>0%</span><span>25%</span><span>50%</span><span>100%</span>
      </div>
      <div style={{ background: T.card, borderRadius: 4, height: 8, position: "relative", overflow: "hidden", border: `1px solid ${T.border}` }}>
        <div style={{ position: "absolute", width: `${(Math.max(cl + 50, 0) / 150) * 100}%`, height: "100%", background: c, borderRadius: 3, transition: "all 0.3s" }} />
        <div style={{ position: "absolute", left: "33.3%", top: 0, bottom: 0, width: 1, background: T.dim, opacity: 0.4 }} />
        <div style={{ position: "absolute", left: "66.6%", top: 0, bottom: 0, width: 1, background: T.dim, opacity: 0.3 }} />
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, color: T.text, marginBottom: 6 }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 32, height: 18, borderRadius: 9, background: checked ? T.green : T.border,
        position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
      }}>
        <div style={{ width: 14, height: 14, borderRadius: 7, background: "#fff", position: "absolute", top: 2, left: checked ? 16 : 2, transition: "left 0.2s" }} />
      </div>
      {label}
    </label>
  );
}

// ── Main ──

export default function PricingMarginTool() {
  // Product
  const [cogs, setCogs] = useState(2.50);
  const [weightOz, setWeightOz] = useState(1.5);
  const [packagingOz, setPackagingOz] = useState(0);

  // Add-on
  const [hasAddon, setHasAddon] = useState(false);
  const [addonCost, setAddonCost] = useState(0.30);
  const [addonPrice, setAddonPrice] = useState(1.00);
  const [addonQty, setAddonQty] = useState(0);

  // Channel & pricing
  const [channel, setChannel] = useState("b2b");
  const [qty, setQty] = useState(200);
  const [b2bPrice, setB2bPrice] = useState(5.50);
  const [dtcPrice, setDtcPrice] = useState(8.95);
  const [dtcShipFee, setDtcShipFee] = useState(4.99);

  // Fulfillment
  const [fulfillMode, setFulfillMode] = useState("shipbob");
  const [zone, setZone] = useState(-1);
  const [customFulfillDTC, setCustomFulfillDTC] = useState(8.00);
  const [customFulfillB2B, setCustomFulfillB2B] = useState(25.00);
  const [boxSize, setBoxSize] = useState(200);

  // Competitor
  const [hasCompetitor, setHasCompetitor] = useState(false);
  const [compName, setCompName] = useState("Competitor");
  const [compT1Price, setCompT1Price] = useState(9.99);
  const [compT1Max, setCompT1Max] = useState(99);
  const [compT2Price, setCompT2Price] = useState(6.00);
  const [compT2Max, setCompT2Max] = useState(499);
  const [compT3Price, setCompT3Price] = useState(5.00);

  // Overhead
  const [monthlyBurn, setMonthlyBurn] = useState(3500);

  // Target
  const [targetMargin, setTargetMargin] = useState(50);

  const isDTC = channel === "dtc";
  const effectiveOz = weightOz + packagingOz;

  // Fulfillment calc
  const calcFF = useCallback((q, mode, perUnit) => {
    if (q <= 0) return 0;
    if (mode === "dtc") {
      if (fulfillMode === "shipbob") {
        const lookup = zone === -1 ? sbAvg : (oz) => sbRate(oz, zone);
        return q * lookup(perUnit ? effectiveOz : effectiveOz);
      }
      return q * customFulfillDTC;
    } else {
      if (fulfillMode === "shipbob") {
        const lookup = zone === -1 ? sbAvg : (oz) => sbRate(oz, zone);
        const full = Math.floor(q / boxSize);
        const rem = q % boxSize;
        let total = full * lookup(boxSize * effectiveOz);
        if (rem > 0) total += lookup(rem * effectiveOz);
        return total;
      }
      const boxes = Math.ceil(q / boxSize);
      return boxes * customFulfillB2B;
    }
  }, [fulfillMode, zone, effectiveOz, customFulfillDTC, customFulfillB2B, boxSize]);

  const getCompPrice = useCallback((q) => {
    if (q <= compT1Max) return compT1Price;
    if (q <= compT2Max) return compT2Price;
    return compT3Price;
  }, [compT1Price, compT1Max, compT2Price, compT2Max, compT3Price]);

  const calc = useMemo(() => {
    const aQty = isDTC ? (hasAddon ? qty : 0) : Math.min(addonQty, qty);

    const revenue = isDTC
      ? qty * dtcPrice + qty * dtcShipFee + aQty * addonPrice
      : qty * b2bPrice + aQty * addonPrice;

    const totalCOGS = qty * cogs + aQty * addonCost;
    const ff = calcFF(qty, isDTC ? "dtc" : "b2b");
    const totalCost = totalCOGS + ff;
    const grossProfit = revenue - totalCost;
    const margin = revenue > 0 ? grossProfit / revenue : 0;
    const profitPU = qty > 0 ? grossProfit / qty : 0;
    const ffPU = qty > 0 ? ff / qty : 0;
    const revPU = qty > 0 ? revenue / qty : 0;
    const costPU = qty > 0 ? totalCost / qty : 0;
    const breakEven = profitPU > 0 ? Math.ceil(monthlyBurn / profitPU) : Infinity;
    const compPrice = hasCompetitor ? getCompPrice(qty) : null;
    const delta = compPrice !== null ? revPU - compPrice : null;

    // Box info for B2B
    const boxWeight = boxSize * effectiveOz;
    let costPerBox = null;
    if (!isDTC) {
      if (fulfillMode === "shipbob") {
        costPerBox = zone === -1 ? sbAvg(boxWeight) : sbRate(boxWeight, zone);
      } else {
        costPerBox = customFulfillB2B;
      }
    }

    // Suggested price to hit target margin
    // margin = (rev - cost) / rev → rev = cost / (1 - margin)
    const tgt = targetMargin / 100;
    const costAtQty = totalCost;
    const neededRev = tgt < 1 ? costAtQty / (1 - tgt) : Infinity;
    const suggestedPU = qty > 0 ? neededRev / qty : 0;
    // For DTC, subtract shipping fee and addon revenue to get suggested product price
    const suggestedProductPrice = isDTC
      ? suggestedPU - dtcShipFee - (hasAddon ? addonPrice * (aQty / qty) : 0)
      : suggestedPU - (hasAddon ? addonPrice * (aQty / qty) : 0);

    return {
      cogs: cogs, totalCOGS, ff, ffPU, totalCost, costPU,
      revenue, revPU, grossProfit, margin, profitPU,
      breakEven, compPrice, delta, aQty,
      costPerBox, boxWeight, suggestedProductPrice,
    };
  }, [channel, qty, b2bPrice, dtcPrice, dtcShipFee, cogs, hasAddon, addonQty, addonCost, addonPrice,
      calcFF, isDTC, monthlyBurn, hasCompetitor, getCompPrice, effectiveOz, boxSize,
      fulfillMode, zone, customFulfillB2B, targetMargin]);

  // Sensitivity
  const sensQtys = [10, 25, 50, 100, 200, 500, 1000, 2000, 5000];
  const sens = useMemo(() => {
    return sensQtys.map((q) => {
      const ff = calcFF(q, isDTC ? "dtc" : "b2b");
      const cost = q * cogs + ff;
      const costPU = cost / q;
      const ffPU = ff / q;
      const rev = isDTC ? q * (dtcPrice + dtcShipFee) : q * b2bPrice;
      const profit = rev - cost;
      const m = rev > 0 ? profit / rev : 0;
      const comp = hasCompetitor ? getCompPrice(q) : null;
      return { qty: q, costPU, ffPU, revPU: rev / q, profit, margin: m, comp };
    });
  }, [cogs, b2bPrice, dtcPrice, dtcShipFee, isDTC, calcFF, hasCompetitor, getCompPrice]);

  const mColor = calc.margin >= targetMargin / 100 ? "green" : calc.margin >= targetMargin / 200 ? "amber" : "red";
  const zoneName = zone === -1 ? "Avg" : `Z${zone + 1}`;

  return (
    <div style={{ fontFamily: T.sans, background: T.bg, color: T.text, minHeight: "100vh", padding: "20px 16px", maxWidth: 960, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 6, height: 20, borderRadius: 2, background: T.accent }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>eComm Pricing & Margin Calculator</h1>
        </div>
        <p style={{ fontSize: 11, color: T.dim, margin: 0, paddingLeft: 14 }}>
          Weight-based fulfillment · ShipBob rate integration · Non-linear cost modeling
        </p>
      </div>

      {/* ── Inputs Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 16 }}>

        {/* Product */}
        <Section title="Product">
          <Row>
            <Field label="COGS / Unit" value={cogs} onChange={setCogs} min={0} step={0.01} pre="$" />
            <Field label="Weight / Unit" value={weightOz} onChange={setWeightOz} min={0.1} step={0.1} suf="oz" />
          </Row>
          <Field label="Packaging Weight" value={packagingOz} onChange={setPackagingOz} min={0} step={0.1} suf="oz" note="Added to product weight for shipping calc" />
          <div style={{ marginTop: 4 }}>
            <Toggle label="Has add-on product" checked={hasAddon} onChange={setHasAddon} />
            {hasAddon && (
              <Row>
                <Field label="Add-on Cost" value={addonCost} onChange={setAddonCost} min={0} step={0.01} pre="$" />
                <Field label="Add-on Price" value={addonPrice} onChange={setAddonPrice} min={0} step={0.01} pre="$" />
              </Row>
            )}
          </div>
        </Section>

        {/* Order */}
        <Section title="Order">
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <Pill label="B2B Wholesale" active={channel === "b2b"} onClick={() => setChannel("b2b")} />
            <Pill label="DTC / eComm" active={channel === "dtc"} onClick={() => setChannel("dtc")} />
          </div>
          <Field label="Order Quantity" value={qty} onChange={setQty} min={1} step={1} suf="units" wide />
          {isDTC ? (
            <>
              <Row>
                <Field label="List Price" value={dtcPrice} onChange={setDtcPrice} min={0} step={0.01} pre="$" />
                <Field label="Shipping Fee" value={dtcShipFee} onChange={setDtcShipFee} min={0} step={0.01} pre="$" note="Charged to customer" />
              </Row>
              {hasAddon && (
                <Toggle label="All orders include add-on" checked={true} onChange={() => {}} />
              )}
            </>
          ) : (
            <>
              <Field label="Unit Price (Your Quote)" value={b2bPrice} onChange={setB2bPrice} min={0} step={0.05} pre="$" wide />
              {hasAddon && (
                <Field label="Units with add-on" value={addonQty} onChange={(v) => setAddonQty(Math.min(v, qty))} min={0} max={qty} step={1} suf={`of ${qty}`} wide />
              )}
            </>
          )}
        </Section>

        {/* Fulfillment */}
        <Section title="Fulfillment" sub="How shipments are costed">
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <Pill label="ShipBob Rates" active={fulfillMode === "shipbob"} onClick={() => setFulfillMode("shipbob")} />
            <Pill label="Custom / Flat" active={fulfillMode === "custom"} onClick={() => setFulfillMode("custom")} />
          </div>

          {fulfillMode === "shipbob" ? (
            <>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: "block", fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Shipping Zone</label>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  <Pill label="Avg" active={zone === -1} onClick={() => setZone(-1)} />
                  {Array.from({ length: 12 }, (_, i) => (
                    <Pill key={i} label={String(i + 1)} active={zone === i} onClick={() => setZone(i)} />
                  ))}
                </div>
                <div style={{ fontSize: 9, color: T.dim, marginTop: 3 }}>1-2 nearby · 5-6 mid · 9-10 far coast</div>
              </div>
            </>
          ) : (
            <Row>
              <Field label="DTC Fulfill/Order" value={customFulfillDTC} onChange={setCustomFulfillDTC} min={0} step={0.01} pre="$" />
              <Field label="B2B Fulfill/Box" value={customFulfillB2B} onChange={setCustomFulfillB2B} min={0} step={0.01} pre="$" />
            </Row>
          )}
          <Field label="B2B Box Size" value={boxSize} onChange={setBoxSize} min={1} step={1} suf="units/box" note="Max units per shipment for B2B" />
        </Section>

        {/* Benchmarks */}
        <Section title="Benchmarks">
          <Row>
            <Field label="Monthly Overhead" value={monthlyBurn} onChange={setMonthlyBurn} min={0} step={100} pre="$" note="Burn rate / fixed costs" />
            <Field label="Target Margin" value={targetMargin} onChange={setTargetMargin} min={0} max={99} step={1} suf="%" />
          </Row>
          <div style={{ marginTop: 4 }}>
            <Toggle label="Track competitor pricing" checked={hasCompetitor} onChange={setHasCompetitor} />
            {hasCompetitor && (
              <>
                <Row>
                  <Field label="Tier 1 Price" value={compT1Price} onChange={setCompT1Price} min={0} step={0.01} pre="$" />
                  <Field label="Up to qty" value={compT1Max} onChange={setCompT1Max} min={1} step={1} />
                </Row>
                <Row>
                  <Field label="Tier 2 Price" value={compT2Price} onChange={setCompT2Price} min={0} step={0.01} pre="$" />
                  <Field label="Up to qty" value={compT2Max} onChange={setCompT2Max} min={1} step={1} />
                </Row>
                <Field label="Tier 3 Price (above)" value={compT3Price} onChange={setCompT3Price} min={0} step={0.01} pre="$" />
              </>
            )}
          </div>
        </Section>
      </div>

      {/* ── Results ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <Stat label="Revenue" val={fmt(calc.revenue)} sub={`${fmt(calc.revPU)}/unit`} />
        <Stat label="Total Cost" val={fmt(calc.totalCost)} sub={`${fmt(calc.costPU)}/unit`} />
        <Stat label="Gross Profit" val={fmt(calc.grossProfit)} sub={`${fmt(calc.profitPU)}/unit`} color={calc.grossProfit >= 0 ? "green" : "red"} />
        <Stat label="Margin" val={pct(calc.margin)} sub={calc.margin >= targetMargin / 100 ? `Above ${targetMargin}% target` : `Below ${targetMargin}% target`} color={mColor} />
      </div>
      <MarginBar margin={calc.margin} />

      {/* Cost breakdown + insights */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Unit Economics</div>
          <CostLine label="Product COGS" val={fmt(cogs)} />
          {hasAddon && calc.aQty > 0 && qty > 0 && <CostLine label="Add-on (blended)" val={fmt((calc.aQty * addonCost) / qty)} />}
          <CostLine label={`Fulfillment (${fulfillMode === "shipbob" ? zoneName : "custom"})`} val={fmt(calc.ffPU)} />
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 5, marginTop: 5, display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12, color: T.text }}>
            <span>Total Cost/Unit</span><span style={{ fontFamily: T.mono }}>{fmt(calc.costPU)}</span>
          </div>
          {!isDTC && calc.costPerBox != null && (
            <div style={{ fontSize: 10, color: T.dim, marginTop: 6 }}>
              Box: {boxSize} units · {calc.boxWeight.toFixed(0)}oz · {fmt(calc.costPerBox)}/box
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Insights</div>
          <CostLine label="Units to cover overhead" val={calc.breakEven === Infinity ? "N/A" : calc.breakEven.toLocaleString()} />
          <CostLine label={`Price for ${targetMargin}% margin`} val={fmt(calc.suggestedProductPrice)} />
          {hasCompetitor && calc.compPrice !== null && (
            <>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 5, marginTop: 5 }} />
              <CostLine label={`Competitor @ ${qty} units`} val={fmt(calc.compPrice)} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 12 }}>
                <span style={{ color: T.muted }}>Your delta</span>
                <span style={{ fontFamily: T.mono, color: calc.delta < 0 ? T.green : calc.delta > 0 ? T.amber : T.muted }}>
                  {calc.delta < 0 ? "" : "+"}{fmt(calc.delta)}
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Sensitivity ── */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>Volume Sensitivity</div>
        <div style={{ fontSize: 9, color: T.dim, marginBottom: 10 }}>
          {isDTC ? `DTC @ ${fmt(dtcPrice)}` : `B2B @ ${fmt(b2bPrice)}/unit`} · COGS {fmt(cogs)} · {effectiveOz}oz · {fulfillMode === "shipbob" ? zoneName : "custom rates"}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Qty", "Cost/Unit", "Ship/Unit", isDTC ? "Rev/Unit" : "Price", "Profit", "Margin", ...(hasCompetitor ? ["Comp"] : [])].map((h) => (
                  <th key={h} style={{ padding: "6px 6px", textAlign: "right", color: T.dim, fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sens.map((r) => {
                const mc = r.margin >= targetMargin / 100 ? T.green : r.margin >= targetMargin / 200 ? T.amber : r.margin >= 0 ? "#e3871c" : T.red;
                return (
                  <tr key={r.qty} style={{ borderBottom: `1px solid ${T.bg}` }}>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: T.text, fontWeight: 600 }}>{r.qty.toLocaleString()}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: T.muted }}>{fmt(r.costPU)}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: T.dim }}>{fmt(r.ffPU)}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: T.muted }}>{fmt(r.revPU)}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: r.profit >= 0 ? T.green : T.red }}>{fmt(r.profit)}</td>
                    <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: mc, fontWeight: 600 }}>{pct(r.margin)}</td>
                    {hasCompetitor && <td style={{ padding: "5px 6px", textAlign: "right", fontFamily: T.mono, color: T.dim }}>{r.comp != null ? fmt(r.comp) : "—"}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ fontSize: 9, color: T.dim, textAlign: "center", paddingBottom: 16 }}>
        ShipBob Standard Ground rates (public) · Does not account for dimensional weight surcharges · All figures exclude tax
      </div>
    </div>
  );
}

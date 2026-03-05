# eComm Pricing & Margin Calculator

A React-based pricing tool for e-commerce businesses that models non-linear fulfillment costs, zone-based shipping rates, and real-time margin analysis across B2B and DTC channels.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Why This Exists

Most e-commerce margin calculators treat shipping as a flat rate. In reality, fulfillment costs vary by shipment weight, shipping zone, and whether you're sending individual DTC orders or palletized B2B boxes. A 200-unit box shipping to Zone 2 (nearby) costs a fraction of the same box going to Zone 10 (cross-country). This tool models that accurately for small businesses.

## Features

- **Weight × Zone Fulfillment Modeling** — Integrates ShipBob's domestic standard ground rate card (30 weight brackets × 12 shipping zones) for accurate per-shipment cost lookups. Alternatively, supports custom flat-rate fulfillment costs.
- **B2B & DTC Channel Switching** — Different cost structures per channel. B2B ships in configurable box sizes with per-box rate lookups; DTC costs each order individually.
- **Suggested Pricing** — Reverse-calculates the product price needed to hit a user-defined target margin, given the current cost structure.
- **Volume Sensitivity Table** — Shows how cost/unit, fulfillment/unit, profit, and margin shift across order quantities from 10 to 5,000 units.
- **Competitor Benchmarking** — Optional 3-tier competitor pricing model to track your price delta at any volume.
- **Add-on Product Modeling** — Supports an optional add-on with independent cost and price, blended into margin calculations.
- **Overhead Break-Even** — Calculates units needed to cover monthly fixed costs at current margins.

## How It Works

### Fulfillment Cost Lookup

For ShipBob mode, the tool calculates total shipment weight (`units × (product_oz + packaging_oz)`) and looks up the cost in the rate table for the selected zone:

- **DTC**: Each order = 1 unit shipped individually → looks up single-unit weight
- **B2B**: Ships in boxes of N units → looks up full-box weight per box, with partial last box costed separately at its actual weight

This means B2B per-unit fulfillment cost is essentially flat across volumes (every full box weighs the same), while DTC per-unit cost is constant regardless of order count — matching real-world fulfillment economics.

### Margin Calculation

```
Revenue = (qty × unit_price) + (addon_qty × addon_price) [+ shipping_fee for DTC]
COGS    = (qty × cogs_per_unit) + (addon_qty × addon_cost)
Fulfill = Σ shipbob_lookup(box_weight, zone) for each box
Margin  = (Revenue - COGS - Fulfill) / Revenue
```

## Quick Start

```bash
# Clone
git clone https://github.com/1ysander/ecomm-pricing-calculator.git
cd ecomm-pricing-calculator

# Install
npm install

# Run
npm run dev
```

Opens at `http://localhost:5173`

## Deploy

Works out of the box on Vercel or Netlify:

```bash
npm run build
```

Output goes to `/dist`. Point your deployment platform at the repo and it auto-detects Vite.

## Tech Stack

- **React 18** — Functional components with hooks (`useState`, `useMemo`, `useCallback`)
- **Vite 5** — Build tooling
- **Zero dependencies** beyond React — no UI library, no charting library, no state management. Pure React with inline styles.

## Project Structure

```
├── src/
│   ├── App.jsx          # Main calculator component (all logic + UI)
│   └── main.jsx         # React entry point
├── index.html           # Vite HTML entry
├── package.json
├── vite.config.js
└── README.md
```

## License

MIT — see [LICENSE](./LICENSE)

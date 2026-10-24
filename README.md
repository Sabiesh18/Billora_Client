# Billora Client - Professional Offline Restaurant POS Terminal

Modern, offline-capable restaurant and hotel Point-of-Sale (POS) terminal built with **React.js**, **Tailwind CSS**, and **Vite**.

---

## 1. Core POS Features
- **High-Speed Billing Screen**:
  - Horizontal category tabs with live search.
  - Veg, Non-Veg, Beverage, Dessert badges with pricing.
  - Multi-order types: `Dine-In`, `Takeaway`, `Delivery`.
  - Dining table layout selector.
  - Cart line items with quantity adjustments (`+` / `-`) and cooking instructions.
  - Subtotal, % or flat discount, GST, and standardized rounding policy.
- **Payment & Settlement Modal**:
  - Support for `Cash`, `UPI / QR`, `Card`, and `Split` payments.
  - Real-time balance and customer change due calculator.
- **Thermal Receipt Printing**:
  - 80mm & 58mm POS thermal receipt format with `@media print` CSS isolation.
  - Direct print triggers using `window.print()`.
- **Kitchen Order Ticket (KOT)**:
  - Generates kitchen tickets for culinary stations.
- **Table Management Layout**:
  - Color-coded dining tables (Available: Green, Occupied: Amber, Billed: Blue).
- **Transaction History & Audited Cancellations**:
  - Full bill history with reprint capability and controlled cancellations requiring mandatory audit reasons.
- **Sales Analytics & Reports**:
  - Daily, weekly, and monthly revenue, tax liabilities, and payment mode breakdowns.
- **Unified Activity History**:
  - Inspection interface for all system events recorded in `tbl_ActivityHistory`.

---

## 2. Technology Stack
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide Icons & Custom SVG indicators

---

## 3. Quick Start (Offline Local Mode)
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open your browser at:
`http://localhost:5173`

The Vite dev server proxies API calls (`/api`) directly to the Java backend on `http://localhost:8080`.

# Polymarket AI Agent UI

A modern React + Vite single-page app with Tailwind CSS and Framer Motion. Includes wallet connect (MetaMask/EIP-1193), guarded routes, and a polished, responsive UI with a feature grid, header, and footer.

## Features

- Clean, responsive design on a dark slate background (#0f172a) with a teal accent (#06d6a0)
- Framer Motion animations for page and card reveals
- Client-side routing (react-router-dom) with a shared layout (Header/Footer)
- Connect Wallet (MetaMask): shows address and native balance, auto-connect option, and disconnect
- Guarded routes: protected pages require a connected wallet; shows a single notice then redirects
- Modal connect sheet rendered via a portal so it always overlays correctly
- Legal pages (Privacy, Terms) and a Contact page
- Sensible .gitignore and .gitattributes for Windows-friendly Git usage

## Tech stack

- React 18 (Vite)
- Tailwind CSS
- Framer Motion
- react-router-dom
- lucide-react (icons)
- EIP-1193 provider (MetaMask) for wallet integration

## Quick start (Windows PowerShell)

- Prereqs: Node.js 18+ and npm

Install dependencies:

```powershell
npm install
```

Start the dev server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

## Project structure

```
. 
├─ src/
│  ├─ App.jsx                # Layout with Header, Outlet, Footer
│  ├─ main.jsx               # Router + WalletProvider wiring
│  ├─ index.css              # Tailwind base and custom utilities
│  ├─ components/
│  │  ├─ Header.jsx          # Top navigation + Connect Wallet
│  │  ├─ Footer.jsx          # Footer with links
│  │  ├─ FeatureGrid.jsx     # Animated feature cards (3×2)
│  │  └─ ConnectButton.jsx   # Modal-based wallet connect UI
│  ├─ contexts/
│  │  └─ WalletContext.jsx   # EIP-1193 MetaMask connect + balance
│  ├─ routes/
│  │  └─ RequireWallet.jsx   # Guarded-route wrapper
│  ├─ pages/
│  │  ├─ Home.jsx
│  │  ├─ PredictionMarket.jsx
│  │  ├─ CustomAgent.jsx
│  │  ├─ Privacy.jsx
│  │  ├─ Terms.jsx
│  │  └─ Contact.jsx
│  └─ ...
├─ index.html
├─ tailwind.config.js
├─ postcss.config.js
├─ vite.config.js
├─ .gitignore
├─ .gitattributes
└─ package.json
```

## Scripts

- `npm run dev` – Start the Vite dev server
- `npm run build` – Build production assets to `dist/`
- `npm run preview` – Preview the built app locally

## Wallet usage

- Click “Connect Wallet” in the header, pick MetaMask
- When connected, your shortened address and native balance (ETH) are shown
- Toggle “Auto-connect next time” to remember your choice using localStorage
- Use “Disconnect” to clear the session (EIP-1193 doesn’t support a programmatic disconnect; this clears local state)
- Guarded pages (e.g., Prediction Market, Custom AI Agent) require a connected wallet; if not connected, a one-time notice appears and you’re redirected to Home

## Styling

- Tailwind utility-first classes with a custom palette
- A few custom utilities (e.g., gradient rings and subtle glows) are defined in `src/index.css`

## Troubleshooting

- MetaMask not detected: Ensure the extension is installed and enabled in your browser
- Alert shows twice while blocking a route: Dev builds with React Strict Mode can double-mount. The guard uses sessionStorage to limit the alert to once per navigation
- Balance reads as 0: Ensure the selected MetaMask account has a balance on the active chain. Switching chains updates the balance automatically
- Port already in use: Stop the process using the port or set a different port for Vite
- Line endings in Git on Windows: `.gitattributes` normalizes endings to LF for source files and CRLF for batch files

## Deployment

- Run `npm run build` and serve the `dist/` folder via any static host (Netlify, Vercel, GitHub Pages, Nginx, etc.)
- For a quick local check, `npm run preview` starts a static server to preview `dist/`


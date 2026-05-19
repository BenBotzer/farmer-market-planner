# Farmers Market Planner

Market Planner helps you decide where to buy each item at your local farmers market.

The app is built around a simple assumption: all sellers have the same quality, and the distance between stands is negligible. With that assumption, the best plan is usually the one that gets each item from the seller with the best price, while still letting you choose a different seller when you prefer.

## How It Works

Add the price lists from the sellers at your farmers market. You can paste the list as text, or upload a text, CSV, or PDF file.

Market Planner parses the lists and creates a comparison table with the items it finds. Items are organized by name, and each row shows the prices offered by the different sellers for that item.

Next to the table, the shopping plan summarizes the items you select. The plan is split by vendor, so you can see which stand to visit and what to buy there.

When you are done planning, you can copy the shopping plan as plain text and paste it wherever you want.

## Current Limitations

The parser is best-effort. It can handle many common price-list formats, including sale bundles, but it may not parse everything correctly. You should review the table before using the final plan.

PDF extraction works only when the PDF exposes readable text. Scanned PDFs, photos, and some custom encoded PDFs may not work.

## Run Locally

Install dependencies:

```powershell
npm install
```

Run the app:

```powershell
npm run serve
```

Then visit `http://localhost:5173`.

## Build for Hosting

Market Planner is a static browser app, so it can run on any static host. No server, database, or API key is required.

Build the deployable files:

```powershell
npm run build
```

The generated `dist` folder can be uploaded to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static web host.

## Preview the Production Build Locally

```powershell
npm run build
npm run preview
```

Then visit `http://localhost:4173`.

## GitHub Pages

This project includes `.github/workflows/deploy-pages.yml`. To publish with GitHub Pages:

1. Push the project to a GitHub repository on the `main` branch.
2. In the repository settings, open **Pages**.
3. Set the source to **GitHub Actions**.
4. Push again, or run the **Deploy Market Planner** workflow manually.

GitHub will publish the contents of `dist`.

Note: GitHub Pages for private repositories depends on your GitHub plan.

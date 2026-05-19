# Market Planner

Market Planner compares farmers market seller price lists and produces a shopping plan for the cheapest stand per item, assuming quality is the same everywhere.

## Use it

Open `index.html` in a browser, or serve the folder locally:

```powershell
python -m http.server 5173
```

Then visit `http://localhost:5173`.

## Run it online

Market Planner is a static browser app, so it can run on any static host. No server, database, or API key is required.

Build the deployable files:

```powershell
npm run build
```

The generated `dist` folder can be uploaded to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static web host.

### GitHub Pages

This project includes `.github/workflows/deploy-pages.yml`. To publish with GitHub Pages:

1. Push the project to a GitHub repository on the `main` branch.
2. In the repository settings, open **Pages**.
3. Set the source to **GitHub Actions**.
4. Push again, or run the **Deploy Market Planner** workflow manually.

GitHub will publish the contents of `dist`.

### Preview the production build locally

```powershell
npm run build
npm run preview
```

Then visit `http://localhost:4173`.

## What works now

- Add/remove sellers.
- Paste price lists or import `.txt` / `.csv` / WhatsApp text export files.
- Extract text from many text-based PDFs directly in the browser.
- Parse common formats such as `Tomatoes 12 / kg`, `Cucumbers 2 for 10`, `Basil ₪4.50 bunch`, and `Apples 500g 6`.
- Normalize common item names and units.
- Compare unit prices and group the recommended shopping plan by seller.
- Copy the cart as text.
- Save the current comparison in browser local storage.

## PDF inputs

PDF files are handled with a best-effort browser extractor. This works for many text-based PDFs, but scanned PDFs and some custom encoded Hebrew font PDFs may not expose readable text. Photo/image inputs are not supported right now.

Good options:

- Local-only: PDF text extraction plus pasted seller text.
- Cloud/AI-assisted: send each seller file to a vision-capable model and ask for structured `{ item, price, quantity, unit }` rows.
- Hybrid: use local PDF text extraction when possible, fall back to OCR/AI for scans and photos later if needed.

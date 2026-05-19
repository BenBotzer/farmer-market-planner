import {
  buildShoppingPlan,
  cleanWhatsAppText,
  compareOffers,
  confidenceLabel,
  formatMoney,
  getSampleSellers,
  looksLikeWhatsAppText,
  parsePriceList,
} from "./market.js?v=farmers-title-1";
import { extractTextFromPdfFile } from "./extractors.js?v=farmers-title-1";

const storageKey = "market-scout-state-v1";

const state = loadState();
const app = document.querySelector("#app");
let searchDraft = state.query || "";
let highlightedSuggestionIndex = 0;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.sellers?.length) {
      return {
        ...saved,
        selectedOfferIds: saved.selectedOfferIds && typeof saved.selectedOfferIds === "object" ? saved.selectedOfferIds : {},
        sellers: saved.sellers.map((seller) => {
          const cleanedText = cleanWhatsAppText(seller.text);
          const cleanedOldPdfImport = seller.text && !cleanedText && (seller.files || []).some((file) => file?.detail?.includes("Extracted PDF text"));
          return {
            ...seller,
            text: cleanedText,
            files: cleanedOldPdfImport
              ? seller.files.map((file) => ({
                  ...file,
                  status: "needs-extraction",
                  detail: "Previous binary extraction was cleaned. Reattach the PDF to import with the fixed extractor.",
                }))
              : seller.files,
          };
        }),
      };
    }
  } catch {
    // Ignore corrupt local state and start from sample data.
  }
  return {
    marketDate: new Date().toISOString().slice(0, 10),
    sellers: getSampleSellers(),
    expandedSellerId: null,
    selectedComparisonKeys: [],
    selectedOfferIds: {},
    selectedItemKey: null,
    query: "",
    activeUnit: "all",
    showOnlyWinners: false,
  };
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    const compactState = {
      ...state,
      sellers: state.sellers.map((seller) => ({
        ...seller,
        files: (seller.files || []).map(normalizeFileRecord),
      })),
    };
    localStorage.setItem(storageKey, JSON.stringify(compactState));
  }
}

function sellerId() {
  return `seller-${crypto.randomUUID?.() || Date.now()}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function confidenceClass(confidence) {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

function formatQuantity(value) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatOfferPrice(offer) {
  const unitPrice = `${formatMoney(offer.unitPrice, offer.currency)} / ${escapeHtml(offer.baseUnit)}`;
  if (!offer.quantity || offer.quantity === 1) return unitPrice;

  return `${unitPrice} <span class="deal-note">(${formatQuantity(offer.quantity)} ${escapeHtml(offer.unitLabel)} for ${formatMoney(offer.price, offer.currency)})</span>`;
}

function formatOfferPriceText(offer) {
  const unitPrice = `${formatMoney(offer.unitPrice, offer.currency)} / ${offer.baseUnit}`;
  if (!offer.quantity || offer.quantity === 1) return unitPrice;

  return `${unitPrice} (${formatQuantity(offer.quantity)} ${offer.unitLabel} for ${formatMoney(offer.price, offer.currency)})`;
}

function comparisonKeyForOffer(offer) {
  return `${offer.itemKey}:${offer.baseUnit}`;
}

function selectedOfferForComparison(comparison) {
  const selectedOfferId = state.selectedOfferIds?.[comparison.key];
  return comparison.offers.find((offer) => offer.id === selectedOfferId) || comparison.best;
}

function withSelectedOffer(comparison) {
  return {
    ...comparison,
    best: selectedOfferForComparison(comparison),
  };
}

function matchesSearchFilter(entry) {
  const key = entry.key || comparisonKeyForOffer(entry);
  if (state.selectedItemKey) return key === state.selectedItemKey;
  if (!state.query) return true;
  return entry.itemName.toLowerCase().includes(state.query.toLowerCase());
}

function getSearchOptions() {
  const isSingleSeller = state.sellers.length === 1;
  const rows = isSingleSeller
    ? parsePriceList(state.sellers[0].text, state.sellers[0].name).map((offer) => ({
        key: comparisonKeyForOffer(offer),
        itemKey: offer.itemKey,
        itemName: offer.itemName,
        baseUnit: offer.baseUnit,
      }))
    : compareOffers(state.sellers).map((comparison) => ({
        key: comparison.key,
        itemKey: comparison.itemKey,
        itemName: comparison.itemName,
        baseUnit: comparison.baseUnit,
      }));
  const byKey = new Map();

  for (const row of rows) {
    if (state.activeUnit !== "all" && row.baseUnit !== state.activeUnit) continue;
    if (!byKey.has(row.key)) byKey.set(row.key, row);
  }

  return Array.from(byKey.values()).sort((a, b) => {
    const nameSort = a.itemName.localeCompare(b.itemName);
    return nameSort || a.baseUnit.localeCompare(b.baseUnit);
  });
}

function getMatchingSearchOptions(term) {
  const value = String(term || "").trim().toLowerCase();
  if (!value) return [];

  return getSearchOptions()
    .map((option) => ({
      ...option,
      startsWithMatch: option.itemName.toLowerCase().startsWith(value) || option.itemKey.toLowerCase().startsWith(value),
    }))
    .filter((option) => option.startsWithMatch || option.itemName.toLowerCase().includes(value) || option.itemKey.toLowerCase().includes(value))
    .sort((a, b) => Number(b.startsWithMatch) - Number(a.startsWithMatch) || a.itemName.localeCompare(b.itemName))
    .slice(0, 40);
}

function render(options = {}) {
  const isSingleSeller = state.sellers.length === 1;
  const singleSellerOffers = isSingleSeller
    ? parsePriceList(state.sellers[0].text, state.sellers[0].name).filter((offer) => {
        const matchesQuery = matchesSearchFilter(offer);
        const matchesUnit = state.activeUnit === "all" || offer.baseUnit === state.activeUnit;
        return matchesQuery && matchesUnit;
      })
    : [];
  const comparisons = compareOffers(state.sellers);
  const selectedKeys = getSelectedComparisonKeys(comparisons);
  const comparisonRows = comparisons.map(withSelectedOffer);
  const filteredComparisons = comparisonRows.filter((comparison) => {
    const matchesQuery = matchesSearchFilter(comparison);
    const matchesUnit = state.activeUnit === "all" || comparison.baseUnit === state.activeUnit;
    return matchesQuery && matchesUnit;
  });
  const selectedComparisons = comparisonRows.filter((comparison) => selectedKeys.has(comparison.key));
  const plan = buildShoppingPlan(selectedComparisons);
  const parsedCount = state.sellers.reduce((sum, seller) => sum + parsePriceList(seller.text, seller.name).length, 0);
  const needsReviewCount = comparisons.flatMap((comparison) => comparison.offers).filter((offer) => confidenceLabel(offer.confidence) !== "High").length;
  const planTotal = plan.reduce((sum, seller) => sum + seller.estimatedTotal, 0);
  const selectedCount = selectedComparisons.length;

  app.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" role="img">
            <path d="M7 12h18l-2 13H9L7 12Z" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M11 12c.4-5 4-8 5-8 1 0 4.6 3 5 8" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M13 19h6M12 23h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
        <div>
          <h1>Farmers Market Planner</h1>
          <p>Compare seller price lists and build the cheapest Friday market plan.</p>
        </div>
      </div>
      <div class="top-metrics" aria-label="Farmers Market Planner summary">
        <div>
          <span>Sellers</span>
          <strong>${state.sellers.length}</strong>
        </div>
        <div>
          <span>Offers</span>
          <strong>${parsedCount}</strong>
        </div>
        <div>
          <span>Cart</span>
          <strong>${selectedCount}</strong>
        </div>
      </div>
      <div class="top-actions">
        <label class="date-control">
          <span>Market date</span>
          <input id="market-date" type="date" value="${escapeHtml(state.marketDate)}" />
        </label>
        <button class="secondary" id="reset-sample" type="button">Load sample</button>
      </div>
    </header>

    <main class="workspace">
      <section class="panel seller-panel" aria-labelledby="seller-inputs-title">
        <div class="panel-heading">
          <div>
            <h2 id="seller-inputs-title">1. Seller Inputs</h2>
            <p>${state.sellers.length} sellers, ${parsedCount} parsed offers</p>
          </div>
          <button class="icon-button" id="add-seller" type="button" aria-label="Add seller" title="Add seller">+</button>
        </div>
        <div class="seller-list">
          ${state.sellers.map(renderSeller).join("")}
        </div>
      </section>

      <section class="panel compare-panel" aria-labelledby="compare-title">
        <div class="panel-heading comparison-heading">
          <div>
            <h2 id="compare-title">${isSingleSeller ? "2. Seller Price List" : "2. Compare Prices"}</h2>
            <p>${isSingleSeller ? "A clear parsed list for the current seller." : "Lowest unit price wins; equal prices are shown as ties."}</p>
          </div>
          ${needsReviewCount ? `
            <div class="confidence-key" aria-label="Parser confidence key">
              <span>Parser review:</span>
              <span><i class="dot medium"></i>Medium</span>
              <span><i class="dot low"></i>Check</span>
            </div>
          ` : '<div class="confidence-key all-clear">All parsed prices look clear</div>'}
        </div>

        <div class="filters">
          <div class="search search-combobox">
            <label>
              <span class="visually-hidden">Search items</span>
              <input
                id="query"
                type="search"
                value="${escapeHtml(state.query)}"
                placeholder="Search items..."
                autocomplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="item-suggestions"
              />
            </label>
            <button class="search-clear" id="clear-query" type="button" aria-label="Clear selected item" title="Clear selected item" ${state.query || state.selectedItemKey ? "" : "hidden"}>&times;</button>
            <div class="search-suggestions" id="item-suggestions" role="listbox" hidden></div>
          </div>
          <label>
            <span>Unit</span>
            <select id="unit-filter">
              ${["all", "kg", "unit", "head", "bunch", "pack", "box", "L"].map((unit) => `
                <option value="${unit}" ${state.activeUnit === unit ? "selected" : ""}>${unit === "all" ? "All units" : `per ${unit}`}</option>
              `).join("")}
            </select>
          </label>
          <label class="checkbox">
            <input id="show-only-winners" type="checkbox" ${state.showOnlyWinners ? "checked" : ""} />
            <span>Show winners only</span>
          </label>
          <div class="selection-actions">
            <button class="text-button select-visible" type="button">Select all items</button>
            <button class="text-button clear-visible" type="button">Clear item list</button>
          </div>
        </div>

        <div class="table-wrap">
          <table class="${isSingleSeller ? "single-seller-table" : ""}">
            ${isSingleSeller ? renderSingleSellerTable(singleSellerOffers, selectedKeys) : renderComparisonTable(filteredComparisons, selectedKeys)}
          </table>
        </div>
      </section>

      <section class="panel plan-panel" aria-labelledby="plan-title">
        <div class="panel-heading">
          <div>
            <h2 id="plan-title">3. Shopping Plan</h2>
            <p>Grouped by the stands to visit.</p>
          </div>
          <button class="secondary" id="copy-plan" type="button">Copy Cart</button>
        </div>
        <div class="plan-summary">
          <span>Total for ${selectedCount} selected item${selectedCount === 1 ? "" : "s"}</span>
          <strong>${formatMoney(planTotal, selectedComparisons[0]?.best.currency || filteredComparisons[0]?.best.currency || "$")}</strong>
          <small>${plan.length ? `${plan.length} seller${plan.length === 1 ? "" : "s"} to visit` : "No cart items yet"}</small>
        </div>
        <div class="plan-list">
          ${plan.length ? plan.map(renderPlanSeller).join("") : '<div class="empty">Select items from the table to create a plan.</div>'}
        </div>
      </section>
    </main>
  `;

  bindEvents();

  if (options.restoreFocus === "query") {
    requestAnimationFrame(() => {
      const queryInput = document.querySelector("#query");
      if (!queryInput) return;
      queryInput.focus();
      const cursorPosition = Math.min(
        Number.isInteger(options.selectionStart) ? options.selectionStart : queryInput.value.length,
        queryInput.value.length,
      );
      queryInput.setSelectionRange(cursorPosition, cursorPosition);
    });
  }
}

function getSelectedComparisonKeys(comparisons) {
  const availableKeys = new Set(comparisons.map((comparison) => comparison.key));
  if (!Array.isArray(state.selectedComparisonKeys)) return new Set();
  return new Set(state.selectedComparisonKeys.filter((key) => availableKeys.has(key)));
}

function saveSelectedComparisonKeys(keys) {
  state.selectedComparisonKeys = Array.from(keys);
  saveState();
}

function getVisibleComparisons() {
  return compareOffers(state.sellers).filter((comparison) => {
    const matchesQuery = matchesSearchFilter(comparison);
    const matchesUnit = state.activeUnit === "all" || comparison.baseUnit === state.activeUnit;
    return matchesQuery && matchesUnit;
  });
}

function hideSearchSuggestions() {
  const suggestions = document.querySelector("#item-suggestions");
  const queryInput = document.querySelector("#query");
  if (!suggestions || !queryInput) return;
  suggestions.hidden = true;
  suggestions.innerHTML = "";
  queryInput.setAttribute("aria-expanded", "false");
  queryInput.removeAttribute("aria-activedescendant");
}

function renderSearchSuggestions(term) {
  const suggestions = document.querySelector("#item-suggestions");
  const queryInput = document.querySelector("#query");
  const clearButton = document.querySelector("#clear-query");
  if (!suggestions || !queryInput) return;

  const options = getMatchingSearchOptions(term);
  clearButton.hidden = !(term || state.query || state.selectedItemKey);

  if (!String(term || "").trim()) {
    hideSearchSuggestions();
    return;
  }

  queryInput.setAttribute("aria-expanded", "true");
  suggestions.hidden = false;

  if (!options.length) {
    suggestions.innerHTML = '<div class="search-empty">No matching items</div>';
    queryInput.removeAttribute("aria-activedescendant");
    return;
  }

  highlightedSuggestionIndex = Math.max(0, Math.min(highlightedSuggestionIndex, options.length - 1));
  queryInput.setAttribute("aria-activedescendant", `search-option-${highlightedSuggestionIndex}`);
  suggestions.innerHTML = options
    .map(
      (option, index) => `
        <button
          class="search-option ${index === highlightedSuggestionIndex ? "active" : ""}"
          id="search-option-${index}"
          type="button"
          role="option"
          aria-selected="${index === highlightedSuggestionIndex}"
          data-item-key="${escapeHtml(option.key)}"
        >
          <span>${escapeHtml(option.itemName)}</span>
          <small>per ${escapeHtml(option.baseUnit)}</small>
        </button>
      `,
    )
    .join("");
}

function selectSearchOption(itemKey) {
  const option = getSearchOptions().find((entry) => entry.key === itemKey);
  if (!option) return;

  state.selectedItemKey = option.key;
  state.query = option.itemName;
  searchDraft = option.itemName;
  highlightedSuggestionIndex = 0;
  saveState();
  render({ restoreFocus: "query", selectionStart: option.itemName.length });
}

function clearSearchFilter() {
  state.selectedItemKey = null;
  state.query = "";
  searchDraft = "";
  highlightedSuggestionIndex = 0;
  saveState();
  render({ restoreFocus: "query", selectionStart: 0 });
}

function clearInvalidSearchFilter() {
  if (!state.selectedItemKey || getSearchOptions().some((option) => option.key === state.selectedItemKey)) return;
  state.selectedItemKey = null;
  state.query = "";
  searchDraft = "";
}

function renderSeller(seller, index) {
  const offers = parsePriceList(seller.text, seller.name);
  const isExpanded = state.expandedSellerId === seller.id;
  return `
    <article class="seller-card ${isExpanded ? "expanded" : ""}" data-seller-id="${escapeHtml(seller.id)}">
      <div class="seller-header">
        <span class="seller-index">${index + 1}</span>
        <button class="seller-toggle" type="button" aria-expanded="${isExpanded}" aria-label="${isExpanded ? "Hide" : "Show"} input for ${escapeHtml(seller.name)}">
          <strong>${escapeHtml(seller.name)}</strong>
          <span>${isExpanded ? "Hide input" : "View input"}</span>
        </button>
        <span class="parsed-badge">${offers.length} offers</span>
        <button class="text-button remove-seller" type="button">Remove</button>
      </div>
      ${isExpanded ? `
        <div class="seller-edit-row">
          <label>
            <span>Seller name</span>
            <input class="seller-name" value="${escapeHtml(seller.name)}" aria-label="Seller name" />
          </label>
        </div>
        <textarea class="seller-text" spellcheck="false" aria-label="Price list for ${escapeHtml(seller.name)}">${escapeHtml(seller.text)}</textarea>
        <div class="seller-tools">
          <button class="secondary compact clear-input" type="button">Clear input</button>
        </div>
        <div class="file-row">
          <label class="file-button">
            Attach txt/csv/pdf
            <input class="seller-file" type="file" accept=".txt,.csv,.pdf" multiple />
          </label>
          <div class="file-status">${renderFileStatus(seller.files)}</div>
        </div>
      ` : ""}
    </article>
  `;
}

function normalizeFileRecord(file) {
  if (typeof file === "string") {
    return {
      name: file,
      status: "attached",
      detail: "Attached before file-status tracking was added.",
    };
  }
  return {
    name: file?.name || "Unknown file",
    status: file?.status || "attached",
    detail: file?.detail || "Attached.",
  };
}

function renderFileStatus(files = []) {
  const records = files.map(normalizeFileRecord);
  if (!records.length) {
    return '<span class="file-help">TXT, CSV, and WhatsApp text exports are imported immediately. PDFs are imported when readable text can be extracted.</span>';
  }

  return `
    <ul class="file-list">
      ${records.map((file, index) => `
        <li class="file-item ${escapeHtml(file.status)}" data-file-index="${index}">
          <div class="file-item-heading">
            <strong>${escapeHtml(file.name)}</strong>
            <button class="text-button remove-file" type="button">Remove</button>
          </div>
          <span>${escapeHtml(file.detail)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderOfferPill(offer, comparison, isBestPrice, isChosen) {
  const bestPriceLabel = comparison.hasBestPriceTie ? "Same price" : "Cheapest";
  if (state.showOnlyWinners && !isBestPrice && !isChosen) return "";
  const confidence = confidenceLabel(offer.confidence);
  return `
    <button
      class="offer-pill offer-choice ${isBestPrice ? "winner" : ""} ${isChosen ? "chosen" : ""}"
      type="button"
      data-comparison-key="${escapeHtml(comparison.key)}"
      data-offer-id="${escapeHtml(offer.id)}"
      aria-pressed="${isChosen}"
      title="Use this offer in the shopping plan"
    >
      <strong>${escapeHtml(offer.sellerName)}</strong>
      ${formatOfferPrice(offer)}
      ${isBestPrice ? `<span class="offer-tag">${bestPriceLabel}</span>` : ""}
      ${confidence === "High" ? "" : `<em class="${confidenceClass(offer.confidence)}">${confidence}</em>`}
    </button>
  `;
}

function renderSelectionCell(key, selectedKeys) {
  const checked = selectedKeys.has(key) ? "checked" : "";
  return `
    <label class="row-selector" title="Include in shopping plan">
      <input class="item-select" type="checkbox" data-comparison-key="${escapeHtml(key)}" ${checked} />
      <span class="visually-hidden">Include in shopping plan</span>
    </label>
  `;
}

function renderComparison(comparison, selectedKeys) {
  const isSelected = selectedKeys.has(comparison.key);
  const selectedOffer = comparison.best;
  return `
    <tr class="${isSelected ? "selected-row" : ""}">
      <td>${renderSelectionCell(comparison.key, selectedKeys)}</td>
      <td>
        <strong>${escapeHtml(comparison.itemName)}</strong>
        <span class="muted">per ${escapeHtml(comparison.baseUnit)}</span>
      </td>
      <td class="price">${formatOfferPrice(selectedOffer)}</td>
      <td class="offers-cell">
        <div class="offers-list">
          ${comparison.offers
            .map((offer) => renderOfferPill(offer, comparison, comparison.bestOffers.some((bestOffer) => bestOffer.id === offer.id), isSelected && offer.id === selectedOffer.id))
            .join("")}
        </div>
      </td>
      <td class="saving-cell">${comparison.savingsVsWorst > 0 ? formatMoney(comparison.savingsVsWorst, comparison.best.currency) : "-"}</td>
    </tr>
  `;
}

function renderComparisonTable(comparisons, selectedKeys) {
  return `
    <thead>
      <tr>
        <th>Plan</th>
        <th>Item</th>
        <th>Plan unit price</th>
        <th>All seller offers</th>
        <th>Potential saving</th>
      </tr>
    </thead>
    <tbody>
      ${comparisons.length ? comparisons.map((comparison) => renderComparison(comparison, selectedKeys)).join("") : renderEmptyRows("No matching offers yet. Paste a seller price list on the left.", 5)}
    </tbody>
  `;
}

function renderSingleSellerTable(offers, selectedKeys) {
  return `
    <thead>
      <tr>
        <th>Plan</th>
        <th>Item</th>
        <th>Unit price</th>
        <th>Parsed from</th>
        <th>Confidence</th>
      </tr>
    </thead>
    <tbody>
      ${offers.length ? offers.map((offer) => renderSingleSellerOffer(offer, selectedKeys)).join("") : renderEmptyRows("Paste a seller price list on the left to see parsed items.", 5)}
    </tbody>
  `;
}

function renderSingleSellerOffer(offer, selectedKeys) {
  const key = `${offer.itemKey}:${offer.baseUnit}`;
  const isSelected = selectedKeys.has(key);
  return `
    <tr class="${isSelected ? "selected-row" : ""}">
      <td>${renderSelectionCell(key, selectedKeys)}</td>
      <td>
        <strong>${escapeHtml(offer.itemName)}</strong>
        <span class="muted">per ${escapeHtml(offer.baseUnit)}</span>
      </td>
      <td class="price">${formatOfferPrice(offer)}</td>
      <td>
        <span class="source-line">${escapeHtml(offer.rawLine)}</span>
      </td>
      <td>
        ${confidenceLabel(offer.confidence) === "High" ? '<span class="muted">Looks clear</span>' : `<span class="confidence-badge ${confidenceClass(offer.confidence)}">${confidenceLabel(offer.confidence)}</span>`}
      </td>
    </tr>
  `;
}

function renderPlanSeller(seller) {
  return `
    <article class="plan-card">
      <div class="plan-card-heading">
        <h3>${escapeHtml(seller.sellerName)}</h3>
        <strong>${formatMoney(seller.estimatedTotal, seller.items[0]?.currency || "$")}</strong>
      </div>
      <ul>
        ${seller.items.map((item) => `
          <li>
            <span>${escapeHtml(item.itemName)}</span>
            <strong>${formatOfferPrice(item)}</strong>
          </li>
        `).join("")}
      </ul>
    </article>
  `;
}

function renderEmptyRows(message = "No matching offers yet. Paste a seller price list on the left.", columns = 5) {
  return `
    <tr>
      <td colspan="${columns}">
        <div class="empty">${escapeHtml(message)}</div>
      </td>
    </tr>
  `;
}

function insertTextAtCursor(textarea, text) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const prefix = textarea.value.slice(0, start);
  const suffix = textarea.value.slice(end);
  const separatorBefore = prefix && !prefix.endsWith("\n") ? "\n" : "";
  const separatorAfter = suffix && !text.endsWith("\n") ? "\n" : "";
  textarea.value = `${prefix}${separatorBefore}${text}${separatorAfter}${suffix}`;
}

function isTextImportFile(file) {
  return file.type.startsWith("text/") || /\.(txt|csv|tsv|md|log)$/i.test(file.name);
}

function isPdfFile(file) {
  return /\.pdf$/i.test(file.name) || file.type === "application/pdf";
}

function fileStatusForAttachment(file) {
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    return {
      name: file.name,
      status: "needs-extraction",
      detail: "PDF attached, but no readable text was found. Scanned/photo PDFs are not supported right now.",
    };
  }

  return {
    name: file.name,
    status: "unsupported",
    detail: "File type not imported. Use TXT, CSV, or PDF.",
  };
}

function bindEvents() {
  document.querySelector("#market-date").addEventListener("input", (event) => {
    state.marketDate = event.target.value;
    saveState();
  });

  document.querySelector("#query").addEventListener("input", (event) => {
    searchDraft = event.target.value;
    highlightedSuggestionIndex = 0;
    if (!searchDraft.trim() && (state.query || state.selectedItemKey)) {
      clearSearchFilter();
      return;
    }
    renderSearchSuggestions(searchDraft);
  });

  document.querySelector("#query").addEventListener("focus", (event) => {
    searchDraft = event.target.value;
    renderSearchSuggestions(searchDraft);
  });

  document.querySelector("#query").addEventListener("keydown", (event) => {
    const matches = getMatchingSearchOptions(searchDraft);
    if (!matches.length) {
      if (event.key === "Escape") hideSearchSuggestions();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightedSuggestionIndex = (highlightedSuggestionIndex + 1) % matches.length;
      renderSearchSuggestions(searchDraft);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightedSuggestionIndex = (highlightedSuggestionIndex - 1 + matches.length) % matches.length;
      renderSearchSuggestions(searchDraft);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectSearchOption(matches[highlightedSuggestionIndex]?.key);
    } else if (event.key === "Escape") {
      hideSearchSuggestions();
    }
  });

  document.querySelector("#item-suggestions").addEventListener("click", (event) => {
    const option = event.target.closest(".search-option");
    if (!option) return;
    selectSearchOption(option.dataset.itemKey);
  });

  document.querySelector("#clear-query").addEventListener("click", () => {
    clearSearchFilter();
  });

  document.querySelector("#unit-filter").addEventListener("change", (event) => {
    state.activeUnit = event.target.value;
    clearInvalidSearchFilter();
    saveState();
    render();
  });

  document.querySelector("#show-only-winners").addEventListener("change", (event) => {
    state.showOnlyWinners = event.target.checked;
    saveState();
    render();
  });

  document.querySelector(".select-visible").addEventListener("click", () => {
    const comparisons = compareOffers(state.sellers);
    const selectedKeys = getSelectedComparisonKeys(comparisons);
    comparisons.forEach((comparison) => selectedKeys.add(comparison.key));
    saveSelectedComparisonKeys(selectedKeys);
    render();
  });

  document.querySelector(".clear-visible").addEventListener("click", () => {
    state.selectedOfferIds = {};
    saveSelectedComparisonKeys(new Set());
    render();
  });

  document.querySelectorAll(".item-select").forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const comparisons = compareOffers(state.sellers);
      const selectedKeys = getSelectedComparisonKeys(comparisons);
      const key = event.target.dataset.comparisonKey;
      if (event.target.checked) {
        selectedKeys.add(key);
      } else {
        selectedKeys.delete(key);
      }
      saveSelectedComparisonKeys(selectedKeys);
      render();
    });
  });

  document.querySelectorAll(".offer-choice").forEach((button) => {
    button.addEventListener("click", (event) => {
      const comparisons = compareOffers(state.sellers);
      const selectedKeys = getSelectedComparisonKeys(comparisons);
      const comparisonKey = event.currentTarget.dataset.comparisonKey;
      const offerId = event.currentTarget.dataset.offerId;

      state.selectedOfferIds = {
        ...(state.selectedOfferIds || {}),
        [comparisonKey]: offerId,
      };
      selectedKeys.add(comparisonKey);
      saveSelectedComparisonKeys(selectedKeys);
      render();
    });
  });

  document.querySelector("#add-seller").addEventListener("click", () => {
    const id = sellerId();
    state.sellers.push({ id, name: `Seller ${state.sellers.length + 1}`, text: "", files: [] });
    state.expandedSellerId = id;
    saveState();
    render();
  });

  document.querySelector("#reset-sample").addEventListener("click", () => {
    state.sellers = getSampleSellers();
    state.expandedSellerId = null;
    state.selectedComparisonKeys = [];
    state.selectedOfferIds = {};
    state.selectedItemKey = null;
    state.query = "";
    searchDraft = "";
    state.activeUnit = "all";
    state.showOnlyWinners = false;
    saveState();
    render();
  });

  document.querySelector("#copy-plan").addEventListener("click", copyPlanText);

  document.querySelectorAll(".seller-card").forEach((card) => {
    const id = card.dataset.sellerId;
    const seller = state.sellers.find((entry) => entry.id === id);
    card.querySelector(".seller-toggle").addEventListener("click", () => {
      state.expandedSellerId = state.expandedSellerId === id ? null : id;
      saveState();
      render();
    });
    card.querySelector(".remove-seller").addEventListener("click", () => {
      state.sellers = state.sellers.filter((entry) => entry.id !== id);
      if (state.expandedSellerId === id) state.expandedSellerId = null;
      clearInvalidSearchFilter();
      saveState();
      render();
    });
    const sellerName = card.querySelector(".seller-name");
    const sellerText = card.querySelector(".seller-text");
    const clearInput = card.querySelector(".clear-input");
    const sellerFile = card.querySelector(".seller-file");

    sellerName?.addEventListener("input", (event) => {
      seller.name = event.target.value || "Unnamed seller";
      saveState();
    });
    sellerText?.addEventListener("input", (event) => {
      seller.text = event.target.value;
      clearInvalidSearchFilter();
      saveState();
      render();
    });
    sellerText?.addEventListener("paste", (event) => {
      const pastedText = event.clipboardData?.getData("text");
      if (!pastedText || !looksLikeWhatsAppText(pastedText)) return;

      event.preventDefault();
      insertTextAtCursor(event.target, cleanWhatsAppText(pastedText));
      seller.text = event.target.value;
      clearInvalidSearchFilter();
      saveState();
      render();
    });
    clearInput?.addEventListener("click", () => {
      seller.text = "";
      state.selectedComparisonKeys = [];
      state.selectedOfferIds = {};
      state.selectedItemKey = null;
      state.query = "";
      searchDraft = "";
      clearInvalidSearchFilter();
      saveState();
      render();
    });
    card.querySelectorAll(".remove-file").forEach((button) => {
      button.addEventListener("click", (event) => {
        const item = event.currentTarget.closest(".file-item");
        const fileIndex = Number(item?.dataset.fileIndex);
        if (!Number.isInteger(fileIndex)) return;
        seller.files = (seller.files || []).map(normalizeFileRecord).filter((_, index) => index !== fileIndex);
        saveState();
        render();
      });
    });
    sellerFile?.addEventListener("change", async (event) => {
      const files = Array.from(event.target.files || []);
      const fileRecords = (seller.files || []).map(normalizeFileRecord);

      for (const file of files) {
        if (isTextImportFile(file)) {
          const cleanedText = cleanWhatsAppText(await file.text());
          const parsedOffers = parsePriceList(cleanedText, seller.name).length;
          if (cleanedText) {
            seller.text = `${seller.text.trim()}\n${cleanedText}`.trim();
          }
          fileRecords.push({
            name: file.name,
            status: parsedOffers ? "imported" : "check-file",
            detail: parsedOffers
              ? `Imported ${parsedOffers} parsed offer${parsedOffers === 1 ? "" : "s"}.`
              : "Imported text, but no price lines were recognized yet.",
          });
        } else if (isPdfFile(file)) {
          const extractedText = await extractTextFromPdfFile(file);
          const cleanedText = cleanWhatsAppText(extractedText);
          const parsedOffers = parsePriceList(cleanedText, seller.name).length;
          if (cleanedText) {
            seller.text = `${seller.text.trim()}\n${cleanedText}`.trim();
          }
          fileRecords.push({
            name: file.name,
            status: parsedOffers ? "imported" : "needs-extraction",
            detail: parsedOffers
              ? `Extracted PDF text and imported ${parsedOffers} parsed offer${parsedOffers === 1 ? "" : "s"}.`
              : "Could not extract recognizable price text. This may be a scanned PDF or encoded font PDF.",
          });
        } else {
          fileRecords.push(fileStatusForAttachment(file));
        }
      }

      seller.files = fileRecords;
      clearInvalidSearchFilter();
      event.target.value = "";
      saveState();
      render();
    });
  });

  document.onmousedown = (event) => {
    if (!event.target.closest(".search-combobox")) hideSearchSuggestions();
  };
}

function getPlanText() {
  const comparisons = compareOffers(state.sellers);
  const selectedKeys = getSelectedComparisonKeys(comparisons);
  const plan = buildShoppingPlan(comparisons.map(withSelectedOffer).filter((comparison) => selectedKeys.has(comparison.key)));

  if (!plan.length) {
    return [`Farmers Market Planner cart for ${state.marketDate}`, "", "No selected items yet."].join("\n");
  }

  const lines = [
    `Farmers Market Planner cart for ${state.marketDate}`,
    "",
    ...plan.flatMap((seller) => [
      seller.sellerName,
      ...seller.items.map((item) => `- ${item.itemName}: ${formatOfferPriceText(item)}`),
      "",
    ]),
  ];

  return lines.join("\n").trimEnd();
}

function showCopyFeedback(message) {
  const button = document.querySelector("#copy-plan");
  if (!button) return;

  button.textContent = message;
  window.setTimeout(() => {
    const currentButton = document.querySelector("#copy-plan");
    if (currentButton) currentButton.textContent = "Copy Cart";
  }, 1600);
}

function showManualCopyBox(text) {
  document.querySelector(".copy-fallback")?.remove();

  const container = document.createElement("div");
  container.className = "copy-fallback";
  container.innerHTML = `
    <div class="copy-fallback-heading">
      <strong>Copy plan text</strong>
      <button class="text-button copy-fallback-close" type="button">Close</button>
    </div>
    <textarea readonly aria-label="Shopping plan text"></textarea>
  `;

  const textarea = container.querySelector("textarea");
  textarea.value = text;
  container.querySelector(".copy-fallback-close").addEventListener("click", () => container.remove());

  const summary = document.querySelector(".plan-summary");
  summary?.insertAdjacentElement("afterend", container);
  textarea.focus();
  textarea.select();
}

async function copyPlanText() {
  const text = getPlanText();

  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback("Copied");
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (copied) {
      showCopyFeedback("Copied");
    } else {
      showCopyFeedback("Select text");
      showManualCopyBox(text);
    }
  }
}

render();

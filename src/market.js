const UNIT_DEFINITIONS = {
  kg: { family: "weight", toBase: 1000, label: "kg", baseLabel: "kg" },
  g: { family: "weight", toBase: 1, label: "g", baseLabel: "kg" },
  lb: { family: "weight", toBase: 453.59237, label: "lb", baseLabel: "kg" },
  l: { family: "volume", toBase: 1000, label: "L", baseLabel: "L" },
  liter: { family: "volume", toBase: 1000, label: "L", baseLabel: "L" },
  ml: { family: "volume", toBase: 1, label: "ml", baseLabel: "L" },
  unit: { family: "count", toBase: 1, label: "unit", baseLabel: "unit" },
  each: { family: "count", toBase: 1, label: "each", baseLabel: "unit" },
  ea: { family: "count", toBase: 1, label: "each", baseLabel: "unit" },
  piece: { family: "count", toBase: 1, label: "piece", baseLabel: "unit" },
  pcs: { family: "count", toBase: 1, label: "piece", baseLabel: "unit" },
  head: { family: "count", toBase: 1, label: "head", baseLabel: "head" },
  bunch: { family: "count", toBase: 1, label: "bunch", baseLabel: "bunch" },
  pack: { family: "count", toBase: 1, label: "pack", baseLabel: "pack" },
  box: { family: "count", toBase: 1, label: "box", baseLabel: "box" },
  dozen: { family: "count", toBase: 12, label: "dozen", baseLabel: "unit" },
};

const UNIT_ALIASES = new Map(
  Object.entries({
    kilogram: "kg",
    kilograms: "kg",
    kilo: "kg",
    kilos: "kg",
    gram: "g",
    grams: "g",
    pound: "lb",
    pounds: "lb",
    lbs: "lb",
    litre: "l",
    litres: "l",
    liters: "liter",
    milliliter: "ml",
    milliliters: "ml",
    millilitre: "ml",
    millilitres: "ml",
    units: "unit",
    item: "unit",
    items: "unit",
    apiece: "each",
    bunches: "bunch",
    heads: "head",
    packs: "pack",
    boxes: "box",
    dz: "dozen",
  }),
);

const ITEM_ALIASES = new Map(
  Object.entries({
    tomato: "tomatoes",
    tomatoes: "tomatoes",
    cucumber: "cucumbers",
    cucumbers: "cucumbers",
    cukes: "cucumbers",
    apple: "apples",
    apples: "apples",
    potato: "potatoes",
    potatoes: "potatoes",
    onion: "onions",
    onions: "onions",
    scallion: "green onions",
    scallions: "green onions",
    "green onion": "green onions",
    carrot: "carrots",
    carrots: "carrots",
    lettuce: "lettuce",
    basil: "basil",
    cilantro: "cilantro",
    parsley: "parsley",
    mint: "mint",
    zucchini: "zucchini",
    squash: "squash",
  }),
);

const HEBREW_ITEM_ALIASES = new Map([
  ["\u05d1\u05d8\u05d8\u05d4", "\u05d1\u05d8\u05d8\u05d4"],
  ["\u05d1\u05d8\u05d8\u05d5\u05ea", "\u05d1\u05d8\u05d8\u05d4"],
  ["\u05e2\u05d2\u05d1\u05e0\u05d9\u05d4", "\u05e2\u05d2\u05d1\u05e0\u05d9\u05d4"],
  ["\u05e2\u05d2\u05d1\u05e0\u05d9\u05d5\u05ea", "\u05e2\u05d2\u05d1\u05e0\u05d9\u05d4"],
  ["\u05de\u05dc\u05e4\u05e4\u05d5\u05df", "\u05de\u05dc\u05e4\u05e4\u05d5\u05df"],
  ["\u05de\u05dc\u05e4\u05e4\u05d5\u05e0\u05d9\u05dd", "\u05de\u05dc\u05e4\u05e4\u05d5\u05df"],
  ["\u05d2\u05d6\u05e8", "\u05d2\u05d6\u05e8"],
  ["\u05d2\u05d6\u05e8\u05d9\u05dd", "\u05d2\u05d6\u05e8"],
  ["\u05ea\u05e4\u05d5\u05d7 \u05d0\u05d3\u05de\u05d4", "\u05ea\u05e4\u05d5\u05d7 \u05d0\u05d3\u05de\u05d4"],
  ["\u05ea\u05e4\u05d5\u05d7\u05d9 \u05d0\u05d3\u05de\u05d4", "\u05ea\u05e4\u05d5\u05d7 \u05d0\u05d3\u05de\u05d4"],
  ["\u05d1\u05e6\u05dc", "\u05d1\u05e6\u05dc"],
  ["\u05d1\u05e6\u05dc\u05d9\u05dd", "\u05d1\u05e6\u05dc"],
  ["\u05d7\u05e1\u05d4", "\u05d7\u05e1\u05d4"],
  ["\u05d7\u05e1\u05d5\u05ea", "\u05d7\u05e1\u05d4"],
  ["\u05e4\u05d8\u05e8\u05d5\u05d6\u05d9\u05dc\u05d9\u05d4", "\u05e4\u05d8\u05e8\u05d5\u05d6\u05d9\u05dc\u05d9\u05d4"],
  ["\u05db\u05d5\u05e1\u05d1\u05e8\u05d4", "\u05db\u05d5\u05e1\u05d1\u05e8\u05d4"],
  ["\u05e0\u05e2\u05e0\u05e2", "\u05e0\u05e2\u05e0\u05e2"],
  ["\u05e7\u05d9\u05e9\u05d5\u05d0", "\u05e7\u05d9\u05e9\u05d5\u05d0"],
  ["\u05e7\u05d9\u05e9\u05d5\u05d0\u05d9\u05dd", "\u05e7\u05d9\u05e9\u05d5\u05d0"],
]);

const CURRENCY_CLASS = "$\\u20aa\\u20ac\\u00a3";
const PRICE_PATTERN = new RegExp(`(?:[${CURRENCY_CLASS}]\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(?:[${CURRENCY_CLASS}])?`);
const CURRENCY_PATTERN = new RegExp(`[${CURRENCY_CLASS}]`);
const PRICE_ONLY_PATTERN = new RegExp(`^\\s*(?:[${CURRENCY_CLASS}]\\s*)?\\d+(?:[.,]\\d+)?\\s*(?:[${CURRENCY_CLASS}])?\\s*$`);
const TEXT_LETTER_PATTERN = /[a-zA-Z\u0590-\u05ff]/;
const WHATSAPP_TIMESTAMP_PATTERN =
  /^\s*\[?\d{1,2}[./-]\d{1,2}[./-]\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\]?\s*(?:-\s*)?[^:]{1,80}:\s*/;
const WHATSAPP_NOISE_PATTERN =
  /^(?:forwarded|forwarded many times|message deleted|this message was deleted|image omitted|video omitted|sticker omitted|audio omitted)$/i;
const BINARY_CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/;
const PDF_ARTIFACT_PATTERN = /^(?:Adobe|Microsoft|UCS|C#C.|\/|\?|w\s*x|x\s*a|CMapName|CIDInit)$/i;

function normalizeUnit(unit) {
  const cleaned = String(unit || "")
    .trim()
    .toLowerCase()
    .replace(/[.,:;]+$/g, "");
  const alias = UNIT_ALIASES.get(cleaned) || cleaned;
  return UNIT_DEFINITIONS[alias] ? alias : null;
}

function collapseDuplicateWords(value) {
  const words = String(value || "")
    .split(/\s+/)
    .filter(Boolean);
  return words.filter((word, index) => index === 0 || word !== words[index - 1]).join(" ");
}

function normalizeItemName(rawName) {
  const cleaned = String(rawName || "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\u0590-\u05ff\s-]/gi, " ")
    .replace(/\b(organic|fresh|local|red|yellow|white|sweet|ripe|new)\b/g, " ")
    .replace(/(?:^|\s)(?:מבצע|אורגני|אורגנית|אורגניים|אורגניות)(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const deduped = collapseDuplicateWords(cleaned);

  if (!deduped) return "";
  if (ITEM_ALIASES.has(deduped)) return ITEM_ALIASES.get(deduped);
  if (HEBREW_ITEM_ALIASES.has(deduped)) return HEBREW_ITEM_ALIASES.get(deduped);

  const singular = deduped.endsWith("ies")
    ? `${deduped.slice(0, -3)}y`
    : deduped.endsWith("s") && deduped.length > 3
      ? deduped.slice(0, -1)
      : deduped;

  return ITEM_ALIASES.get(singular) || HEBREW_ITEM_ALIASES.get(singular) || deduped;
}

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseNumber(value) {
  if (!value) return null;
  const parsed = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function detectCurrency(line) {
  const match = String(line).match(CURRENCY_PATTERN);
  if (match?.[0]) return match[0];
  return /[\u0590-\u05ff]/.test(String(line)) ? "₪" : "";
}

function cleanPriceLine(line) {
  return String(line || "")
    .replace(/[\u200e\u200f\u202a-\u202e]/g, "")
    .replace(WHATSAPP_TIMESTAMP_PATTERN, "")
    .replace(/^\s*(?:>|[-*•●▪▫–—])\s*/u, "")
    .replace(/^\p{Extended_Pictographic}+\s*/u, "")
    .replace(/\p{Extended_Pictographic}+/gu, " ")
    .replace(/[*_~`]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+-\s+/g, " ")
    .replace(/\s*:\s*(?=[\d$₪€£])/g, " ")
    .replace(/\bnis\b/gi, "₪")
    .replace(/\bshekel(?:s)?\b/gi, "₪")
    .replace(/\bper\s+kilo(?:gram)?s?\b/gi, "per kg")
    .replace(/\bkilo(?:gram)?s?\b/gi, "kg")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyBinaryLine(line) {
  const text = String(line || "");
  if (!text.trim()) return false;
  if (BINARY_CONTROL_PATTERN.test(text)) return true;

  const extendedBytes = text.match(/[\u0080-\u00ff]/g) || [];
  if (extendedBytes.length && text.length <= 12) return true;
  if (extendedBytes.length && !/[a-zA-Z\u0590-\u05ff]/.test(text)) return true;
  if (text.length > 8 && extendedBytes.length >= 1 && /[^a-zA-Z0-9\u0590-\u05ff\s.,:/=+$₪€£()'"%\-]/.test(text)) {
    return true;
  }
  if (text.trim().startsWith("<") && extendedBytes.length >= 2) return true;
  if (text.length > 24 && extendedBytes.length >= 4) return true;

  const unusual = text.match(/[^a-zA-Z0-9\u0590-\u05ff\s.,:/=+$₪€£()'"%\-]/g) || [];
  return text.length > 24 && (unusual.length / text.length > 0.18 || extendedBytes.length / text.length > 0.04);
}

export function cleanWhatsAppText(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(cleanPriceLine)
    .filter(
      (line) =>
        line &&
        (PRICE_ONLY_PATTERN.test(line) ||
          !(/^[^\u0590-\u05ffa-zA-Z0-9]*$/.test(line) || (line.length <= 3 && !/[\u0590-\u05ff]/.test(line)))) &&
        !PDF_ARTIFACT_PATTERN.test(line) &&
        !isLikelyBinaryLine(line) &&
        !WHATSAPP_NOISE_PATTERN.test(line) &&
        !/^https?:\/\//i.test(line),
    )
    .join("\n");
}

export function looksLikeWhatsAppText(text) {
  const value = String(text || "");
  return (
    WHATSAPP_TIMESTAMP_PATTERN.test(value) ||
    /(?:forwarded|omitted|\p{Extended_Pictographic}|[*_~`]|nis|shekels?)/iu.test(value)
  );
}

function confidenceForLine(line, unit, itemName) {
  let score = 0.55;
  if (unit) score += 0.2;
  if (detectCurrency(line)) score += 0.1;
  if (itemName.length >= 4) score += 0.1;
  if (/\b(per|\/|for|each|kg|g|lb|bunch|head|dozen|pack)\b/i.test(line)) score += 0.05;
  return Math.min(0.98, score);
}

function extractUnitAfterPrice(afterPrice) {
  const explicit = afterPrice.match(/(?:\/|per|each|for)\s*([a-zA-Z]+)/i);
  if (explicit) return normalizeUnit(explicit[1]);
  const plain = afterPrice.match(/\b(kg|g|lb|lbs|pound|liter|litre|l|ml|each|ea|unit|piece|pcs|head|bunch|pack|box|dozen|dz)\b/i);
  return plain ? normalizeUnit(plain[1]) : null;
}

function parseSaleBundleLine(line) {
  const text = String(line);
  const dealPattern = new RegExp(
    `(\\d+(?:[.,]\\d+)?)\\s*(?:=|:|for|x|ב)\\s*(?:[${CURRENCY_CLASS}]\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(?:[${CURRENCY_CLASS}])?`,
    "gi",
  );
  const deals = Array.from(text.matchAll(dealPattern));
  if (deals.length < 2) return [];

  const rawName = text
    .slice(0, deals[0].index)
    .replace(/[/:=\s]+$/g, "")
    .trim();
  if (!rawName) return [];

  return deals
    .map((deal) => ({
      rawName,
      price: parseNumber(deal[2]),
      quantity: parseNumber(deal[1]),
      unit: "unit",
    }))
    .filter((offer) => offer.price && offer.quantity);
}

function parseDealLine(line) {
  const deal = String(line).match(
    new RegExp(
      `^\\s*(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*(?:x|for|/)\\s*(?:[${CURRENCY_CLASS}]\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(?:[${CURRENCY_CLASS}])?(?:\\s*(?:per|/)?\\s*([a-zA-Z]+))?\\s*$`,
      "i",
    ),
  );
  if (!deal) return null;

  const quantity = parseNumber(deal[2]);
  const price = parseNumber(deal[3]);
  const unit = normalizeUnit(deal[4] || "unit");
  if (!quantity || !price || !unit) return null;

  return {
    rawName: deal[1],
    price,
    quantity,
    unit,
  };
}

function parseStandardLine(line) {
  const normalized = String(line)
    .replace(/\s+-\s+/g, " ")
    .replace(/\s+@\s+/g, " ")
    .trim();
  const quantityThenPrice = normalized.match(
    new RegExp(
      `^\\s*(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*(kg|g|lb|lbs|l|liter|litre|ml|each|ea|unit|piece|pcs|head|bunch|pack|box|dozen|dz)\\s+(?:[${CURRENCY_CLASS}]\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(?:[${CURRENCY_CLASS}])?\\s*$`,
      "i",
    ),
  );
  if (quantityThenPrice) {
    return {
      rawName: quantityThenPrice[1],
      price: parseNumber(quantityThenPrice[4]),
      quantity: parseNumber(quantityThenPrice[2]) || 1,
      unit: normalizeUnit(quantityThenPrice[3]) || "unit",
    };
  }

  const priceMatch = normalized.match(PRICE_PATTERN);
  if (!priceMatch) return null;

  const price = parseNumber(priceMatch[1]);
  const beforePrice = normalized.slice(0, priceMatch.index).trim();
  const afterPrice = normalized.slice(priceMatch.index + priceMatch[0].length).trim();
  if (!price) return null;

  if (!beforePrice && TEXT_LETTER_PATTERN.test(afterPrice)) {
    return {
      rawName: afterPrice,
      price,
      quantity: 1,
      unit: extractUnitAfterPrice(afterPrice) || "unit",
    };
  }

  if (!beforePrice) return null;

  const leadingQuantity = beforePrice.match(/(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|g|lb|lbs|l|liter|litre|ml|each|ea|unit|piece|pcs|head|bunch|pack|box|dozen|dz)$/i);
  if (leadingQuantity) {
    return {
      rawName: leadingQuantity[1],
      price,
      quantity: parseNumber(leadingQuantity[2]) || 1,
      unit: normalizeUnit(leadingQuantity[3]) || "unit",
    };
  }

  return {
    rawName: beforePrice,
    price,
    quantity: 1,
    unit: extractUnitAfterPrice(afterPrice) || "unit",
  };
}

function parseLine(line) {
  const saleOffers = parseSaleBundleLine(line);
  if (saleOffers.length) return saleOffers;

  const parsed = parseDealLine(line) || parseStandardLine(line);
  return parsed ? [parsed] : [];
}

function expandColumnPriceLines(lines) {
  const priceOnlyLines = lines.filter((line) => PRICE_ONLY_PATTERN.test(line));
  const itemOnlyLines = lines.filter((line) => !PRICE_PATTERN.test(line) && TEXT_LETTER_PATTERN.test(line));
  const mixedLines = lines.filter((line) => PRICE_PATTERN.test(line) && !PRICE_ONLY_PATTERN.test(line));

  if (mixedLines.length || priceOnlyLines.length < 2 || priceOnlyLines.length !== itemOnlyLines.length) return lines;

  return itemOnlyLines.map((line, index) => `${line} ${priceOnlyLines[index]}`);
}

function normalizeOffer(parsed, sellerName, rawLine) {
  const unitKey = normalizeUnit(parsed.unit) || "unit";
  const definition = UNIT_DEFINITIONS[unitKey] || UNIT_DEFINITIONS.unit;
  const baseQuantity = parsed.quantity * definition.toBase;
  const divisor = definition.family === "weight" || definition.family === "volume" ? baseQuantity / 1000 : baseQuantity;
  const unitPrice = divisor > 0 ? parsed.price / divisor : parsed.price;
  const itemKey = normalizeItemName(parsed.rawName);

  if (!itemKey || !Number.isFinite(unitPrice)) return null;

  return {
    id: `${sellerName}-${itemKey}-${rawLine}`.replace(/\s+/g, "-").toLowerCase(),
    sellerName,
    rawLine,
    rawName: parsed.rawName.trim(),
    itemKey,
    itemName: titleCase(itemKey),
    price: parsed.price,
    quantity: parsed.quantity,
    unit: unitKey,
    baseUnit: definition.baseLabel,
    unitLabel: definition.label,
    unitPrice,
    currency: detectCurrency(rawLine),
    confidence: confidenceForLine(rawLine, unitKey, itemKey),
  };
}

export function parsePriceList(text, sellerName = "Seller") {
  const lines = cleanWhatsAppText(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(item|product|price|prices|list|menu)\b/i.test(line));

  return expandColumnPriceLines(lines)
    .flatMap((line) => parseLine(line).map((parsed) => normalizeOffer(parsed, sellerName, line)))
    .filter(Boolean);
}

export function compareOffers(sellers) {
  const offers = sellers.flatMap((seller) => parsePriceList(seller.text, seller.name));
  const groups = new Map();

  for (const offer of offers) {
    const key = `${offer.itemKey}:${offer.baseUnit}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(offer);
  }

  return Array.from(groups.entries())
    .map(([key, group]) => {
      const sorted = [...group].sort((a, b) => a.unitPrice - b.unitPrice);
      const best = sorted[0];
      const bestOffers = sorted.filter((offer) => Math.abs(offer.unitPrice - best.unitPrice) < 0.0001);
      const spread = sorted.length > 1 ? sorted[sorted.length - 1].unitPrice - best.unitPrice : 0;
      return {
        key,
        itemKey: best.itemKey,
        itemName: best.itemName,
        baseUnit: best.baseUnit,
        offers: sorted,
        best,
        bestOffers,
        hasBestPriceTie: bestOffers.length > 1,
        savingsVsWorst: spread,
      };
    })
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
}

export function buildShoppingPlan(comparisons) {
  const plan = new Map();

  for (const comparison of comparisons) {
    const seller = comparison.best.sellerName;
    if (!plan.has(seller)) {
      plan.set(seller, {
        sellerName: seller,
        items: [],
        estimatedTotal: 0,
      });
    }

    const row = {
      itemName: comparison.itemName,
      baseUnit: comparison.baseUnit,
      unitPrice: comparison.best.unitPrice,
      price: comparison.best.price,
      quantity: comparison.best.quantity,
      unitLabel: comparison.best.unitLabel,
      currency: comparison.best.currency,
    };
    plan.get(seller).items.push(row);
    plan.get(seller).estimatedTotal += comparison.best.price;
  }

  return Array.from(plan.values()).sort((a, b) => a.sellerName.localeCompare(b.sellerName));
}

export function formatMoney(value, currency = "$") {
  const symbol = currency || "$";
  return `${symbol}${Number(value || 0).toFixed(2)}`;
}

export function confidenceLabel(confidence) {
  if (confidence >= 0.85) return "High";
  if (confidence >= 0.7) return "Medium";
  return "Check";
}

export const sampleSellers = [
  {
    id: "green-valley",
    name: "Green Valley Farm",
    text: "Tomatoes ₪12 / kg\nCucumbers ₪7 each\nApples ₪9.50 / kg\nBasil ₪6 per bunch\nLettuce ₪8 per head",
    files: [],
  },
  {
    id: "pleasant-hill",
    name: "Pleasant Hill Produce",
    text: "Tomatoes ₪10/kg\nCucumbers 2 for ₪12\nApples ₪8.90 per kg\nBasil ₪5 / bunch\nLettuce ₪7.50 / head",
    files: [],
  },
  {
    id: "meadow-lane",
    name: "Meadow Lane Gardens",
    text: "Tomatoes ₪11 kg\nCucumbers ₪6 each\nApples ₪10 per kg\nBasil ₪4.50 bunch\nGreen onions ₪5 / bunch",
    files: [],
  },
];

export function getSampleSellers() {
  return sampleSellers.map((seller) => ({
    ...seller,
    files: [...seller.files],
  }));
}

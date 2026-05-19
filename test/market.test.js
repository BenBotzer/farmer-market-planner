import test from "node:test";
import assert from "node:assert/strict";
import { buildShoppingPlan, cleanWhatsAppText, compareOffers, parsePriceList } from "../src/market.js";

test("parses common price list formats", () => {
  const offers = parsePriceList(
    "Tomatoes 12 / kg\nCucumbers 2 for 10\nBasil ₪4.50 bunch\nApples 500g 6",
    "Farm A",
  );

  assert.equal(offers.length, 4);
  assert.equal(offers[0].itemKey, "tomatoes");
  assert.equal(offers[0].unitPrice, 12);
  assert.equal(offers[1].itemKey, "cucumbers");
  assert.equal(offers[1].unitPrice, 5);
  assert.equal(offers[3].baseUnit, "kg");
  assert.equal(offers[3].unitPrice, 12);
});

test("selects the cheapest seller per normalized item and unit", () => {
  const comparison = compareOffers([
    { name: "Farm A", text: "Tomatoes 12 / kg\nBasil 6 bunch" },
    { name: "Farm B", text: "Tomato 10 per kg\nBasil 4.5 / bunch" },
  ]);

  const tomatoes = comparison.find((row) => row.itemKey === "tomatoes");
  const basil = comparison.find((row) => row.itemKey === "basil");

  assert.equal(tomatoes.best.sellerName, "Farm B");
  assert.equal(basil.best.sellerName, "Farm B");
});

test("marks matching lowest prices as a tie", () => {
  const comparison = compareOffers([
    { name: "Farm A", text: "Tomatoes 10 / kg" },
    { name: "Farm B", text: "Tomatoes 10 / kg" },
    { name: "Farm C", text: "Tomatoes 12 / kg" },
  ]);

  assert.equal(comparison.length, 1);
  assert.equal(comparison[0].hasBestPriceTie, true);
  assert.deepEqual(
    comparison[0].bestOffers.map((offer) => offer.sellerName),
    ["Farm A", "Farm B"],
  );
  assert.equal(comparison[0].savingsVsWorst, 2);
});

test("normalizes common Hebrew produce variants", () => {
  const comparison = compareOffers([
    { name: "Farm A", text: "\u05d1\u05d8\u05d8\u05d4 10" },
    { name: "Farm B", text: "\u05d1\u05d8\u05d8\u05d5\u05ea 8" },
  ]);

  assert.equal(comparison.length, 1);
  assert.equal(comparison[0].itemKey, "\u05d1\u05d8\u05d8\u05d4");
  assert.equal(comparison[0].best.sellerName, "Farm B");
});

test("collapses duplicate Hebrew item words", () => {
  const offers = parsePriceList("\u05e4\u05d8\u05e8\u05d5\u05d6\u05d9\u05dc\u05d9\u05d4 \u05e4\u05d8\u05e8\u05d5\u05d6\u05d9\u05dc\u05d9\u05d4 5", "Farm A");

  assert.equal(offers.length, 1);
  assert.equal(offers[0].itemKey, "\u05e4\u05d8\u05e8\u05d5\u05d6\u05d9\u05dc\u05d9\u05d4");
});

test("cleans and parses WhatsApp price messages", () => {
  const message = [
    "[15/05/2026, 08:14] Green Valley Farm: *Friday price list*",
    "Forwarded",
    "🍅 Tomatoes - \u20aa10/kg",
    "🥒 Cucumbers: 2 for \u20aa12",
    "• Basil - 5 nis / bunch",
    "image omitted",
  ].join("\n");

  assert.equal(
    cleanWhatsAppText(message),
    "Friday price list\nTomatoes \u20aa10/kg\nCucumbers 2 for \u20aa12\nBasil 5 \u20aa / bunch",
  );

  const offers = parsePriceList(message, "Green Valley Farm");
  assert.equal(offers.length, 3);
  assert.equal(offers[0].itemKey, "tomatoes");
  assert.equal(offers[1].unitPrice, 6);
  assert.equal(offers[2].baseUnit, "bunch");
});

test("parses sale bundles as multiple offers and picks the best unit price", () => {
  const line = "בוקצוי עלים אורגני מבצע🥬🥬🥬 1=7/ 3=15";
  const offers = parsePriceList(line, "Farm Sale");

  assert.equal(offers.length, 2);
  assert.equal(offers[0].itemKey, "בוקצוי עלים");
  assert.equal(offers[0].unitPrice, 7);
  assert.equal(offers[1].quantity, 3);
  assert.equal(offers[1].price, 15);
  assert.equal(offers[1].unitPrice, 5);
  assert.equal(offers[1].currency, "₪");

  const comparison = compareOffers([{ name: "Farm Sale", text: line }]);
  assert.equal(comparison[0].best.quantity, 3);
  assert.equal(comparison[0].best.unitPrice, 5);

  const plan = buildShoppingPlan(comparison);
  assert.equal(plan[0].estimatedTotal, 15);
});

test("parses OCR-style price-first and two-column lines", () => {
  const priceFirst = parsePriceList("18 עגבניות מגי\n12 עגבניות תמר", "Photo Farm");

  assert.equal(priceFirst.length, 2);
  assert.equal(priceFirst[0].itemKey, "עגבניות מגי");
  assert.equal(priceFirst[0].unitPrice, 18);
  assert.equal(priceFirst[1].itemKey, "עגבניות תמר");
  assert.equal(priceFirst[1].unitPrice, 12);

  const twoColumn = parsePriceList(
    "18\n12\n6\nעגבניות מגי\nעגבניות תמר\nעגבניות לבישול",
    "Column Farm",
  );

  assert.equal(twoColumn.length, 3);
  assert.equal(twoColumn[0].itemKey, "עגבניות מגי");
  assert.equal(twoColumn[1].unitPrice, 12);
  assert.equal(twoColumn[2].itemKey, "עגבניות לבישול");
});

test("ignores binary-looking PDF extraction garbage", () => {
  const offers = parsePriceList("<è×u{úûZ5Îð¤\u0014Æ\u0019¦½O·i¢\u0002é±ìß´£>\u001bÀÝ ÒÌ\u0003\n5²\nAdobe\nUCS");

  assert.equal(offers.length, 0);
});

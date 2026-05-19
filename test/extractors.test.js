import test from "node:test";
import assert from "node:assert/strict";
import { extractTextFromPdfFile } from "../src/extractors.js";

test("extracts literal text from a simple text PDF", async () => {
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 52 >>
stream
BT
/F1 12 Tf
72 720 Td
(Tomatoes 10 / kg) Tj
ET
endstream
endobj
%%EOF`;

  const file = new File([pdf], "prices.pdf", { type: "application/pdf" });
  const text = await extractTextFromPdfFile(file);

  assert.match(text, /Tomatoes 10 \/ kg/);
});

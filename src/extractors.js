function bytesToBinaryString(bytes) {
  let output = "";
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    output += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return output;
}

function binaryStringToBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function decodePdfEscapes(value) {
  return value.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, escape) => {
    if (/^[0-7]/.test(escape)) return String.fromCharCode(Number.parseInt(escape, 8));
    return {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\",
    }[escape] ?? escape;
  });
}

function decodeUtf16Be(bytes) {
  let output = "";
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    output += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
  }
  return output;
}

function decodePdfHexString(hex) {
  const clean = hex.replace(/\s+/g, "");
  const padded = clean.length % 2 ? `${clean}0` : clean;
  const bytes = new Uint8Array(padded.length / 2);
  for (let index = 0; index < padded.length; index += 2) {
    bytes[index / 2] = Number.parseInt(padded.slice(index, index + 2), 16);
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) return decodeUtf16Be(bytes.slice(2));
  return new TextDecoder("windows-1252").decode(bytes);
}

function decodeUnicodeHex(hex) {
  const clean = hex.replace(/\s+/g, "");
  let output = "";
  for (let index = 0; index + 3 < clean.length; index += 4) {
    output += String.fromCodePoint(Number.parseInt(clean.slice(index, index + 4), 16));
  }
  return output;
}

function extractLiteralStrings(source) {
  const strings = [];
  let index = 0;

  while (index < source.length) {
    if (source[index] !== "(") {
      index += 1;
      continue;
    }

    let depth = 1;
    let cursor = index + 1;
    let value = "";

    while (cursor < source.length && depth > 0) {
      const char = source[cursor];
      if (char === "\\") {
        value += char + (source[cursor + 1] || "");
        cursor += 2;
        continue;
      }
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      if (depth > 0) value += char;
      cursor += 1;
    }

    strings.push(decodePdfEscapes(value));
    index = cursor;
  }

  return strings;
}

function extractTextFromPdfSource(source) {
  const text = [];
  const textBlocks = source.match(/BT[\s\S]*?ET/g) || [source];

  for (const block of textBlocks) {
    const literalMatches = extractLiteralStrings(block);
    text.push(...literalMatches);

    for (const match of block.matchAll(/<([0-9a-fA-F\s]{4,})>\s*Tj/g)) {
      text.push(decodePdfHexString(match[1]));
    }
  }

  return text
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseCMap(source) {
  const map = new Map();

  for (const match of source.matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+\[([^\]]+)\]/g)) {
    const start = Number.parseInt(match[1], 16);
    const values = Array.from(match[3].matchAll(/<([0-9a-fA-F]+)>/g));
    values.forEach((value, offset) => {
      map.set((start + offset).toString(16).toUpperCase().padStart(4, "0"), decodeUnicodeHex(value[1]));
    });
  }

  for (const match of source.matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g)) {
    const start = Number.parseInt(match[1], 16);
    const end = Number.parseInt(match[2], 16);
    const codepoint = Number.parseInt(match[3], 16);
    if (end <= start || end - start > 512) continue;

    for (let value = start; value <= end; value += 1) {
      map.set(value.toString(16).toUpperCase().padStart(4, "0"), String.fromCodePoint(codepoint + value - start));
    }
  }

  for (const match of source.matchAll(/^<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>$/gm)) {
    map.set(match[1].toUpperCase(), decodeUnicodeHex(match[2]));
  }

  return map;
}

function bestCMap(sources) {
  const maps = sources.map(parseCMap).filter((map) => map.size);
  return maps.sort((a, b) => b.size - a.size)[0] || new Map();
}

function decodeMappedHex(hex, cmap) {
  const clean = hex.replace(/\s+/g, "").toUpperCase();
  let output = "";

  for (let index = 0; index < clean.length; index += 4) {
    const code = clean.slice(index, index + 4);
    output += cmap.get(code) || "";
  }

  return output;
}

function normalizePdfToken(value) {
  const text = String(value || "").trim();
  if (/[\u0590-\u05ff]/.test(text)) return Array.from(text).reverse().join("").trim();
  return text;
}

function isUsableText(value) {
  const text = String(value || "");
  if (!text.trim()) return false;

  const controlChars = (text.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g) || []).length;
  const replacementChars = (text.match(/\ufffd/g) || []).length;
  const lettersOrNumbers = (text.match(/[a-zA-Z0-9\u0590-\u05ff]/g) || []).length;
  return controlChars / text.length < 0.02 && replacementChars / text.length < 0.02 && lettersOrNumbers > 3;
}

function extractPositionedRows(source, cmap) {
  const blocks = source.match(/BT[\s\S]*?ET/g) || [];
  const rows = [];

  for (const block of blocks) {
    const matrix = block.match(/1 0 0 1\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+Tm/);
    if (!matrix) continue;

    const tokens = Array.from(block.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g))
      .map((match) => decodeMappedHex(match[1], cmap))
      .filter(Boolean);
    if (!tokens.length) continue;

    rows.push({
      x: Number.parseFloat(matrix[1]),
      y: Number.parseFloat(matrix[2]),
      text: normalizePdfToken(tokens.join("")),
    });
  }

  const grouped = [];
  for (const row of rows.sort((a, b) => b.y - a.y || b.x - a.x)) {
    let group = grouped.find((entry) => Math.abs(entry.y - row.y) < 2);
    if (!group) {
      group = { y: row.y, items: [] };
      grouped.push(group);
    }
    group.items.push(row);
  }

  return grouped
    .flatMap((group) => {
      const items = group.items.sort((a, b) => b.x - a.x);
      const textParts = items.filter((item) => /[\u0590-\u05ffA-Za-z]/.test(item.text));
      const numberParts = items.filter((item) => /^\d+(?:[./]\d+)?$/.test(item.text));
      const price = numberParts[numberParts.length - 1]?.text;
      const name = textParts
        .filter((item) => !/^(?:\u05de\u05d7\u05d9\u05e8|\u05d9\u05e8\u05e7\u05d5\u05ea|\u05e4\u05d9\u05e8\u05d5\u05ea|\u05dc\u05e7\u05d2|\u05e7\u05d2|\u05d2\u05e8\u05dd)$/.test(item.text))
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (name && price) return [`${name} ${price}`];
      if (name) return [name];
      return [];
    })
    .filter(Boolean)
    .join("\n");
}

async function inflatePdfStream(streamBytes) {
  if (!("DecompressionStream" in globalThis)) return "";

  try {
    const stream = new Blob([streamBytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    const inflated = await new Response(stream).arrayBuffer();
    return bytesToBinaryString(new Uint8Array(inflated));
  } catch {
    return "";
  }
}

async function extractPdfStreams(source) {
  const extracted = [];
  const streamPattern = /<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;

  for (const match of source.matchAll(streamPattern)) {
    const dictionary = match[1];
    const streamData = match[2];

    if (/FlateDecode/.test(dictionary)) {
      const inflated = await inflatePdfStream(binaryStringToBytes(streamData));
      if (inflated) extracted.push(inflated);
    } else {
      extracted.push(streamData);
    }
  }

  return extracted;
}

export async function extractTextFromPdfFile(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const source = bytesToBinaryString(bytes);
  const streamSources = await extractPdfStreams(source);
  const cmap = bestCMap(streamSources);
  const positionedText = streamSources
    .map((streamSource) => extractPositionedRows(streamSource, cmap))
    .filter(isUsableText)
    .join("\n");

  if (positionedText) return positionedText;

  const text = streamSources
    .map(extractTextFromPdfSource)
    .filter(Boolean)
    .join("\n")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return isUsableText(text) ? text : "";
}

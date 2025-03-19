import { assertEquals, assertExists } from "@std/assert";
import {
  extractNews,
  formatNewsHTML,
  formatNewsText,
  getYesterday,
  parseHTML,
} from "./lib.ts";

// Mock fetch for testing
const originalFetch = globalThis.fetch;
// deno-lint-ignore require-await
async function mockFetch(_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <body>
        <div itemscope="itemscope" itemtype="http://schema.org/Article">
          <time datetime="2024-03-20"></time>
          <h2>Test Headline 1</h2>
          <span itemprop="description">Test Description 1</span>
        </div>
        <div itemscope="itemscope" itemtype="http://schema.org/Article">
          <time datetime="2024-03-20"></time>
          <h2>Test Headline 2</h2>
          <span itemprop="description">Test Description 2</span>
        </div>
        <div itemscope="itemscope" itemtype="http://schema.org/Article">
          <time datetime="2024-03-19"></time>
          <h2>Old News</h2>
          <span itemprop="description">Old Description</span>
        </div>
      </body>
    </html>`,
    { status: 200 },
  );
}

Deno.test("parseHTML should parse HTML string correctly", () => {
  const html = "<html><body><h1>Test</h1></body></html>";
  const doc = parseHTML(html);
  assertExists(doc);
  assertEquals(doc.querySelector("h1")?.textContent, "Test");
});

Deno.test("extractNews should filter and format news items correctly", () => {
  const html = `
    <div itemscope="itemscope" itemtype="http://schema.org/Article">
      <time datetime="2024-03-20"></time>
      <h2>Test Headline</h2>
      <span itemprop="description">Test Description</span>
    </div>
    <div itemscope="itemscope" itemtype="http://schema.org/Article">
      <time datetime="2024-03-19"></time>
      <h2>Old News</h2>
      <span itemprop="description">Old Description</span>
    </div>
  `;
  const doc = parseHTML(html);
  const news = extractNews("2024-03-20", doc);

  assertEquals(news.length, 1);
  assertEquals(news[0].headline, "Test Headline");
  assertEquals(news[0].description, "Test Description");
});

Deno.test("formatNewsHTML should format news items correctly", () => {
  const newsItems = [
    { headline: "Test Headline", description: "Test Description" },
  ];

  const formatted = formatNewsHTML(newsItems);
  assertEquals(
    formatted,
    "<strong>Test Headline</strong><br><p>Test Description</p>",
  );
});

Deno.test("formatNewsText should format news items correctly", () => {
  const newsItems = [
    { headline: "Test Headline", description: "Test Description" },
  ];

  const formatted = formatNewsText(newsItems);
  assertEquals(
    formatted,
    "\n  Test Headline\n  \n  Test Description\n    ",
  );
});

Deno.test("getYesterday should return yesterday's date in YYYY-MM-DD format", () => {
  const today = new Date("2024-03-20");
  const yesterday = getYesterday(today);
  assertEquals(yesterday, "2024-03-19");
});

Deno.test("fetchWebsite integration test", async () => {
  // Replace global fetch with mock
  globalThis.fetch = mockFetch;

  try {
    const html = await fetch("https://example.com");
    const text = await html.text();
    const doc = parseHTML(text);
    const news = extractNews("2024-03-20", doc);

    assertEquals(news.length, 2);
    assertEquals(news[0].headline, "Test Headline 1");
    assertEquals(news[0].description, "Test Description 1");
    assertEquals(news[1].headline, "Test Headline 2");
    assertEquals(news[1].description, "Test Description 2");
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

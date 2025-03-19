import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";
import {
  Element,
  HTMLDocument,
} from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

export async function fetchWebsite(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
  }
  
  export function parseHTML(websiteText: string): HTMLDocument {
    const parser = new DOMParser();
    const doc = parser.parseFromString(websiteText, "text/html");
  
    if (!doc) {
      console.error("Failed to parse HTML");
      Deno.exit(1);
    }
    return doc;
  }
  
  export function extractNews(
    date: string,
    newsHTML: HTMLDocument,
  ): Array<{ headline: string; description: string }> {
    const articleNodes = Array.from(
      newsHTML.querySelectorAll(
        'div[itemscope="itemscope"][itemtype="http://schema.org/Article"]',
      ),
    ) as Element[];
  
    return articleNodes
      .filter((item) => {
        const timeElement = item.querySelector(`time[datetime="${date}"]`);
        return timeElement !== null;
      })
      .map((item) => ({
        headline: item.querySelector("h2")?.textContent?.trim() ||
          "No headline found",
        description:
          item.querySelector('span[itemprop="description"]')?.textContent
            ?.trim() || "No description found",
      }));
  }
  
  export function formatNewsHTML(
    newsItems: Array<{ headline: string; description: string }>,
  ): string {
    return newsItems.map((item) =>
      `<strong>${item.headline}</strong><br><p>${item.description}</p>`
    ).join("\n");
  }
  
  export function formatNewsText(
    newsItems: Array<{ headline: string; description: string }>,
  ): string {
    return newsItems.map((item) => `
  ${item.headline}
  
  ${item.description}
    `).join("\n");
  }
  
  export function getYesterday(date: Date): string {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().slice(0, 10);
  }
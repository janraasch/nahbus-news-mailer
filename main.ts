import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import {
  Element,
  HTMLDocument,
} from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

export function add(a: number, b: number): number {
  return a + b;
}

// TODO: Check for SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM, SMTP_TO
function checkEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    console.error(`Environment variable ${key} is not set`);
    Deno.exit(1);
  }
  return value;
}

async function sendEmail(
  subject: string,
  contentText: string,
  contentHTML: string,
) {
  const client = new SmtpClient();

  const config = {
    hostname: checkEnv("SMTP_HOST"),
    port: parseInt(checkEnv("SMTP_PORT")),
    username: checkEnv("SMTP_USERNAME"),
    password: checkEnv("SMTP_PASSWORD"),
  };

  await client.connectTLS(config);

  await client.send({
    from: checkEnv("SMTP_FROM"),
    to: checkEnv("SMTP_TO"),
    subject: subject,
    content: contentText,
    html: contentHTML,
  });

  await client.close();
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  console.log("Add 2 + 3 =", add(2, 3));
}

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
  date: string,
  newsItems: Array<{ headline: string; description: string }>,
): string {
  return newsItems.map((item) =>
    `<strong>${date} - ${item.headline}</strong><br><p>${item.description}</p>`
  ).join("\n");
}

export function formatNewsText(
  date: string,
  newsItems: Array<{ headline: string; description: string }>,
): string {
  return newsItems.map((item) => `
${date} - ${item.headline}

${item.description}
  `).join("\n");
}

export function getYesterday(date: Date): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

if (import.meta.main) {
  console.log("Fetching website...");
  const url = "https://www.nahbus.de/meldungen-news/news";
  const date = "2025-03-02"; // getYesterday(new Date());
  const websiteText = await fetchWebsite(url);
  const newsHTML = parseHTML(websiteText);
  const newsItems = extractNews(date, newsHTML);

  if (newsItems.length > 0) {
    console.log(`${date} - Found news:`);
    const newsContentHTML = formatNewsHTML(date, newsItems);
    const newsContentText = formatNewsText(date, newsItems);

    // Log to console
    console.log("--------------------------------");
    console.log(newsContentHTML);
    console.log("--------------------------------");
    console.log(newsContentText);
    console.log("--------------------------------");

    // Send email
    try {
      // await sendEmail(`Nahbus News Update - ${date}`, newsContentText, newsContentHTML);
      console.log("Email sent successfully!");
    } catch (error) {
      console.error("Failed to send email:", error);
    }
  } else {
    console.log(`${date} - No news found`);
  }
}

// To-dos
// * Extract non-sideeffecty functions to lib
// * Add tests
// * Download current news as string to fixtures for testing
// * Extract news in one step. Then send email in a second step. So we can make sure we do not log anything to the console on the second step.
// * change permission url to apples mailer
// * Setup secrets in github
// * push to github
// * Add README
// * Setup linting & testing in github
// * ADD LICENSE
// * Add dependabot for deno & add auto-merge


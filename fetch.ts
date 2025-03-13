import { parseHTML, extractNews, getYesterday, fetchWebsite } from "./lib.ts";

if (import.meta.main) {
  const outputPath = Deno.args[0] || "news.json";
  
  console.log("Fetching website...");
  const url = "https://www.nahbus.de/meldungen-news/news";
  const date = "2025-03-12"; // getYesterday(new Date());
  const websiteText = await fetchWebsite(url);
  const newsHTML = parseHTML(websiteText);
  const newsItems = extractNews(date, newsHTML);

  if (newsItems.length > 0) {
    console.log(`${date} - Found news:`);
    await Deno.writeTextFile(outputPath, JSON.stringify({
      date,
      newsItems
    }, null, 2));
    console.log(`News saved to ${outputPath}`);
  } else {
    console.log(`${date} - No news found`);
    // Write empty result to ensure file exists
    await Deno.writeTextFile(outputPath, JSON.stringify({
      date,
      newsItems: []
    }, null, 2));
  }
} 
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { formatNewsHTML, formatNewsText } from "./lib.ts";

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

if (import.meta.main) {
  const inputPath = Deno.args[0] || "news.json";
  
  try {
    const newsData = JSON.parse(await Deno.readTextFile(inputPath));
    const { date, newsItems } = newsData;

    if (newsItems.length === 0) {
      Deno.exit(0); // Exit silently if no news
    }

    const newsContentHTML = formatNewsHTML(date, newsItems);
    const newsContentText = formatNewsText(date, newsItems);

    await sendEmail(
      `Nahbus News Update - ${date}`, 
      newsContentText, 
      newsContentHTML
    );
    
    Deno.exit(0);
  } catch (_error) {
    Deno.exit(1);
  }
} 
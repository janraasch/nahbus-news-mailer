import nodemailer from "npm:nodemailer@6.9.9";
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
  const transporter = nodemailer.createTransport({
    host: checkEnv("SMTP_HOST"),
    port: parseInt(checkEnv("SMTP_PORT")),
    secure: true, // true for 465, false for other ports like 587
    auth: {
      user: checkEnv("SMTP_USERNAME"),
      pass: checkEnv("SMTP_PASSWORD"),
    },
  });

  try {
    console.log("Connecting to SMTP server...");
    await transporter.verify();
    console.log("Connected, sending email...");
    
    await transporter.sendMail({
      from: checkEnv("SMTP_FROM"),
      to: checkEnv("SMTP_TO"),
      subject: subject,
      text: contentText,
      html: contentHTML,
    });
    console.log("Email sent successfully");
  } catch (error) {
    console.error("SMTP Error:", error);
    throw error;
  }
}

if (import.meta.main) {
  const inputPath = Deno.args[0] || "news.json";
  
  try {
    const newsData = JSON.parse(await Deno.readTextFile(inputPath));
    const { date, newsItems } = newsData;

    if (newsItems.length === 0) {
      console.error("No news found");
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
  } catch (error) {
    console.error(error);
    Deno.exit(1);
  }
} 
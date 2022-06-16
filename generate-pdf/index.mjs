import puppeteer from "puppeteer";
import glob from "glob";
import { promisify } from "util";
import path from "path";
import { mkdirSync } from "fs";
import { createServer } from "http";
import handler from "serve-handler";

const PORT = 8125;

console.log("Start Server");
const server = (() =>
  createServer((req, res) =>
    handler(req, res, {
      cleanUrls: true,
      public: "..",
    })
  ).listen(PORT))();

const files = await promisify(glob)("../presentations/*.html");

console.log("Launch Puppeteer");
const browser = await puppeteer.launch();
const printPdfs = files.map(async (file) => {
  console.log(`Create page for ${file}`);
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const filePath = path.resolve(process.cwd(), file);
  console.log(
    `Route to http://localhost:${PORT}/presentations/${path.basename(
      filePath,
      ".html"
    )}?print-pdf`
  );
  await page.goto(
    `http://localhost:${PORT}/presentations/${path.basename(
      filePath,
      ".html"
    )}?print-pdf`,
    {
      waitUntil: "networkidle2",
    }
  );
  console.log("Wait for revealLoaded");
  await page.waitForFunction("window.revealLoaded");

  mkdirSync("../pdfs", { recursive: true });
  console.log("Generate PDF");
  await page.pdf({
    format: "a4",
    path: `../pdfs/${path.basename(filePath, ".html")}.pdf`,
    printBackground: true,
  });
});

await Promise.all(printPdfs);

await browser.close();
server.close();

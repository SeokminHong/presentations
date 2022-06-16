import puppeteer from "puppeteer";
import glob from "glob";
import { promisify } from "util";
import path from "path";
import { mkdirSync } from "fs";
import { createServer } from "http";
import handler from "serve-handler";

const PORT = 8125;

const server = (() =>
  createServer((req, res) =>
    handler(req, res, {
      cleanUrls: true,
      public: "..",
    })
  ).listen(PORT))();

const files = await promisify(glob)("../presentations/*.html");

const browser = await puppeteer.launch();
const printPdfs = files.map(async (file) => {
  const page = await browser.newPage();

  const filePath = path.resolve(process.cwd(), file);
  let res = await page.goto(
    `http://localhost:${PORT}/presentations/${path.basename(
      filePath,
      ".html"
    )}?print-pdf`,
    {
      waitUntil: "networkidle2",
    }
  );

  mkdirSync("../pdfs", { recursive: true });
  await page.pdf({
    format: "a4",
    path: `../pdfs/${path.basename(filePath, ".html")}.pdf`,
    printBackground: true,
  });
});

await Promise.all(printPdfs);

await browser.close();
server.close();

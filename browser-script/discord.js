const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  console.log("Launching browser");
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./User Data",
    // userDataDir: "C:/Users/joely/AppData/Local/Google/Chrome/User Data",
    // executablePath: "../../Program Files/Google/Chrome/Application/chrome.exe",
    args: [
      // "--profile-directory=Default",
      "--no-sandbox",
      "--disabled-setupid-sandbox",
    ],
  });
  const context = browser.defaultBrowserContext();
  const page = await browser.newPage();
  page.setViewport({ width: 700, height: 400 });

  page.goto(
    "https://discord.com/channels/209707792314007552/209707792314007552"
  );

  await page.waitForNetworkIdle();

  // Click "Continue in Browser"
  const buttons = await page.$$("button");
  const lastButton = buttons[buttons.length - 1];
  await lastButton.click();

  await page.waitForNetworkIdle();

  // Find the first text input
  const textInputs = await page.$$("input[type='text']");
  const firstTextInput = textInputs[0];
  // Enter "Hello"
  await firstTextInput.type(process.env.DISCORD_BOT1_EMAIL);

  const passwordInput = await page.$$("input[type='password']");
  const firstPasswordInput = passwordInput[0];
  await firstPasswordInput.type(process.env.DISCORD_BOT1_PASSWORD);

  // press enter
  await page.keyboard.press("Enter");

  // await browser.close();
  // await browser.close();
  // await browser.close();
})();

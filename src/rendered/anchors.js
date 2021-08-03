const reporter = require("../reporter.js");

/**
 * Collect all anchor links within a Puppeteer page
 */
async function main(page) {
  const branch = "rendered.anchors";

  try {
    const anchors = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(`a`)).map((a) => a.href);
    });

    return {
      branch,
      status: "ok",
      list: anchors.map((anchor) => {
        return {
          url: anchor,
        };
      }),
    };
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

const utils = require("./utils.js");
const reporter = require("./reporter.js");
const styles = require("./rendered/styles.js");
const scripts = require("./rendered/scripts.js");
const structure = require("./rendered/structure.js");
const anchors = require("./rendered/anchors.js");

const packageJson = require("../package.json");

const get_screenshots = require("./rendered/screenshots.js");

let agent;

/**
 * Deal with fully rendered page, after Javascript
 */
async function main(browser, url, visits_path, date) {
  const branch = "rendered";

  // Page is the main Puppeteer unit
  const page = await browser.newPage();

  // some useful data about the agent
  agent = {
    name: "Node.js/Puppeteer",
    url: "https://github.com/puppeteer/puppeteer",
    version: packageJson.dependencies.puppeteer,
    browser: await page.browser().version(),
  };

  try {
    // wait for page to complete loading, but not forever
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // // allows console access from within puppeteer instance, useful for debugging
    // page.on("console", (log) => console[log._type](log._text));

    // select elements by XPath for removal
    const element_handles = [
      ...(await page.$x("//script[contains(.,'__wm')]")),
      ...(await page.$x("//script[contains(.,'archive.org')]")),
      ...(await page.$x(
        "//style[contains(.,'margin-top:0 !important;\n  padding-top:0 !important;\n  /*min-width:800px !important;*/')]"
      )),
      ...(await page.$x("//comment()[contains(.,'WAYBACK')]")),
      ...(await page.$x("//comment()[contains(.,'Wayback')]")),
      ...(await page.$x("//comment()[contains(.,'playback timings (ms)')]")),
      ...(await page.$x("//comment()[contains(.,'NOT GONNA FIND ME')]")),
    ];

    // remove them
    for (const handle of element_handles) {
      // try {
        await page.evaluate((el) => el.remove(), handle);
      // } catch (error) {
      //   return reporter.error(error);
      // }
    }

    // remove elements by CSS Selector
    await page.evaluate(() => {
      const css_matches = [
        ...document.querySelectorAll(
          'link[href*="/_static/css/banner-styles.css"]'
        ),
        ...document.querySelectorAll(
          'link[href*="/_static/css/iconochive.css"]'
        ),
        ...document.querySelectorAll("#wm-ipp-base"), // wayback header
        ...document.querySelectorAll('script[src*="wombat.js"]'),
        ...document.querySelectorAll('script[src*="archive.org"]'),
        ...document.querySelectorAll('script[src*="playback.bundle.js"]'),
        ...document.querySelectorAll("#donato"), // wayback donation header
        ...document.querySelectorAll(".optanon-alert-box-wrapper"), // uic cookie overlay

        ...document.querySelectorAll("#NOT-GONNA-FIND-ME"),
      ].forEach((element) => element.remove());
    });

    // get the page's html as text
    const html_rendered = await page.evaluate(
      () => document.documentElement.outerHTML
    );

    return {
      branch,
      status: "ok",
      agent,
      title: await page.title(),
      screenshots: await get_screenshots(page, visits_path),
      structure: await structure(html_rendered, url),
      styles: await styles(html_rendered, url, date),
      scripts: await scripts(html_rendered, url, date),
      anchors: await anchors(page),
      metrics: {
        puppeteer: await page.metrics(),
      },
    };
  } catch (error) {
    return reporter.error(error, branch);
  } finally {
    await page.close();
  }
}

module.exports = main;

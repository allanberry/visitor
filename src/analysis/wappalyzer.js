const Wappalyzer = require("wappalyzer");
// const { analyze } = require("wappalyzer/wappalyzer");

const packageJson = require('../../package.json')
const utils = require('../utils.js');
const reporter = require("../reporter.js");

/**
 * Analyze a web page (URL) with Wappalyzer.
 */
async function main(url) {
  const branch = "analysis.wappalyzer";

  const w = new Wappalyzer({
    browser: "puppeteer",
    debug: false,
    delay: 500,
  });

  try {
    const agent = {
      name: "Node.js/Wappalyzer",
      description:
        "Wappalyzer identifies technologies on websites, including content management systems, ecommerce platforms, JavaScript frameworks, analytics tools and much more.",
      url: "https://github.com/AliasIO/wappalyzer",
      version: packageJson.dependencies.wappalyzer,
    };

    await w.init();
    const headers = {};
    const site = await w.open(url, headers);
    return {
      branch,
      status: "ok",
      agent,
      data: await site.analyze(),
    };
  } catch (error) {
    return reporter.error(error, branch);
  } finally {
    await w.destroy();
  }
}

module.exports = main;

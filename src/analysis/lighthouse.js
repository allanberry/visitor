const light_house = require("lighthouse");

const packageJson = require('../../package.json')
const reporter = require("../reporter.js");

/**
 * Analyze a web page (URL) using Puppeteer and (Google) Lighthouse.
 */
async function main(browser, url) {
  const branch = "analysis.lighthouse";

  try {
    const agent = {
      name: "Node.js/Lighthouse",
      description:
        "Lighthouse analyzes web apps and web pages, collecting modern performance metrics and insights on developer best practices.",
      url: "https://github.com/GoogleChrome/lighthouse",
      version: packageJson.dependencies.lighthouse,
    };

    const opts = {
      port: new URL(browser.wsEndpoint()).port,
      output: "json",
    };
    const config = {
      extends: "lighthouse:default",
      settings: {
        onlyCategories: ["accessibility", "best-practices", "performance"],
        // onlyAudits: ["color-contrast"]
        // logLevel:
        // maxWaitForLoad?: number,
        // auditMode?: true,
        // gatherMode?: true,
      },
    };
    const r = await light_house(url, opts, config);
    const {
      userAgent,
      environment,
      lighthouseVersion,
      fetchTime,
      requestedUrl,
      finalUrl,
      runWarnings,
      configSettings,
      categories,
      ...rest
    } = r.lhr;

    return {
      branch,
      status: "ok",
      agent,
      data: {
        userAgent,
        environment,
        lighthouseVersion,
        fetchTime,
        requestedUrl,
        finalUrl,
        runWarnings,
        configSettings,
        categories,
      },
    };
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

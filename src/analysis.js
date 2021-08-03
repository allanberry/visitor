const lighthouse = require("./analysis/lighthouse.js");
const wappalyzer = require("./analysis/wappalyzer.js");
const builtwith = require("./analysis/builtwith.js");
const analyzeCSS = require("./analysis/analyzecss.js");
const escomplex = require("./analysis/escomplex.js");

const config = require("../config.json");
const reporter = require("./reporter.js");

/**
 * Route analysis requests to submodules.
 * To be honest, this file doesn't really have to exist.  It's here for consistency.
 * Maybe it will be useful someday, e.g. if I ever do my own computational analysis. -AB
 */
async function main(browser, output) {
  const branch = "analysis";

  // const slug = utils.url_date_slug(output.url);

  try {
    return {
      branch,
      status: "ok",
      lighthouse: await lighthouse(browser, output.wayback.url_rendered),
      wappalyzer: await wappalyzer(output.wayback.url_rendered),
      analyzecss: await analyzeCSS(output.rendered.styles),
      escomplex: await escomplex(output.rendered.scripts),

      // builtwith is a paid API, so it is turned off in CONFIG to conserve
      builtwith: config.builtwith
        ? await builtwith(output.wayback.url_rendered)
        : undefined,
    };
  } catch (error) {
    reporter.error(error)
  }
}

module.exports = main;

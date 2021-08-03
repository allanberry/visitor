const cheerio = require("cheerio");
const utils = require("../../utils.js");
const reporter = require("../../reporter.js");

/**
 * extract all internal JS (inside script tags)
 */
async function main(html) {
  const branch = "rendered.scripts.internal_js";

  try {
    const $ = cheerio.load(html);
    return $("script")
      .map(function (i, e) {
        const data = $(this).html();

        if (data.length) {
          return {
            type: "internal",
            selector: utils.get_selector(this),
            length: data.length,
          };
        }
      })
      .get();
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

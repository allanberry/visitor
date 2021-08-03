const cheerio = require("cheerio");

const utils = require("../../utils.js");
const reporter = require("../../reporter.js");

/**
 * extract all internal CSS (in style tags)
 */
function main(html) {
  const branch = "rendered.styles.internal_styles";
  const type = "internal";
  try {
    const $ = cheerio.load(html);

    const output = $("style")
      .map(function (i, e) {
        const data = $(this).html();

        return {
          type,
          selector: utils.get_selector(this),
          length: data.length,
          data,
        };
      })
      .get()

      // remove any style import rules completely wrapped in/deactivated by comments
      .filter((item) => !item.data.match(/^<!--.*-->$/g));

    return output;
  } catch (error) {
    // if (!error.name === "SyntaxError") {
    //   // Bad CSS; can't do anything about it.
    //   utils.log.warn(`styles.internal_styles ${error.name} ${error.message}`);
    // }

    return reporter.error(error, branch);
  }
}

module.exports = main;

const cheerio = require('cheerio');

const utils = require('../../utils.js');
const reporter = require('../../reporter.js');

/**
 * extract all inline CSS (in element tag attributes), convert into standalone style rules, and return as an array of valid CSS rules (strings)
 */
 async function main(html) {
  const branch = "styles.inline_styles";

  const type = "inline";
  try {
    const $ = cheerio.load(html);
    const data = $("*[style]")
      .map(function (i, e) {
        const selector = utils.get_selector(this);
        return `${selector} {${$(this).attr().style}}`;
      })
      .get()
      .reduce((acc, val) => acc + val + "\n", "");

    return {
      type,
      data,
      length: data.length,
    };
  } catch (error) {
    // internal Cheerio parsing error
    // if (!error.name === "SyntaxError") {
    //   utils.log.error(`styles.inline_styles ${error.name} ${error.message}`);
    // }

    return reporter.error(error, branch);
  }
}

module.exports = main;
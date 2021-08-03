const cheerio = require("cheerio");
const axios = require("axios");

const get_wayback = require("../../wayback.js");
const reporter = require("../../reporter.js");

/**
 * extract and fetch all CSS (in link tags)
 */
async function main(html, base_url, date) {
  const branch = "rendered.styles.external_styles"

  const type = "external";
  return await Promise.all(
    linked_css_hrefs(html).map(async (href) => {
      const url = new URL(href, base_url).href;

      // fetch data from Wayback Machine
      const wayback = await get_wayback(url, date);

      try {
        const response = wayback
          ? await axios.get(wayback.url_raw, { timeout: 60000 })
          : undefined;

        if (response) {
          return {
            type,
            url,
            length: response.data.length,
            data: response.data,
          };
        } else {
          throw new Error(`URL not in Wayback Machine`);
        }
      } catch (error) {
        return reporter.error(error, branch);
      }
    })
  );
}

/**
 * extract all external CSS stylesheet hrefs
 */
function linked_css_hrefs(html) {
  const $ = cheerio.load(html);
  return $('link[rel="stylesheet"]')
    .map(function (i, e) {
      return $(this).attr().href;
    })
    .get();
}

module.exports = main;

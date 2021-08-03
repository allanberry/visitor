const axios = require("axios");
const cheerio = require("cheerio");

const utils = require("../../utils.js");
const reporter = require("../../reporter.js");
const get_wayback = require("../../wayback.js");

/**
 * extract and fetch all JS (in link tags)
 */
 async function main(html, base_url, date) {
  const branch = "rendered.scripts.external_js";

  return await Promise.all(
    src_hrefs(html).map(async (href) => {
      const url = new URL(href, base_url).href;

      const wayback = date ? await get_wayback(url, date) : undefined;

      try {
        const response = wayback
          ? await axios.get(wayback.url_raw, { timeout: 60000 })
          : undefined;

        if (response) {
          return {
            branch,
            status: "ok",
            type: "external",
            url,
            length: response.data.length,
            data: response.data,
          };
        } else {
          throw new Error(`URL not in Wayback Machine: ${wayback.url_raw}`);
        }
      } catch (error) {
        // if (
        //   ![
        //     "URL not in Wayback Machine", // I mean, I can add it, but otherwise nothing to do.
        //   ].includes(error.message)
        // ) {
        //   utils.log.error(`scripts.external_js ${error.name} ${error.message}`);
        // }
        return reporter.error(error, branch);
      }
    })
  );
}

/**
 * extract all external js hrefs
 */
 function src_hrefs(html) {
  const branch = "src_hrefs";

  try {
    const $ = cheerio.load(html);
    return $("script[src]")
      .map(function (i, e) {
        return $(this).attr().src;
      })
      .get();
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main
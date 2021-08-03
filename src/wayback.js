const axios = require("axios");
const moment = require("moment");
const utils = require("./utils.js");
const reporter = require("./reporter.js");

/**
 * Get a page from the Internet Archive's Wayback Machine
 */
async function main(url, date) {
  const branch = "wayback";

  try {
    const date_wb = moment.utc(date).format(utils.wayback_format);
    const url_wb = `http://archive.org/wayback/available?url=${url}&timestamp=${date_wb}`;

    // me: "Wayback, do you have the url/date combo I want pretty please??
    const response = await axios.get(url_wb, { timeout: 10000 });

    // wayback: "Well, I might have what you need, or maybe not.  Let me see."
    if (!utils.is_empty(response.data.archived_snapshots)) {
      // wayback: "Here's the closest thing I have.  Will this work?"
      const closest = response.data.archived_snapshots.closest;

      // me: "I think so, let me give it a shot.  Thanks!"
      return {
        branch,
        status: "ok",
        date_available: moment
          .utc(closest.timestamp, utils.wayback_format)
          .format(),
        url_raw: closest.url.replace(
          closest.timestamp,
          `${closest.timestamp}id_`
        ),
        url_rendered: closest.url,
      };
    } else {
      throw Error(`Not in Wayback: ${url_wb}`);
    }
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

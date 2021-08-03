const css = require("css");
const reporter = require("../reporter.js");

const external_styles = require("./styles/external_styles.js");
const internal_styles = require("./styles/internal_styles.js");
const inline_styles = require("./styles/inline_styles.js");

/**
 * Access the styles in HTML.
 */
async function main(html, url, date) {
  const branch = "rendered.styles";

  try {
    let output = {
      branch,
      status: "ok",
      list: await list_styles(html, url, date),
      combined: await combine_styles(html, url),
    };
    output.aggregate = {
      length: output.combined.length,
    };
    return output;
  } catch (error) {
    return reporter.error(error, branch);
  }
}

async function list_styles(html, url, date) {
  const base_url = new URL(url).origin;
  const external = await external_styles(html, base_url, date),
    internal = await internal_styles(html),
    inline = await inline_styles(html);

  const all_arrays = external.concat(internal);
  all_arrays.push(inline);
  return all_arrays;
}

async function combine_styles(html, url) {
  return await (await list_styles(html, url)).reduce((sum, value) => {
    return sum + value.data;
  }, "");
}

module.exports = main;

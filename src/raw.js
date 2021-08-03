const axios = require("axios");
const cheerio = require("cheerio");
const packageJson = require("../package.json");
const reporter = require("./reporter.js");

const agent = {
  name: "Node.js/Axios",
  description: "Promise based HTTP client for the browser and node.js",
  url: "https://github.com/axios/axios",
  version: packageJson.dependencies.axios,
};

async function main(url) {
  const branch = "raw";

  try {
    const response = await axios.get(url, { timeout: 60000 });
    const html = response.data;
    const $ = cheerio.load(html);

    return {
      branch,
      status: "ok",
      agent,
      title: $("head title").text(),
      response: {
        description: "Selected data from the response.",
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      },
      structure: {
        aggregate: {
          elementQty: $("html *").length,
          length: html.length,
        },
      },
    };
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

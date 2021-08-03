const axios = require("axios");

const packageJson = require("../../package.json");
const reporter = require("../reporter.js");
const dotenv = require("dotenv").config();

/**
 * Analyze a web page (URL) with Builtwith.com technology.
 */
async function main(url) {
  const branch = "analysis.builtwith";

  try {
    const agent = {
      name: "Node.js/Axios",
      description: "Promise based HTTP client for the browser and node.js",
      url: "https://github.com/axios/axios",
      version: packageJson.dependencies.axios,
    };

    const builtwith_url = `https://api.builtwith.com/v18/api.json?KEY=${dotenv.parsed.BUILTWITH_KEY}&LOOKUP=${url}`;
    const response = await axios.get(builtwith_url, { timeout: 10000 });

    return {
      branch,
      status: "ok",
      agent,
      data: {
        url: `https://api.builtwith.com/v18/api.json?KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx&LOOKUP=${url}`,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
      },
    };
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

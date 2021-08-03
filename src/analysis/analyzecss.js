const CSSAnalyzer = require("analyze-css");
const packageJson = require("../../package.json");
const reporter = require("../reporter.js");

/**
 * Analyze a set of CSS styles.
 */
async function main(styles) {
  const branch = "analysis.analyzecss";

  try {
    const agent = {
      name: "Node.js/analyze-css",
      description: "CSS selectors complexity and performance analyzer.",
      url: "https://github.com/macbre/analyze-css",
      version: packageJson.dependencies["analyze-css"],
      note:
        "These statistics are for an aggregate of all stylesheets in, or requested by, this page, including libraries.",
    };

    // analyze CSS data.  Collect any errors that occur.
    const errors = [];
    const data = new CSSAnalyzer(styles.combined, (error, results) => {
      if (error) {
        errors.push(error);
      }
      return results;
    });

    console.log({errors})

    // return data, but note if anything went wrong.
    if (errors.length) {
      // reporter.error(error, branch);

      return {
        branch,
        status: "errors",
        errors: errors.map((error) => ({
          name: error.name,
          message: error.message,
        })),
        agent,
        data: data.metrics,
      };
    } else {
      return {
        branch,
        status: "ok",
        agent,
        data: data.metrics,
      };
    }
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

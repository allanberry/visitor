const path = require("path");
const reporter = require("../reporter.js");
const config = require("../../config.json");

/**
 * Collect a set of screenshots for a given Puppeteer page, and write them to visits_path
 */
async function main(page, visits_path) {
  const branch = "rendered.screenshots";

  const dir = config.visits_root + visits_path;
  const viewports = [
    {
      code: "w320",
      width: 320,
      height: 1,
      isLandscape: false,
    },
    {
      code: "w640",
      width: 640,
      height: 1,
      isLandscape: true,
    },
    {
      code: "w1280",
      width: 1280,
      height: 1,
      isLandscape: true,
    },
  ];

  try {
    let paths = [];
    for (const vp of viewports) {
      const path_rel = `${dir}/${vp.code}.png`.replace(config.visits_root, "");
      const path_abs = `${path.resolve(dir)}/${vp.code}.png`;

      // take screenshot
      await page.setViewport(vp);
      await page.screenshot({ path: path_abs, type: "png", fullPage: true });
      paths.push(path_rel);
    }

    return {
      branch,
      status: "ok",
      paths,
    };
  } catch (error) {
    return reporter.error(error, branch);
  }
}

module.exports = main;

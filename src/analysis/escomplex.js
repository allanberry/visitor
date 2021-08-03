const es_complex = require("escomplex");
const packageJson = require('../../package.json')
const reporter = require("../reporter.js");

/**
 * Analyze a set of JavaScript.
 */
async function main(scripts) {
  const branch = "analysis.escomplex";

  try {
    const agent = {
      name: "Node.js/escomplex",
      description:
        "Software complexity analysis of JavaScript abstract syntax trees.",
      url: "https://github.com/escomplex/escomplex",
      version: packageJson.dependencies.escomplex,
      note:
        "These statistics are for an aggregate of all scripts in, or requested by, this page, including libraries.",
    };

    const stats = es_complex.analyse(scripts.combined);

    const data = {
      maintainability: stats.maintainability,
      effort: stats.effort,
      sloc: stats.aggregate.sloc,
      cyclomatic: stats.aggregate.cyclomatic,
      halstead: {
        operators: {
          distinct: stats.aggregate.halstead.operators.distinct,
          total: stats.aggregate.halstead.operators.total,
        },
        operands: {
          distinct: stats.aggregate.halstead.operands.distinct,
          total: stats.aggregate.halstead.operands.total,
        },
        length: stats.aggregate.halstead.length,
        vocabulary: stats.aggregate.halstead.vocabulary,
        difficulty: stats.aggregate.halstead.difficulty,
        volume: stats.aggregate.halstead.volume,
        effort: stats.aggregate.halstead.effort,
        bugs: stats.aggregate.halstead.bugs,
        time: stats.aggregate.halstead.time,
      },
      params: stats.aggregate.params,
      line: stats.aggregate.line,
      cyclomaticDensity: stats.aggregate.cyclomaticDensity,
    };

    return {
      branch,
      status: "ok",
      agent,
      data,
    };
  } catch (error) {
    // if (!error.message.match(/Line [0-9]+: Unexpected/g)) {
    //   // internal ESComplex parsing error; can't do much about it
    //   utils.log.error(`analysis.escomplex ${error.name} ${error.message}`);
    // }

    return reporter.error(error, branch);
  }
}

module.exports = main;

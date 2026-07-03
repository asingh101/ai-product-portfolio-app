const ping = require("./ping");
const analyzeFit = require("./analyzeFit");
const rewriteBullets = require("./rewriteBullets");
const draftCoverLetter = require("./draftCoverLetter");

const REGISTRY = {
  ping,
  analyze_fit: analyzeFit,
  rewrite_bullets: rewriteBullets,
  draft_cover_letter: draftCoverLetter,
};

function getTool(name) {
  return REGISTRY[name] || null;
}

module.exports = { getTool, REGISTRY };

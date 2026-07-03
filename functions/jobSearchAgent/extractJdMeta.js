const { chunkJobDescription, stripBoilerplate, trim } = require("./jdChunks");

const TITLE_HINT =
  /(senior|staff|principal|lead|head|director|manager|engineer|developer|designer|analyst|product|pm|specialist|coordinator|architect)/i;

const ABOUT_SECTION = /about|who we are|our mission|company/i;

function extractJdMeta(jobDescriptionText) {
  const cleaned = trim(stripBoilerplate(jobDescriptionText.replace(/\r\n/g, "\n")), 6000);
  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  let roleTitle = "this role";
  let company = "the company";

  for (const line of lines.slice(0, 10)) {
    if (line.length > 90 || line.length < 4) continue;
    if (/^(requirements|qualifications|responsibilities|about)/i.test(line)) break;
    if (TITLE_HINT.test(line)) {
      roleTitle = line.replace(/\s*[-–|@].*$/, "").replace(/\s+at\s+.+$/i, "").trim();
      break;
    }
  }

  const atMatch = cleaned.match(/\b(?:at|@)\s+([A-Z][A-Za-z0-9&.' -]{2,48})/);
  if (atMatch) {
    company = atMatch[1].replace(/[.,;].*$/, "").trim();
  } else {
    const joinMatch = cleaned.match(/\bjoin\s+([A-Z][A-Za-z0-9&.' -]{2,48})/i);
    if (joinMatch) company = joinMatch[1].replace(/[.,;].*$/, "").trim();
  }

  const chunks = chunkJobDescription(cleaned);
  const aboutChunk = chunks.find((c) => ABOUT_SECTION.test(c.section));
  let companyFocus =
    aboutChunk?.text ||
    chunks.find((c) => c.section === "General")?.text ||
    lines.find((l) => l.length > 40 && l.length < 220) ||
    lines[0] ||
    "building products for their customers";

  companyFocus = companyFocus.replace(/\s+/g, " ").trim().slice(0, 220);

  return { company, roleTitle, companyFocus };
}

module.exports = { extractJdMeta };

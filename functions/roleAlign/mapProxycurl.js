/** Map Proxycurl / EnrichLayer person profile response → internal profile shape */

function trim(str, max) {
  if (typeof str !== "string") return "";
  const t = str.trim();
  if (!max || t.length <= max) return t;
  return t.slice(0, max);
}

function parseBulletsFromDescription(desc) {
  if (!desc || typeof desc !== "string") return [];
  return desc
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-*]+/, "").trim())
    .filter((line) => line.length > 8)
    .slice(0, 5);
}

function extractSkills(data) {
  const skills = [];
  if (Array.isArray(data.skills)) {
    for (const s of data.skills) {
      if (typeof s === "string" && s.trim()) skills.push(s.trim());
      else if (s?.name) skills.push(String(s.name).trim());
    }
  }
  return skills.filter(Boolean).slice(0, 30);
}

function extractProjects(data) {
  const projects = [];
  const acc = data.accomplishments || {};
  const raw = acc.projects || data.projects || [];
  if (Array.isArray(raw)) {
    for (const p of raw) {
      if (!p) continue;
      projects.push({
        title: trim(p.title || p.name || "", 120),
        url: trim(p.url || p.link || "", 300),
      });
    }
  }
  return projects.filter((p) => p.title).slice(0, 10);
}

function hasRealProfilePhoto(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return !lower.includes("ghost") && !lower.includes("default") && !lower.includes("placeholder");
}

function mapProxycurlToProfile(data, linkedInUrl) {
  const experiences = (data.experiences || [])
    .slice(0, 3)
    .map((exp) => ({
      title: trim(exp.title || "", 120),
      company: trim(exp.company || "", 120),
      bullets: parseBulletsFromDescription(exp.description),
    }))
    .filter((r) => r.title || r.company);

  const skills = extractSkills(data);
  const projects = extractProjects(data);

  const hasProfilePhoto = hasRealProfilePhoto(data.profile_pic_url);
  const hasBannerPhoto = Boolean(data.background_cover_image_url?.trim());
  const hasProjects = projects.length > 0;
  const hasExperienceBullets = experiences.some((e) => e.bullets.length > 0);

  const location = [data.city, data.state, data.country_full_name]
    .filter(Boolean)
    .join(", ");

  return {
    profile: {
      linkedInUrl: trim(linkedInUrl, 200),
      targetRoleLabel: "",
      headline: trim(data.headline || "", 220),
      about: trim(data.summary || "", 2600),
      experience: experiences.length
        ? experiences
        : [{ title: "", company: "", bullets: [""] }],
      skills,
      additionalNotes: "",
      projects,
    },
    profileMeta: {
      hasProfilePhoto,
      hasBannerPhoto,
      hasProjects,
      hasExperienceBullets,
      displayName: data.full_name ? trim(data.full_name, 120) : undefined,
      location: location ? trim(location, 120) : undefined,
      fetchSource: "proxycurl",
    },
  };
}

module.exports = { mapProxycurlToProfile };

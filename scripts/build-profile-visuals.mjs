#!/usr/bin/env node
/**
 * Renders a burgundy contribution calendar inspired by the reference profile.
 * Cell fills and all displayed metrics are derived from the public GitHub
 * contribution snapshot. A small animated snake travels across the calendar.
 */
import fs from "node:fs";
import path from "node:path";

const INPUT = process.env.INPUT_PATH || "site/data/contributions.json";
const HERO_PATH = "assets/sameed-hero.svg";
const AVATAR_PATH = "assets/sameed-avatar.png";
const HERO_DARK_OUTPUT = "assets/sameed-hero-dark.svg";
const HERO_LIGHT_OUTPUT = "assets/sameed-hero-light.svg";

function writeHeroThemeVariants() {
  if (!fs.existsSync(HERO_PATH)) return;
  const darkHero = fs.readFileSync(HERO_PATH, "utf8");
  fs.writeFileSync(HERO_DARK_OUTPUT, darkHero, "utf8");
  const lightPalette = {
    "#190B12": "#FFF9FB",
    "#130810": "#F6EDF1",
    "#10070C": "#FFFAFC",
    "#F8F0F3": "#190B12",
    "#B6A3AC": "#67535E",
    "#8F737E": "#7D5C69",
    "#E5B5C7": "#8A234D",
    "#C77B9B": "#A5446B",
    "#701A3D": "#8B204A",
    "#451126": "#EBD7E0",
    "#6C2945": "#C99FB0",
    "#A12556": "#701A3D"
  };
  const lightHero = darkHero.replace(/#[0-9A-Fa-f]{6}/g, (color) => lightPalette[color.toUpperCase()] || color);
  fs.writeFileSync(HERO_LIGHT_OUTPUT, lightHero, "utf8");
  console.log("Wrote light/dark hero variants for GitHub theme preferences.");
}

function embedProfileAvatar() {
  if (!fs.existsSync(AVATAR_PATH) || !fs.existsSync(HERO_PATH)) {
    console.warn("Profile avatar or hero template missing; leaving hero artwork unchanged.");
    return;
  }
  const image = fs.readFileSync(AVATAR_PATH);
  const mime = image[0] === 0x89 && image[1] === 0x50 ? "image/png" : image[0] === 0xff && image[1] === 0xd8 ? "image/jpeg" : "image/png";
  const dataUri = "data:" + mime + ";base64," + image.toString("base64");
  let hero = fs.readFileSync(HERO_PATH, "utf8");
  const imageTag = '<image href="' + dataUri + '" xlink:href="' + dataUri + '" x="850" y="90" width="240" height="240" preserveAspectRatio="xMidYMid slice"/>';
  const imageStart = hero.indexOf("<image href=");
  const imageEnd = imageStart >= 0 ? hero.indexOf("/>", imageStart) : -1;
  if (imageStart >= 0 && imageEnd >= 0) hero = hero.slice(0, imageStart) + imageTag + hero.slice(imageEnd + 2);
  fs.writeFileSync(HERO_PATH, hero, "utf8");
  console.log("Embedded GitHub profile avatar into " + HERO_PATH + ".");
}
const HEATMAP_OUTPUTS = ["assets/contribution-heatmap.svg", "site/assets/img/contribution-heatmap.svg"];
const STATS_OUTPUTS = ["assets/github-stats.svg", "site/assets/img/github-stats.svg"];
const LOGIN = process.env.GH_USERNAME || "Sameedkhan469";
const W = 1200;
const H = 410;
const CELL = 12;
const GAP = 5;
const STEP = CELL + GAP;
const GRID_X = 82;
const GRID_Y = 184;
const COLS = 53;
const PALETTE = ["#1C0C15", "#451126", "#701A3D", "#A12556", "#E5B5C7"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toDate = (iso) => new Date(String(iso).slice(0, 10) + "T00:00:00Z");
const formatDate = (date) => date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + date.getUTCFullYear();
const escapeXml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const writeOutputs = (paths, content) => {
  for (const output of paths) {
    const destination = path.resolve(output);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, "utf8");
    console.log("Wrote " + output);
  }
};

let snapshot = null;
if (fs.existsSync(INPUT)) {
  try {
    snapshot = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  } catch (error) {
    console.warn("Could not parse " + INPUT + ": " + error.message);
  }
}
let days = Array.isArray(snapshot?.days) ? snapshot.days.filter((day) => day && day.date && Number.isFinite(Number(day.count))) : [];
days.sort((a, b) => String(a.date).localeCompare(String(b.date)));
days = days.slice(-COLS * 7);
if (days.length < 300) {
  console.warn("Contribution snapshot is missing or incomplete; leaving heatmap unchanged until a successful refresh.");
  process.exit(0);
}

const first = toDate(days[0].date);
const last = toDate(days[days.length - 1].date);
const offset = first.getUTCDay();
const weekCount = Math.min(COLS, Math.ceil((days.length + offset) / 7));
const pos = (index) => {
  const absolute = index + offset;
  const week = Math.floor(absolute / 7);
  const dow = absolute % 7;
  return { week, dow, x: GRID_X + week * STEP, y: GRID_Y + dow * STEP };
};
const byCell = new Map();
days.forEach((day, index) => {
  const p = pos(index);
  byCell.set(p.week + "-" + p.dow, { ...day, ...p, index });
});

let total = 0;
let activeDays = 0;
let streak = 0;
let longestStreak = 0;
let longestEnd = 0;
let peak = days[0];
days.forEach((day, index) => {
  const count = Math.max(0, Number(day.count || 0));
  total += count;
  if (count > 0) {
    activeDays += 1;
    streak += 1;
    if (streak > longestStreak) {
      longestStreak = streak;
      longestEnd = index;
    }
    if (count > Number(peak.count || 0)) peak = day;
  } else {
    streak = 0;
  }
});
const longestStart = Math.max(0, longestEnd - longestStreak + 1);
const fetchedAt = snapshot?.fetchedAt ? new Date(snapshot.fetchedAt) : last;
const fetched = formatDate(fetchedAt);
const countFormat = (value) => Number(value).toLocaleString("en-US");
const dayTitle = (day) => countFormat(day.count) + " contribution" + (Number(day.count) === 1 ? "" : "s") + " · " + formatDate(toDate(day.date));
const maxCount = Math.max(1, ...days.map((day) => Number(day.count || 0)));
const cellLevel = (day) => {
  if (!day || Number(day.count) <= 0) return 0;
  const level = Number(day.level);
  if (Number.isInteger(level) && level >= 1 && level <= 4) return level;
  const ratio = Number(day.count) / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
};

// Route: down one weekly column, across the bottom, up the next, etc.
const center = (week, row) => [GRID_X + week * STEP + CELL / 2, GRID_Y + row * STEP + CELL / 2];
const route = [];
for (let week = 0; week < weekCount; week += 1) {
  for (let row = 0; row < 7; row += 1) {
    route.push(center(week, week % 2 === 0 ? row : 6 - row));
  }
}
const firstPoint = route[0];
const lastPoint = route[route.length - 1];
route.unshift([firstPoint[0], firstPoint[1] - STEP]);
route.push([lastPoint[0] + STEP, lastPoint[1]]);
const routeD = "M" + route.map((point) => point[0].toFixed(1) + " " + point[1].toFixed(1)).join(" L");
const cellTime = 0.045;
const startDelay = 1.6;
const travelTime = (route.length - 1) * cellTime;
const loopTime = travelTime + 3.5;
const travelFraction = Math.min(0.95, travelTime / loopTime);
const keyIndexForDay = (dayIndex) => {
  const p = pos(dayIndex);
  return p.week * 7 + (p.week % 2 === 0 ? p.dow : 6 - p.dow) + 1;
};

const cells = [];
for (let week = 0; week < weekCount; week += 1) {
  for (let row = 0; row < 7; row += 1) {
    const day = byCell.get(week + "-" + row);
    const level = cellLevel(day);
    const fill = PALETTE[level];
    const x = GRID_X + week * STEP;
    const y = GRID_Y + row * STEP;
    const delay = (0.12 + (week + row * 1.4) * 0.012).toFixed(3);
    const title = day ? dayTitle(day) : "No date in the returned contribution range";
    let eat = "";
    if (day && Number(day.count) > 0) {
      const keyTime = Math.min(0.94, (keyIndexForDay(day.index) * cellTime) / loopTime).toFixed(4);
      eat = "<animate attributeName=\"fill\" dur=\"" + loopTime.toFixed(2) + "s\" begin=\"" + startDelay + "s\" repeatCount=\"indefinite\" calcMode=\"discrete\" keyTimes=\"0;" + keyTime + ";1\" values=\"" + fill + ";" + PALETTE[0] + ";" + PALETTE[0] + "\"/>";
    }
    cells.push("<rect class=\"hm-cell\" style=\"animation-delay:" + delay + "s\" x=\"" + x + "\" y=\"" + y + "\" width=\"" + CELL + "\" height=\"" + CELL + "\" rx=\"3\" fill=\"" + fill + "\"><title>" + escapeXml(title) + "</title>" + eat + "</rect>");
  }
}

const monthLabels = [];
let lastMonth = -1;
days.forEach((day, index) => {
  const month = toDate(day.date).getUTCMonth();
  if (month === lastMonth) return;
  lastMonth = month;
  const p = pos(index);
  const previous = monthLabels[monthLabels.length - 1];
  if (previous && p.week - previous.week < 2) return;
  monthLabels.push({ week: p.week, label: MONTHS[month] });
});
const monthSvg = monthLabels.map((item) => "<text x=\"" + (GRID_X + item.week * STEP) + "\" y=\"" + (GRID_Y - 14) + "\">" + item.label + "</text>").join("");

const stats = [
  ["CONTRIBUTIONS", countFormat(total), MONTHS[first.getUTCMonth()] + " " + first.getUTCFullYear() + " – " + MONTHS[last.getUTCMonth()] + " " + last.getUTCFullYear()],
  ["ACTIVE DAYS", countFormat(activeDays), "of " + days.length + " calendar days"],
  ["LONGEST STREAK", countFormat(longestStreak), "consecutive days"],
  ["BUSIEST DAY", countFormat(peak.count), formatDate(toDate(peak.date))]
];
const heatmapStatsSvg = stats.map((item, index) => {
  const x = 555 + index * 150;
  return "<g transform=\"translate(" + x + " 56)\"><text class=\"hm-mono\" font-size=\"9.5\" letter-spacing=\"1.4\" fill=\"#C77B9B\">" + item[0] + "</text><text class=\"hm-serif\" y=\"42\" font-size=\"33\" fill=\"#F8F0F3\">" + escapeXml(item[1]) + "</text><text class=\"hm-mono\" y=\"61\" font-size=\"9\" fill=\"#B6A3AC\">" + escapeXml(item[2]) + "</text></g>";
}).join("");

const snake = [];
for (let index = 0; index < 9; index += 1) {
  const segment = 8 - index; // tail first, head last
  const size = CELL - segment * 0.72;
  const fill = segment === 0 ? "#F8F0F3" : segment < 3 ? "#E5B5C7" : segment < 6 ? "#C77B9B" : "#A12556";
  const opacity = (1 - segment * 0.06).toFixed(2);
  const begin = (startDelay + segment * cellTime).toFixed(3);
  const eyes = segment === 0
    ? "<circle cx=\"" + (size / 2 - 3.2).toFixed(1) + "\" cy=\"-2\" r=\"1.05\" fill=\"#10070C\"/><circle cx=\"" + (size / 2 - 3.2).toFixed(1) + "\" cy=\"2\" r=\"1.05\" fill=\"#10070C\"/>"
    : "";
  snake.push("<g opacity=\"0\"><animateMotion path=\"" + routeD + "\" rotate=\"auto\" dur=\"" + loopTime.toFixed(2) + "s\" begin=\"" + begin + "s\" repeatCount=\"indefinite\" calcMode=\"linear\" keyPoints=\"0;1;1\" keyTimes=\"0;" + travelFraction.toFixed(4) + ";1\"/><animate attributeName=\"opacity\" values=\"" + opacity + ";0;0\" keyTimes=\"0;" + travelFraction.toFixed(4) + ";1\" calcMode=\"linear\" dur=\"" + loopTime.toFixed(2) + "s\" begin=\"" + begin + "s\" repeatCount=\"indefinite\"/><rect x=\"" + (-size / 2).toFixed(1) + "\" y=\"" + (-size / 2).toFixed(1) + "\" width=\"" + size.toFixed(1) + "\" height=\"" + size.toFixed(1) + "\" rx=\"" + (size / 2.5).toFixed(1) + "\" fill=\"" + fill + "\"/>" + eyes + "</g>");
}
const legendX = 1033;
const legend = PALETTE.map((color, index) => "<rect x=\"" + (legendX + index * 18) + "\" y=\"382\" width=\"12\" height=\"11\" rx=\"3\" fill=\"" + color + "\"/>").join("");
const firstStreakDate = longestStreak > 0 ? formatDate(toDate(days[longestStart].date)).toUpperCase() : "";
const lastStreakDate = longestStreak > 0 ? formatDate(toDate(days[longestEnd].date)).toUpperCase() : "";
const streakText = longestStreak > 1
  ? "LONGEST STREAK · " + longestStreak + " DAYS · " + firstStreakDate + " – " + lastStreakDate
  : "KEEP BUILDING — EACH COMMIT ADDS TO THE RECORD";

const heatmapSvg = [
"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + W + " " + H + "\" width=\"" + W + "\" height=\"" + H + "\" role=\"img\" aria-labelledby=\"hm-title hm-desc\">",
"<title id=\"hm-title\">GitHub contribution heatmap for @" + escapeXml(snapshot.login || LOGIN) + "</title>",
"<desc id=\"hm-desc\">" + countFormat(total) + " contributions from " + formatDate(first) + " to " + formatDate(last) + ". " + activeDays + " active days, longest streak " + longestStreak + " days, busiest day " + countFormat(peak.count) + " contributions on " + formatDate(toDate(peak.date)) + ". Snapshot refreshed " + fetched + ".</desc>",
"<defs><linearGradient id=\"hm-bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#190B12\"/><stop offset=\"1\" stop-color=\"#10070C\"/></linearGradient><radialGradient id=\"hm-light\" cx=\"88%\" cy=\"0%\" r=\"70%\"><stop stop-color=\"#701A3D\" stop-opacity=\".55\"/><stop offset=\"1\" stop-color=\"#451126\" stop-opacity=\"0\"/></radialGradient><filter id=\"hm-glow\" x=\"-60%\" y=\"-60%\" width=\"220%\" height=\"220%\"><feGaussianBlur stdDeviation=\"2.2\" result=\"blur\"/><feMerge><feMergeNode in=\"blur\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter></defs>",
"<style>.hm-serif{font-family:Georgia,\"Iowan Old Style\",\"Palatino Linotype\",\"Times New Roman\",serif}.hm-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,\"Liberation Mono\",monospace}.hm-cell{transform-box:fill-box;transform-origin:center;animation:hm-pop .72s cubic-bezier(.34,1.56,.64,1) both}.hm-fade{animation:hm-fade 1.1s ease both}@keyframes hm-pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:none}}@keyframes hm-fade{from{opacity:0}to{opacity:1}}@media(prefers-reduced-motion:reduce){.hm-cell,.hm-fade{animation:none}.hm-motion{display:none}}</style>",
"<rect width=\"" + W + "\" height=\"" + H + "\" rx=\"20\" fill=\"url(#hm-bg)\"/><rect width=\"" + W + "\" height=\"" + H + "\" rx=\"20\" fill=\"url(#hm-light)\"/><rect x=\".5\" y=\".5\" width=\"" + (W - 1) + "\" height=\"" + (H - 1) + "\" rx=\"19.5\" fill=\"none\" stroke=\"#C77B9B\" stroke-opacity=\".2\"/>",
"<g class=\"hm-fade\"><text class=\"hm-mono\" x=\"54\" y=\"40\" font-size=\"10.5\" letter-spacing=\"2.2\" fill=\"#C77B9B\">COMMIT LOG · REAL GITHUB ACTIVITY</text><text class=\"hm-serif\" x=\"52\" y=\"80\" font-size=\"26\" fill=\"#F8F0F3\">A year of building, <tspan font-style=\"italic\" fill=\"#E5B5C7\">one square</tspan> at a time.</text>" + heatmapStatsSvg + "</g>",
"<g class=\"hm-mono\" font-size=\"10\" fill=\"#B6A3AC\">" + monthSvg + "</g>",
"<g class=\"hm-mono\" font-size=\"9.5\" fill=\"#B6A3AC\" text-anchor=\"end\"><text x=\"" + (GRID_X - 12) + "\" y=\"" + (GRID_Y + STEP + 8) + "\">Mon</text><text x=\"" + (GRID_X - 12) + "\" y=\"" + (GRID_Y + 3 * STEP + 8) + "\">Wed</text><text x=\"" + (GRID_X - 12) + "\" y=\"" + (GRID_Y + 5 * STEP + 8) + "\">Fri</text></g>",
"<g>" + cells.join("\n") + "</g><g class=\"hm-motion\" filter=\"url(#hm-glow)\">" + snake.join("\n") + "</g>",
"<g class=\"hm-fade\"><text class=\"hm-mono\" x=\"" + GRID_X + "\" y=\"" + (GRID_Y + 7 * STEP + 23) + "\" font-size=\"10.5\" letter-spacing=\"1.25\" fill=\"#E5B5C7\">" + escapeXml(streakText) + "</text><text class=\"hm-mono\" x=\"54\" y=\"393\" font-size=\"9.5\" fill=\"#8F737E\">Source: public GitHub contribution calendar for @" + escapeXml(snapshot.login || LOGIN) + " · refreshed " + escapeXml(fetched) + "</text><text class=\"hm-mono\" x=\"990\" y=\"393\" font-size=\"9.5\" fill=\"#B6A3AC\">Less</text>" + legend + "<text class=\"hm-mono\" x=\"1142\" y=\"393\" font-size=\"9.5\" fill=\"#B6A3AC\">More</text></g></svg>"
].join("\n");
writeOutputs(HEATMAP_OUTPUTS, heatmapSvg);
embedProfileAvatar();
writeHeroThemeVariants();

async function getRepoStats() {
  const headers = { "Accept": "application/vnd.github+json", "User-Agent": "sameed-profile-visuals" };
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = "Bearer " + token;
  const response = await fetch("https://api.github.com/users/" + LOGIN + "/repos?per_page=100&sort=updated", { headers });
  if (!response.ok) throw new Error("GitHub repository API returned HTTP " + response.status);
  const repositories = await response.json();
  if (!Array.isArray(repositories)) throw new Error("GitHub repository API did not return an array");
  const publicRepos = repositories.filter((repo) => !repo.private && !repo.fork);
  return {
    repositories: publicRepos.length,
    stars: publicRepos.reduce((sum, repo) => sum + Number(repo.stargazers_count || 0), 0),
    forks: publicRepos.reduce((sum, repo) => sum + Number(repo.forks_count || 0), 0)
  };
}

let repoStats = null;
try {
  repoStats = await getRepoStats();
} catch (error) {
  console.warn("Could not refresh repository stats: " + error.message);
}
const statsValues = [
  ["PUBLIC REPOS", repoStats ? countFormat(repoStats.repositories) : "—", "non-fork repositories"],
  ["STARS", repoStats ? countFormat(repoStats.stars) : "—", "stars across public repos"],
  ["FORKS", repoStats ? countFormat(repoStats.forks) : "—", "forks across public repos"],
  ["CONTRIBUTIONS", countFormat(total), "in the displayed calendar"],
  ["ACTIVE DAYS", countFormat(activeDays), "in the displayed calendar"]
];
const cards = statsValues.map((item, index) => {
  const x = 42 + index * 232;
  return "<g transform=\"translate(" + x + " 91)\"><text class=\"sm-mono\" font-size=\"10\" letter-spacing=\"1.4\" fill=\"#C77B9B\">" + item[0] + "</text><text class=\"sm-serif\" x=\"0\" y=\"47\" font-size=\"36\" fill=\"#F8F0F3\">" + escapeXml(item[1]) + "</text><text class=\"sm-mono\" x=\"0\" y=\"70\" font-size=\"10\" fill=\"#B6A3AC\">" + escapeXml(item[2]) + "</text></g>";
}).join("");
const profileStatsSvg = [
"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1200 210\" width=\"1200\" height=\"210\" role=\"img\" aria-labelledby=\"stats-title stats-desc\">",
"<title id=\"stats-title\">GitHub at a glance for @" + escapeXml(LOGIN) + "</title><desc id=\"stats-desc\">Public repository count, stars, forks and contribution calendar metrics. Statistics refreshed " + escapeXml(fetched) + ".</desc>",
"<defs><linearGradient id=\"sm-bg\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#190B12\"/><stop offset=\"1\" stop-color=\"#10070C\"/></linearGradient><radialGradient id=\"sm-light\"><stop stop-color=\"#701A3D\" stop-opacity=\".35\"/><stop offset=\"1\" stop-color=\"#10070C\" stop-opacity=\"0\"/></radialGradient></defs>",
"<style>.sm-serif{font-family:Georgia,\"Iowan Old Style\",\"Palatino Linotype\",\"Times New Roman\",serif}.sm-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,\"Liberation Mono\",monospace}@media(prefers-reduced-motion:reduce){.sm-pulse{animation:none}}</style>",
"<rect width=\"1200\" height=\"210\" rx=\"18\" fill=\"url(#sm-bg)\"/><rect width=\"1200\" height=\"210\" rx=\"18\" fill=\"url(#sm-light)\"/><rect x=\".5\" y=\".5\" width=\"1199\" height=\"209\" rx=\"17.5\" fill=\"none\" stroke=\"#C77B9B\" stroke-opacity=\".25\"/>",
"<text class=\"sm-mono\" x=\"42\" y=\"40\" font-size=\"10.5\" letter-spacing=\"2.1\" fill=\"#C77B9B\">GITHUB AT A GLANCE · @" + escapeXml(LOGIN) + "</text><text class=\"sm-serif\" x=\"42\" y=\"68\" font-size=\"25\" fill=\"#F8F0F3\">Project work, activity and learning.</text>",
"<path d=\"M42 81H1158\" stroke=\"#451126\"/>" + cards,
"<text class=\"sm-mono\" x=\"42\" y=\"192\" font-size=\"9.5\" fill=\"#8F737E\">Public GitHub API · contribution calendar snapshot " + escapeXml(fetched) + " · values refresh automatically through GitHub Actions.</text></svg>"
].join("\n");
writeOutputs(STATS_OUTPUTS, profileStatsSvg);

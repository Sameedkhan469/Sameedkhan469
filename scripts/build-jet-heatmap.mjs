#!/usr/bin/env node
/**
 * Builds a compact animated jet heatmap from the real contribution snapshot.
 * The jet, bullets and bursts are presentation only; grid colors and target
 * cells come directly from site/data/contributions.json.
 */
import fs from "node:fs";
import path from "node:path";

const INPUT = process.env.INPUT_PATH || "site/data/contributions.json";
const OUTPUTS = ["assets/github-jet.svg", "site/assets/img/github-jet.svg"];
const COLS = 34;
const ROWS = 7;
const CELL = 11;
const STEP = 14;
const GRID_X = 20;
const GRID_Y = 15;
const WIDTH = 513;
const HEIGHT = 170;
const JET_X_START = 35;
const JET_X_END = 478;
const LOOP_DUR = 20;
const MAX_TARGETS = 12;
const PAD_Y = 128;
const EMPTY = "#0D152B";
const FLASH = "#F4F8FF";
const BULLET = "#7DD3FC";
const BLAST = "#60A5FA";
const LEVELS = ["#0D152B", "#1E3A8A", "#4F46E5", "#60A5FA", "#7DD3FC"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toDate = (iso) => new Date(String(iso).slice(0, 10) + "T00:00:00Z");
const isoDate = (date) => date.toISOString().slice(0, 10);
const escapeXml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtNum = (n) => Number(n || 0).toLocaleString("en-US");
const fmtDate = (date) => date.getUTCDate() + " " + MONTHS[date.getUTCMonth()] + " " + date.getUTCFullYear();

if (!fs.existsSync(INPUT)) {
  console.warn("No contribution snapshot at " + INPUT + "; keeping existing jet SVGs.");
  process.exit(0);
}
const snapshot = JSON.parse(fs.readFileSync(INPUT, "utf8"));
if (!Array.isArray(snapshot.days) || snapshot.days.length < 30) {
  console.warn("Contribution snapshot is missing or incomplete; keeping existing jet SVGs.");
  process.exit(0);
}
const allDays = snapshot.days.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
const latest = toDate(allDays[allDays.length - 1].date);
const latestSunday = new Date(latest);
latestSunday.setUTCDate(latest.getUTCDate() - latest.getUTCDay());
const firstSunday = new Date(latestSunday);
firstSunday.setUTCDate(firstSunday.getUTCDate() - (COLS - 1) * 7);
const lookup = new Map(allDays.map((day) => [String(day.date).slice(0, 10), day]));
const cells = [];
for (let col = 0; col < COLS; col += 1) {
  for (let row = 0; row < ROWS; row += 1) {
    const date = new Date(firstSunday);
    date.setUTCDate(firstSunday.getUTCDate() + col * 7 + row);
    const record = lookup.get(isoDate(date));
    const count = Math.max(0, Number(record?.count || 0));
    let level = Number(record?.level || 0);
    if (count > 0 && (!Number.isInteger(level) || level < 1 || level > 4)) {
      const max = Math.max(1, ...allDays.map((d) => Number(d.count || 0)));
      const ratio = count / max;
      level = ratio <= .25 ? 1 : ratio <= .5 ? 2 : ratio <= .75 ? 3 : 4;
    }
    cells.push({
      col, row, x: GRID_X + col * STEP, y: GRID_Y + row * STEP,
      count, date: record?.date || isoDate(date), level: count > 0 ? Math.min(4, Math.max(1, level)) : 0
    });
  }
}
const targets = cells.filter((cell) => cell.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, MAX_TARGETS)
  .sort((a, b) => a.col - b.col || a.row - b.row);
const targetIds = new Set(targets.map((cell) => cell.col + "-" + cell.row));
const fmt = (n) => Number(Number(n).toFixed(4));
function keyTimeForCol(col, direction) {
  const t = 0.02 + (col / (COLS - 1)) * 0.46;
  return direction === "forward" ? t : 1 - t;
}
function buildGrid() {
  return cells.map((cell) => {
    const color = LEVELS[cell.level];
    const title = cell.count + " contribution" + (cell.count === 1 ? "" : "s") + " · " + fmtDate(toDate(cell.date));
    if (!targetIds.has(cell.col + "-" + cell.row)) {
      return '<rect x="' + cell.x + '" y="' + cell.y + '" width="' + CELL + '" height="' + CELL + '" rx="2.4" fill="' + color + '"><title>' + escapeXml(title) + '</title></rect>';
    }
    const tForward = keyTimeForCol(cell.col, "forward");
    const tBackward = keyTimeForCol(cell.col, "backward");
    const t1 = Math.min(tForward, tBackward);
    const t2 = Math.max(tForward, tBackward);
    const dur = 0.006;
    const animation = '<animate attributeName="fill" dur="' + LOOP_DUR + 's" repeatCount="indefinite" calcMode="linear" keyTimes="0;' + fmt(t1) + ';' + fmt(t1 + dur) + ';' + fmt(t2) + ';' + fmt(t2 + dur) + ';1" values="' + color + ';' + color + ';' + FLASH + ';' + color + ';' + FLASH + ';' + color + '"/>';
    return '<rect x="' + cell.x + '" y="' + cell.y + '" width="' + CELL + '" height="' + CELL + '" rx="2.4" fill="' + color + '"><title>' + escapeXml(title) + '</title>' + animation + '</rect>';
  }).join("\n");
}
function buildBulletsAndBlasts() {
  let bullets = "";
  let blasts = "";
  const dur = 0.006;
  for (const direction of ["forward", "backward"]) {
    const ordered = direction === "forward" ? targets : targets.slice().reverse();
    for (const cell of ordered) {
      const t = keyTimeForCol(cell.col, direction);
      const rise = Math.max(0.001, t - dur * 3);
      const arrive = t;
      const fadeEnd = Math.min(.999, t + dur);
      const cx = fmt(cell.x + CELL / 2);
      const cy = fmt(cell.y + CELL / 2);
      bullets += '<circle cx="' + cx + '" cy="' + PAD_Y + '" r="2.1" fill="' + BULLET + '">' +
        '<animate attributeName="cy" dur="' + LOOP_DUR + 's" repeatCount="indefinite" keyTimes="0;' + fmt(rise) + ';' + fmt(arrive) + ';1" values="' + PAD_Y + ';' + PAD_Y + ';' + cy + ';' + cy + '"/>' +
        '<animate attributeName="opacity" dur="' + LOOP_DUR + 's" repeatCount="indefinite" keyTimes="0;' + fmt(rise) + ';' + fmt(arrive) + ';' + fmt(fadeEnd) + ';1" values="0;1;1;0;0"/>' +
        '</circle>';
      blasts += '<circle cx="' + cx + '" cy="' + cy + '" r="0" fill="none" stroke="' + BLAST + '" stroke-width="1.3" opacity="0">' +
        '<animate attributeName="r" dur="' + LOOP_DUR + 's" repeatCount="indefinite" keyTimes="0;' + fmt(arrive) + ';' + fmt(arrive + dur * 3) + ';1" values="0;0;8;8"/>' +
        '<animate attributeName="opacity" dur="' + LOOP_DUR + 's" repeatCount="indefinite" keyTimes="0;' + fmt(arrive) + ';' + fmt(arrive + dur * 3) + ';1" values="0;1;1;0"/>' +
        '</circle>';
    }
  }
  return { bullets, blasts };
}
function buildStars() {
  const points = [[8,20,1.2],[8,60,1.6],[8,100,2.0],[505,25,1.2],[505,70,1.6],[505,110,2.0],[30,164,1.2],[483,164,1.6]];
  return points.map(([x,y,dur]) => '<circle cx="' + x + '" cy="' + y + '" r="1" fill="#60A5FA"><animate attributeName="opacity" values=".15;.85;.15" dur="' + dur + 's" repeatCount="indefinite"/></circle>').join("\n");
}
function buildJet() {
  return '<g id="jet" class="jet-motion">' +
  '<g>' +
  '<polygon points="0,-16 8,6 4,3 -4,3 -8,6" fill="#7DD3FC" stroke="#60A5FA" stroke-width="1"/>' +
  '<polygon points="-8,6 -14,12 -4,7" fill="#60A5FA"/><polygon points="8,6 14,12 4,7" fill="#60A5FA"/>' +
  '<circle cx="0" cy="-6" r="2.1" fill="#F4F8FF"/>' +
  '<polygon points="-3,7 3,7 0,15" fill="#60A5FA"><animate attributeName="opacity" values=".35;1;.5;1" dur=".18s" repeatCount="indefinite"/></polygon>' +
  '</g><animateTransform attributeName="transform" attributeType="XML" type="translate" dur="' + LOOP_DUR + 's" repeatCount="indefinite" keyTimes="0;.5;1" values="' + JET_X_START + ',140;' + JET_X_END + ',140;' + JET_X_START + ',140"/></g>';
}
const totals = cells.reduce((sum, cell) => sum + cell.count, 0);
const active = cells.filter((cell) => cell.count > 0).length;
const dateStart = toDate(firstSunday);
const dateEnd = new Date(firstSunday);
dateEnd.setUTCDate(firstSunday.getUTCDate() + (COLS * 7 - 1));
const flashTargetCount = targets.length;
const { bullets, blasts } = buildBulletsAndBlasts();
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + WIDTH + ' ' + HEIGHT + '" width="' + WIDTH + '" height="' + HEIGHT + '" role="img" aria-labelledby="jet-title jet-desc">' +
'<title id="jet-title">Animated GitHub jet heatmap for @' + escapeXml(snapshot.login || "Sameedkhan469") + '</title>' +
'<desc id="jet-desc">A small jet flies across 34 weeks of real GitHub contribution data for @' + escapeXml(snapshot.login || "Sameedkhan469") + ', targeting ' + flashTargetCount + ' high-activity days. ' + fmtNum(totals) + ' contributions across ' + active + ' active days in the displayed window.</desc>' +
'<defs><linearGradient id="jet-bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#10162B"/><stop offset="1" stop-color="#090E1F"/></linearGradient><radialGradient id="jet-haze" cx="52%" cy="5%" r="90%"><stop stop-color="#4F46E5" stop-opacity=".5"/><stop offset="1" stop-color="#090E1F" stop-opacity="0"/></radialGradient><filter id="jet-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.1" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
'<style>.jet-mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.jet-motion,.jet-bullets,.jet-blasts{isolation:isolate}@media(prefers-reduced-motion:reduce){.jet-motion,.jet-bullets,.jet-blasts,.jet-stars{display:none}}</style>' +
'<rect width="' + WIDTH + '" height="' + HEIGHT + '" rx="12" fill="url(#jet-bg)"/><rect width="' + WIDTH + '" height="' + HEIGHT + '" rx="12" fill="url(#jet-haze)"/><rect x=".5" y=".5" width="' + (WIDTH-1) + '" height="' + (HEIGHT-1) + '" rx="11.5" fill="none" stroke="#60A5FA" stroke-opacity=".32"/>' +
'<text class="jet-mono" x="20" y="9" fill="#60A5FA" font-size="6.5" letter-spacing="1.05">JET HEATMAP · LAST 34 WEEKS · REAL DATA</text>' +
'<g class="jet-stars">' + buildStars() + '</g>' +
'<g id="grid">' + buildGrid() + '</g>' +
'<g id="bullets" class="jet-bullets">' + bullets + '</g>' +
'<g id="blasts" class="jet-blasts" filter="url(#jet-glow)">' + blasts + '</g>' +
buildJet() +
'<path d="M20 157H493" stroke="#1E3A8A" stroke-width=".5"/>' +
'<text class="jet-mono" x="20" y="166" fill="#91A4C6" font-size="6.5">34 WEEKS · ' + fmtNum(totals) + ' CONTRIBUTIONS · ' + active + ' ACTIVE DAYS · ' + flashTargetCount + ' TARGET DAYS</text>' +
'</svg>';
for (const output of OUTPUTS) {
  const destination = path.resolve(output);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.writeFileSync(destination, svg, "utf8");
  console.log("Wrote " + output + " from " + cells.length + " calendar cells; " + fmtNum(totals) + " contributions.");
}

#!/usr/bin/env node
/**
 * Fetch the public GitHub contribution calendar for the profile owner.
 * GraphQL is preferred; the public profile calendar is the unauthenticated
 * fallback. Existing data is never overwritten by a failed or partial fetch.
 */
import fs from "node:fs";
import path from "node:path";

const LOGIN = process.env.GH_USERNAME || "Sameedkhan469";
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const OUTPUT = process.env.OUTPUT_PATH || "site/data/contributions.json";

async function graphQL() {
  if (!TOKEN) throw new Error("No GitHub token was provided");
  const query = "query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount contributionLevel}}}}}}";
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: "bearer " + TOKEN,
      "Content-Type": "application/json",
      "User-Agent": "sameed-profile-contribution-heatmap"
    },
    body: JSON.stringify({ query, variables: { login: LOGIN } })
  });
  if (!response.ok) throw new Error("GraphQL returned HTTP " + response.status);
  const body = await response.json();
  if (body.errors?.length) throw new Error(JSON.stringify(body.errors));
  const calendar = body.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar?.weeks?.length) throw new Error("GraphQL returned no contribution weeks");
  const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  return calendar.weeks.flatMap((week) => week.contributionDays.map((day) => ({
    date: day.date,
    count: Number(day.contributionCount || 0),
    level: levels[day.contributionLevel] ?? 0
  })));
}

async function publicCalendar() {
  const response = await fetch("https://github.com/users/" + LOGIN + "/contributions", {
    headers: { "User-Agent": "sameed-profile-contribution-heatmap" }
  });
  if (!response.ok) throw new Error("Public calendar returned HTTP " + response.status);
  const html = await response.text();
  const tooltipCounts = new Map();
  for (const match of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)</g)) {
    const text = match[2].replace(/&nbsp;/g, " ").trim();
    const count = text.match(/^(\d+)\s+contribution/);
    tooltipCounts.set(match[1], count ? Number(count[1]) : 0);
  }
  const days = [];
  for (const match of html.matchAll(/<td[^>]*class="ContributionCalendar-day"[^>]*>/g)) {
    const tag = match[0];
    const date = tag.match(/data-date="([^"]+)"/)?.[1];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0);
    if (date) days.push({ date, count: tooltipCounts.get(id) ?? 0, level });
  }
  if (days.length < 300) throw new Error("Only parsed " + days.length + " days from the public calendar");
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

async function main() {
  let days;
  let method;
  try {
    days = await graphQL();
    method = "GitHub GraphQL contribution calendar";
  } catch (error) {
    console.warn("GraphQL unavailable (" + error.message + "); trying the public calendar.");
    try {
      days = await publicCalendar();
      method = "public GitHub contribution calendar";
    } catch (fallbackError) {
      console.warn("Contribution refresh failed (" + fallbackError.message + "); keeping the previous snapshot.");
      return;
    }
  }

  if (!Array.isArray(days) || days.length < 300 || days.some((day) => !day.date || !Number.isFinite(day.count))) {
    throw new Error("The contribution response was incomplete; refusing to write a partial snapshot.");
  }
  const snapshot = {
    login: LOGIN,
    source: "https://github.com/" + LOGIN,
    method,
    fetchedAt: new Date().toISOString(),
    days
  };
  fs.mkdirSync(path.dirname(path.resolve(OUTPUT)), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  console.log("Saved " + days.length + " real contribution days for @" + LOGIN + " to " + OUTPUT + ".");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

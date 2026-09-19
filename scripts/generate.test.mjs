import assert from "node:assert/strict";
import { test } from "node:test";
import { cell, compact, describe, render, truncate } from "./generate.mjs";

const entry = (username, kind, category, members, extra = {}) => ({
  username,
  kind,
  category,
  tags: ["free"],
  title: `Title ${username}`,
  description: `About ${username}`,
  descriptionZh: null,
  descriptionEn: null,
  lang: "en",
  verified: false,
  members,
  tgCreatedAt: null,
  listedAt: "2026-09-01T00:00:00.000Z",
  ...extra,
});

const data = {
  version: 1,
  site: "https://tgbox.cc",
  generatedAt: "2026-09-19T08:00:00.000Z",
  stats: { total: 3, channels: 2, groups: 0, bots: 1 },
  categories: [
    { kind: "channel", slug: "tech", nameZh: "科技", nameEn: "Tech", count: 2 },
    { kind: "bot", slug: "tools", nameZh: "工具", nameEn: "Tools", count: 1 },
  ],
  tags: [{ slug: "free", nameZh: "免费", nameEn: "Free", count: 3 }],
  entries: [
    entry("big", "channel", "tech", 120_000, { descriptionZh: "大频道" }),
    entry("small", "channel", "tech", 900, { title: "A | B <script>" }),
    entry("helper", "bot", "tools", null, { listedAt: "2026-09-18T00:00:00.000Z" }),
  ],
};

test("table cells cannot break out of the table or inject HTML", () => {
  assert.equal(cell("a | b\nc <b>*x*</b>"), "a \\| b c \\<b\\>\\*x\\*\\</b\\>");
});

test("truncation counts characters and prefers a word boundary", () => {
  assert.equal(truncate("中文字符串很长很长", 4), "中文字符…");
  assert.equal(truncate("one two three four", 15), "one two three…");
  assert.equal(truncate("one two three four", 12), "one two thre…");
  assert.equal(truncate("short", 10), "short");
});

test("counts are compact in each language", () => {
  assert.equal(compact(120_000, "en"), "120K");
  assert.equal(compact(120_000, "zh"), "12万");
  assert.equal(compact(15_300, "zh"), "1.5万");
  assert.equal(compact(null, "zh"), "—");
});

test("each README reads the description in its own language", () => {
  assert.equal(describe(data.entries[0], "zh"), "大频道");
  assert.equal(describe(data.entries[0], "en"), "About big");
});

test("names link to the detail page of the README's locale", () => {
  const en = render(data, "en");
  const zh = render(data, "zh");
  assert.match(en, /\[Title big\]\(https:\/\/tgbox\.cc\/en\/detail\/big\/\)/);
  assert.match(zh, /\[Title big\]\(https:\/\/tgbox\.cc\/detail\/big\/\)/);
  // The data file has no locale prefix.
  assert.match(en, /https:\/\/tgbox\.cc\/data\/entries\.json/);
  assert.doesNotMatch(en, /\/en\/data\//);
  assert.match(en, /\[A \\\| B \\<script\\>\]/);
});

test("sections follow kind and category, largest first, and skip empty ones", () => {
  const en = render(data, "en");
  assert.ok(en.indexOf("[Title big]") < en.indexOf("[A \\| B"));
  assert.match(en, /- \[Channels\]\(#channel\) \(2\)/);
  assert.doesNotMatch(en, /\(#group\)/);
  assert.match(en, /<a id="bot-tools"><\/a>/);
  assert.match(en, /\[All tools on TGbox →\]\(https:\/\/tgbox\.cc\/en\/bot\/tools\/\)/);
});

test("the Traditional README links the Traditional pages and uses Traditional units", () => {
  const hant = render(data, "zh-hant");
  assert.match(hant, /^# Awesome Telegram 中文資源合集/m);
  assert.match(hant, /\[Title big\]\(https:\/\/tgbox\.cc\/zh-hant\/detail\/big\/\)/);
  assert.match(hant, /https:\/\/tgbox\.cc\/data\/entries\.json/);
  assert.doesNotMatch(hant, /\/zh-hant\/data\//);
  assert.match(hant, /\*\*繁體中文\*\*/);
  assert.equal(compact(120_000, "zh-hant"), "12萬");
  // Every README links the other two.
  assert.match(render(data, "en"), /\[繁體中文\]\(README\.zh-Hant\.md\)/);
  assert.match(render(data, "zh"), /\[繁體中文\]\(README\.zh-Hant\.md\)/);
  assert.match(hant, /\[简体中文\]\(README\.zh-CN\.md\)/);
});

// Regenerates README.md, README.zh-CN.md, README.zh-Hant.md and data/entries.json from TGbox's
// open data.
// Zero dependencies: Node 22+ (global fetch). Usage:
//   node scripts/generate.mjs                  # fetch https://tgbox.cc/data/entries.json
//   node scripts/generate.mjs --input file.json [--input-hant file.json]
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SOURCE = "https://tgbox.cc/data/entries.json";
/** The same data converted to Traditional Chinese by the site's build. */
const HANT_SOURCE = "https://tgbox.cc/zh-hant/data/entries.json";
const REPO = "https://github.com/TGrpg/awesome-telegram";
const MAIN_REPO = "https://github.com/TGrpg/tgbox";
const BOT = "https://t.me/tgboxccbot";
/** Rows shown per category before the rest folds into <details>. */
const VISIBLE_ROWS = 15;
/** Rows in the "most popular" and "recently added" tables. */
const HIGHLIGHTS = 10;
const DESCRIPTION_CHARS = 90;

const kinds = ["channel", "group", "bot"];

const text = {
  en: {
    file: "README.md",
    htmlLang: "en",
    title: "Awesome Telegram",
    tagline: (n) =>
      `A curated, auto-updated list of ${n} public Telegram channels, groups and bots — with live member counts, recent posts and categories on [TGbox](SITE).`,
    nav: "[🌐 Website](SITE) · [📮 Submit yours](BOT?start=submit) · [🤝 Exchange links](BOT?start=links) · **English** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-Hant.md)",
    intro:
      "Every name below opens its page on **TGbox**, a free, open-source Telegram directory: subscriber counts and growth, recent posts, creation date, activity and similar channels, in English, Simplified and Traditional Chinese. The list is regenerated every day from the site's [open data](SITE/data/entries.json), so dead or banned entries drop out on their own.",
    kinds: { channel: "Channels", group: "Groups", bot: "Bots" },
    kindOne: { channel: "channel", group: "group", bot: "bot" },
    members: { channel: "Subscribers", group: "Members", bot: "Monthly users" },
    name: "Name",
    about: "About",
    category: "Category",
    count: "Size",
    listed: "Listed",
    contents: "Contents",
    popular: "🔥 Most popular",
    newest: "🆕 Recently added",
    more: (n) => `Show ${n} more`,
    stats: (s, date) =>
      `**${s.channels}** channels · **${s.groups}** groups · **${s.bots}** bots · updated ${date}`,
    viewAll: (label, href) => `[All ${label.toLowerCase()} on TGbox →](${href})`,
    howTitle: "How this list works",
    how: [
      "Entries come from [TGbox](SITE): submitted by owners and users through the [bot](BOT), reviewed by admins, then re-checked by a crawler every few hours.",
      "A GitHub Action rebuilds this README every day from [`/data/entries.json`](SITE/data/entries.json) — a copy is kept in [`data/entries.json`](data/entries.json).",
      "Only public entries are listed. Adult, gambling, scam and other illegal content is not accepted.",
    ],
    contributeTitle: "Add or report an entry",
    contribute: [
      "**Fastest:** send the link to [@tgboxccbot](BOT?start=submit) — it is reviewed and appears here the next day.",
      "Or [open an issue](REPO/issues/new/choose). Please don't edit the README by hand: it is generated and your change would be overwritten.",
      "Found a dead, wrong or harmful entry? [Report it](REPO/issues/new?template=report.yml).",
    ],
    relatedTitle: "Related",
    related: [
      "[TGbox](MAIN) — the open-source directory behind this list (Astro + grammY on the Cloudflare free plan). Self-host your own.",
    ],
    licenseTitle: "License",
    license:
      "The list is available under [CC BY 4.0](LICENSE) — attribution: “[TGbox](SITE)”. The generator script is MIT.",
    footer: "If this list helped you, a ⭐ helps others find it.",
  },
  zh: {
    file: "README.zh-CN.md",
    htmlLang: "zh-CN",
    title: "Awesome Telegram 中文资源合集",
    tagline: (n) =>
      `精选并每日自动更新的 ${n} 个公开 Telegram 频道、群组和机器人（电报导航），在 [TGbox](SITE) 查看实时人数、最新消息和分类。`,
    nav: "[🌐 访问网站](SITE) · [📮 提交收录](BOT?start=submit) · [🤝 交换友链](BOT?start=links) · [English](README.md) · **简体中文** · [繁體中文](README.zh-Hant.md)",
    intro:
      "下面每个名称都链接到 **TGbox** 上的详情页——一个免费、开源的 Telegram 导航站：订阅人数与增长、最近消息、创建时间、活跃度和相似频道，简繁英三语。列表每天根据网站的[开放数据](SITE/data/entries.json)重新生成，失效或被封的条目会自动消失。",
    kinds: { channel: "频道", group: "群组", bot: "机器人" },
    kindOne: { channel: "频道", group: "群组", bot: "机器人" },
    members: { channel: "订阅", group: "成员", bot: "月活" },
    name: "名称",
    about: "简介",
    category: "分类",
    count: "规模",
    listed: "收录",
    contents: "目录",
    popular: "🔥 最受欢迎",
    newest: "🆕 最新收录",
    more: (n) => `展开其余 ${n} 个`,
    stats: (s, date) =>
      `**${s.channels}** 个频道 · **${s.groups}** 个群组 · **${s.bots}** 个机器人 · 更新于 ${date}`,
    viewAll: (label, href) => `[在 TGbox 查看全部${label} →](${href})`,
    howTitle: "列表是怎么来的",
    how: [
      "条目来自 [TGbox](SITE)：频道主和用户通过[机器人](BOT)提交，管理员审核，爬虫每隔几小时复查一次。",
      "GitHub Action 每天根据 [`/data/entries.json`](SITE/data/entries.json) 重新生成本页，副本保存在 [`data/entries.json`](data/entries.json)。",
      "只收录公开条目，不收录色情、赌博、诈骗等违法内容。",
    ],
    contributeTitle: "提交或举报",
    contribute: [
      "**最快：**把链接发给 [@tgboxccbot](BOT?start=submit)，审核通过后第二天就会出现在这里。",
      "也可以[提 issue](REPO/issues/new/choose)。请不要直接改 README：它是自动生成的，手动修改会被覆盖。",
      "发现失效、错误或有害的条目？[点这里举报](REPO/issues/new?template=report.yml)。",
    ],
    relatedTitle: "相关项目",
    related: [
      "[TGbox](MAIN) —— 本列表背后的开源导航站（Astro + grammY，跑在 Cloudflare 免费版上），可以自建一份。",
    ],
    licenseTitle: "许可",
    license: "列表内容以 [CC BY 4.0](LICENSE) 发布，署名「[TGbox](SITE)」；生成脚本为 MIT。",
    footer: "如果这个列表对你有帮助，点个 ⭐ 让更多人看到。",
  },
  "zh-hant": {
    file: "README.zh-Hant.md",
    htmlLang: "zh-Hant",
    title: "Awesome Telegram 中文資源合集",
    tagline: (n) =>
      `精選並每日自動更新的 ${n} 個公開 Telegram 頻道、群組和機器人（電報導航），在 [TGbox](SITE) 查看實時人數、最新消息和分類。`,
    nav: "[🌐 訪問網站](SITE) · [📮 提交收錄](BOT?start=submit) · [🤝 交換友鏈](BOT?start=links) · [English](README.md) · [简体中文](README.zh-CN.md) · **繁體中文**",
    intro:
      "下面每個名稱都鏈接到 **TGbox** 上的詳情頁——一個免費、開源的 Telegram 導航站：訂閱人數與增長、最近消息、創建時間、活躍度和相似頻道，簡繁英三語。列表每天根據網站的[開放數據](SITE/data/entries.json)重新生成，失效或被封的條目會自動消失。",
    kinds: { channel: "頻道", group: "群組", bot: "機器人" },
    kindOne: { channel: "頻道", group: "群組", bot: "機器人" },
    members: { channel: "訂閱", group: "成員", bot: "月活" },
    name: "名稱",
    about: "簡介",
    category: "分類",
    count: "規模",
    listed: "收錄",
    contents: "目錄",
    popular: "🔥 最受歡迎",
    newest: "🆕 最新收錄",
    more: (n) => `展開其餘 ${n} 個`,
    stats: (s, date) =>
      `**${s.channels}** 個頻道 · **${s.groups}** 個群組 · **${s.bots}** 個機器人 · 更新於 ${date}`,
    viewAll: (label, href) => `[在 TGbox 查看全部${label} →](${href})`,
    howTitle: "列表是怎麼來的",
    how: [
      "條目來自 [TGbox](SITE)：頻道主和用戶通過[機器人](BOT)提交，管理員審核，爬蟲每隔幾小時複查一次。",
      "GitHub Action 每天根據 [`/data/entries.json`](SITE/data/entries.json) 重新生成本頁，副本保存在 [`data/entries.json`](data/entries.json)。",
      "只收錄公開條目，不收錄色情、賭博、詐騙等違法內容。",
    ],
    contributeTitle: "提交或舉報",
    contribute: [
      "**最快：**把鏈接發給 [@tgboxccbot](BOT?start=submit)，審核通過後第二天就會出現在這裡。",
      "也可以[提 issue](REPO/issues/new/choose)。請不要直接改 README：它是自動生成的，手動修改會被覆蓋。",
      "發現失效、錯誤或有害的條目？[點這裡舉報](REPO/issues/new?template=report.yml)。",
    ],
    relatedTitle: "相關項目",
    related: [
      "[TGbox](MAIN) —— 本列表背後的開源導航站（Astro + grammY，跑在 Cloudflare 免費版上），可以自建一份。",
    ],
    licenseTitle: "許可",
    license: "列表內容以 [CC BY 4.0](LICENSE) 發佈，署名「[TGbox](SITE)」；生成腳本為 MIT。",
    footer: "如果這個列表對你有幫助，點個 ⭐ 讓更多人看到。",
  },
};

/** Table-safe single line: no pipes, HTML, markdown emphasis or line breaks. */
export function cell(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([\\|*_`[\]<>#~])/g, "\\$1");
}

/** Cut by characters (not UTF-16 units), on a word boundary when one is close. */
export function truncate(value, max) {
  const chars = [...String(value ?? "").replace(/\s+/g, " ").trim()];
  if (chars.length <= max) return chars.join("");
  const cut = chars.slice(0, max).join("");
  const space = cut.lastIndexOf(" ");
  return `${space > max * 0.7 ? cut.slice(0, space) : cut}…`;
}

export function compact(n, locale) {
  if (n === null || n === undefined) return "—";
  if (locale !== "en") {
    const [yi, wan] = locale === "zh-hant" ? ["億", "萬"] : ["亿", "万"];
    if (n >= 1e8) return `${(n / 1e8).toFixed(n >= 1e9 ? 0 : 1).replace(/\.0$/, "")}${yi}`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "")}${wan}`;
    return String(n);
  }
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** The description in the README's language: the machine translation when the source is the other one. */
export function describe(entry, locale) {
  const translated = locale === "en" ? entry.descriptionEn : entry.descriptionZh;
  return translated || entry.description || "";
}

/** Where each README's links point on the site. */
const prefixes = { en: "/en", zh: "", "zh-hant": "/zh-hant" };

/** Anchor ids, unlike GitHub's heading slugs, survive Chinese and emoji. */
const anchor = (...parts) => parts.join("-");

export function render(data, locale) {
  const t = text[locale];
  const site = data.site.replace(/\/$/, "");
  const prefix = prefixes[locale];
  const page = (path) => `${site}${prefix}${path}`;
  const detail = (u) => page(`/detail/${u}/`);
  const fill = (s) =>
    s
      .replaceAll("SITE", site + prefix)
      .replaceAll("BOT", BOT)
      .replaceAll("MAIN", MAIN_REPO)
      .replaceAll("REPO", REPO);
  // Links into the site's data file must not get the locale prefix.
  const fixData = (s) => (prefix ? s.replaceAll(`${site}${prefix}/data/`, `${site}/data/`) : s);
  const f = (s) => fixData(fill(s));

  const catName = (c) => (locale === "en" ? c.nameEn : c.nameZh);
  const tagName = new Map(data.tags.map((tag) => [tag.slug, locale === "en" ? tag.nameEn : tag.nameZh]));
  const categories = new Map(data.categories.map((c) => [`${c.kind}:${c.slug}`, c]));
  const date = data.generatedAt.slice(0, 10);
  const byMembers = (a, b) => (b.members ?? -1) - (a.members ?? -1) || a.username.localeCompare(b.username);
  const name = (e) => `[${cell(truncate(e.title, 40))}](${detail(e.username)})${e.verified ? " ✔️" : ""}`;
  const about = (e) => {
    const tags = e.tags.map((slug) => tagName.get(slug)).filter(Boolean).slice(0, 3);
    const body = cell(truncate(describe(e, locale), DESCRIPTION_CHARS));
    return tags.length ? `${body}${body ? " " : ""}<sub>${tags.map((x) => `\`${cell(x)}\``).join(" ")}</sub>` : body;
  };
  const table = (rows, head, row) =>
    [`| ${head.join(" | ")} |`, `| ${head.map((_, i) => (i === head.length - 2 && head.length > 2 ? "---:" : "---")).join(" | ")} |`, ...rows.map((r) => `| ${row(r).join(" | ")} |`)].join("\n");

  const out = [];
  out.push(
    `<div align="center">`,
    "",
    `<a href="${page("/")}"><img src="assets/logo.svg" width="96" height="96" alt="TGbox"></a>`,
    "",
    `# ${t.title} [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)`,
    "",
    f(t.tagline(data.stats.total)),
    "",
    f(t.nav),
    "",
    `[![Entries](https://img.shields.io/badge/${encodeURIComponent(t.kinds.channel)}%20%2B%20${encodeURIComponent(t.kinds.group)}%20%2B%20${encodeURIComponent(t.kinds.bot)}-${data.stats.total}-2AABEE?logo=telegram&logoColor=white)](${page("/")})`,
    `[![Updated](https://img.shields.io/badge/updated-${date.replaceAll("-", "--")}-brightgreen)](${REPO}/actions/workflows/update.yml)`,
    `[![License: CC BY 4.0](https://img.shields.io/badge/license-CC%20BY%204.0-lightgrey.svg)](LICENSE)`,
    "",
    `</div>`,
    "",
    `> ${f(t.intro)}`,
    "",
    t.stats(data.stats, date),
    "",
  );

  // Contents
  out.push(`## ${t.contents}`, "");
  out.push(`- [${t.popular}](#popular)`, `- [${t.newest}](#newest)`);
  const sections = kinds.map((kind) => {
    const entries = data.entries.filter((e) => e.kind === kind);
    const cats = data.categories
      .filter((c) => c.kind === kind)
      .map((c) => ({ c, entries: entries.filter((e) => e.category === c.slug).sort(byMembers) }))
      .filter((x) => x.entries.length > 0)
      .sort((a, b) => b.entries.length - a.entries.length || a.c.slug.localeCompare(b.c.slug));
    return { kind, entries, cats };
  });
  for (const { kind, entries, cats } of sections) {
    if (entries.length === 0) continue;
    out.push(`- [${t.kinds[kind]}](#${kind}) (${entries.length})`);
    for (const { c, entries: rows } of cats) {
      out.push(`  - [${cell(catName(c))}](#${anchor(kind, c.slug)}) (${rows.length})`);
    }
  }
  out.push(`- [${t.howTitle}](#how)`, `- [${t.contributeTitle}](#contribute)`, `- [${t.licenseTitle}](#license)`, "");

  const kindCell = (e) => {
    const c = categories.get(`${e.kind}:${e.category}`);
    return `${t.kindOne[e.kind]}${c ? ` · ${cell(catName(c))}` : ""}`;
  };
  out.push(`<a id="popular"></a>`, "", `## ${t.popular}`, "");
  out.push(
    table(
      [...data.entries].sort(byMembers).slice(0, HIGHLIGHTS),
      [t.name, t.category, t.count, t.about],
      (e) => [name(e), kindCell(e), compact(e.members, locale), cell(truncate(describe(e, locale), 60))],
    ),
    "",
  );
  out.push(`<a id="newest"></a>`, "", `## ${t.newest}`, "");
  out.push(
    table(
      [...data.entries].sort((a, b) => b.listedAt.localeCompare(a.listedAt) || byMembers(a, b)).slice(0, HIGHLIGHTS),
      [t.name, t.category, t.listed, t.about],
      (e) => [name(e), kindCell(e), e.listedAt.slice(0, 10), cell(truncate(describe(e, locale), 60))],
    ),
    "",
  );

  for (const { kind, entries, cats } of sections) {
    if (entries.length === 0) continue;
    out.push(`<a id="${kind}"></a>`, "", `## ${t.kinds[kind]}`, "");
    for (const { c, entries: rows } of cats) {
      const head = [t.name, t.members[kind], t.about];
      const row = (e) => [name(e), compact(e.members, locale), about(e)];
      out.push(`<a id="${anchor(kind, c.slug)}"></a>`, "", `### ${cell(catName(c))}`, "");
      out.push(table(rows.slice(0, VISIBLE_ROWS), head, row), "");
      if (rows.length > VISIBLE_ROWS) {
        out.push(
          "<details>",
          `<summary>${t.more(rows.length - VISIBLE_ROWS)}</summary>`,
          "",
          table(rows.slice(VISIBLE_ROWS), head, row),
          "",
          "</details>",
          "",
        );
      }
      out.push(t.viewAll(cell(catName(c)), page(`/${kind}/${c.slug}/`)), "");
    }
  }

  out.push(`<a id="how"></a>`, "", `## ${t.howTitle}`, "", ...t.how.map((line) => `- ${f(line)}`), "");
  out.push(`<a id="contribute"></a>`, "", `## ${t.contributeTitle}`, "", ...t.contribute.map((line) => `- ${f(line)}`), "");
  out.push(`## ${t.relatedTitle}`, "", ...t.related.map((line) => `- ${f(line)}`), "");
  out.push(`<a id="license"></a>`, "", `## ${t.licenseTitle}`, "", f(t.license), "", `<div align="center"><sub>${t.footer}</sub></div>`, "");
  return out.join("\n");
}

async function load(flag, url) {
  const index = process.argv.indexOf(flag);
  const raw =
    index > 0
      ? await readFile(process.argv[index + 1], "utf8")
      : await fetch(url, { headers: { "user-agent": `awesome-telegram (+${REPO})` } }).then((res) => {
          if (!res.ok) throw new Error(`${url} answered ${res.status}`);
          return res.text();
        });
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.entries)) throw new Error("unexpected data format");
  // A broken build must not wipe the list.
  if (data.entries.length < 50) throw new Error(`only ${data.entries.length} entries, refusing to overwrite`);
  return data;
}

async function main() {
  const data = await load("--input", SOURCE);
  const root = new URL("../", import.meta.url);
  for (const locale of ["en", "zh"]) {
    await writeFile(new URL(text[locale].file, root), render(data, locale));
  }
  // The Traditional README is a nice-to-have: without its data it keeps the last good copy.
  const hant = await load("--input-hant", HANT_SOURCE).catch((error) => {
    console.warn(`skipping ${text["zh-hant"].file}: ${error.message}`);
    return null;
  });
  if (hant) await writeFile(new URL(text["zh-hant"].file, root), render(hant, "zh-hant"));
  await writeFile(new URL("data/entries.json", root), `${JSON.stringify(data, null, 1)}\n`);
  console.log(`wrote ${data.entries.length} entries (${data.generatedAt})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

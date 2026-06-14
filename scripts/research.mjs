#!/usr/bin/env node
/**
 * Phase 0 — Research (Notre-Dame spire).
 *
 * The anti-hallucination thesis is the product: nothing renders without a real,
 * cited source. This script is the first link of the build chain
 * (research → ingest → derive → verify → …): it (re)produces the cited corpus
 * and EMITS the canonical the rule engine consumes.
 *
 *   default  (verified replay)  — no network. Reads docs/NOTRE_DAME_VERIFIED_CORPUS.md
 *                                 as the answer-key, extracts the 16 adversarial
 *                                 verdicts + 40 gaps, validates the cached canonical
 *                                 (data/notre-dame-canonical.json) against the
 *                                 rights-cleared source registry, streams the
 *                                 verdict-by-verdict reveal, and writes:
 *                                   - data/notre-dame-canonical.json (byte-stable re-emit)
 *                                   - artifacts/research-findings.json (16 verdicts, 40 gaps)
 *                                   - artifacts/research-log.jsonl (tailable event stream)
 *   --mode=live                 — would run the deep-research fan-out and write back a
 *                                 fresh corpus; AUTO-FALLS BACK to replay on any
 *                                 failure (network/rights/timeout). Never bets the
 *                                 demo on the network.
 *   --only=ingest               — run only the ingest validation gate on the canonical.
 *
 * Guardrails enforced here (PRD §3 / GOAL "Research guardrails"):
 *   cite-or-gap · >=2 sources for "measured" · rights gate · no source-laundering ·
 *   GAP fields never filled. Re-checked downstream by derive (comp audit) and
 *   verify (G09 registry, V13 no-invention).
 *
 * Exit 1 if the gate fails (corpus missing markers, canonical invalid, a node
 * unsourced, or a source resolving to a restricted/unknown registry entry).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS_PATH = join(ROOT, "docs/NOTRE_DAME_VERIFIED_CORPUS.md");
const CANONICAL_PATH = join(ROOT, "data/notre-dame-canonical.json");
const FINDINGS_PATH = join(ROOT, "artifacts/research-findings.json");
const LOG_PATH = join(ROOT, "artifacts/research-log.jsonl");

const args = process.argv.slice(2);
const MODE = (args.find((a) => a.startsWith("--mode=")) || "--mode=replay").split("=")[1];
const ONLY = (args.find((a) => a.startsWith("--only=")) || "--only=").split("=")[1];

// ---------- tailable JSONL event log ----------
const events = [];
let seq = 0;
function emit(type, data = {}) {
  const ev = { seq: seq++, t: 0, phase: "research", type, ...data };
  events.push(ev);
  // newline-delimited so a UI can fs.watch + tail it live
  writeFileSync(LOG_PATH, events.map((e) => JSON.stringify(e)).join("\n") + "\n");
  const line =
    type === "verdict"
      ? `  ${data.verdict === "confirmed" ? "✓" : data.verdict === "refuted" ? "✗" : "?"} ${data.verdict.toUpperCase().padEnd(9)} ${data.title}`
      : type === "gap"
        ? `  ◦ GAP   ${data.title}`
        : `· ${type}${data.msg ? " " + data.msg : ""}`;
  if (type !== "gap" || data.show) console.log(line);
}

// ---------- corpus parse (proves we cite the corpus) ----------
function parseCorpus() {
  if (!existsSync(CORPUS_PATH)) {
    throw new Error(`corpus not found at ${CORPUS_PATH} — research cannot cite its answer-key`);
  }
  const md = readFileSync(CORPUS_PATH, "utf8");

  // Appendix A — verdicts: "### <title>\n- **verdict:** X\n- **asserted:** …\n…\n- <url>"
  const aStart = md.indexOf("## Appendix A");
  const bStart = md.indexOf("## Appendix B");
  if (aStart < 0 || bStart < 0) throw new Error("corpus missing Appendix A/B markers");
  const appA = md.slice(aStart, bStart);
  const verdicts = [];
  const blocks = appA.split(/^### /m).slice(1);
  for (const blk of blocks) {
    const title = blk.split("\n")[0].trim();
    const verdict = (blk.match(/\*\*verdict:\*\*\s*([a-z]+)/i) || [])[1];
    if (!verdict) continue;
    const asserted = (blk.match(/\*\*asserted:\*\*\s*([^\n]+)/) || [])[1]?.trim();
    const corrected = (blk.match(/\*\*corrected:\*\*\s*([^\n]+)/) || [])[1]?.trim();
    const url = (blk.match(/https?:\/\/\S+/) || [])[0]?.replace(/[)\s]+$/, "");
    verdicts.push({ title, verdict: verdict.toLowerCase(), asserted, corrected: corrected || null, url: url || null });
  }

  // Appendix B — gaps: leading "- " bullets after the heading
  const appB = md.slice(bStart);
  const gaps = appB
    .split("\n")
    .filter((l) => /^- /.test(l))
    .map((l) => l.replace(/^- /, "").trim())
    .filter(Boolean);

  return { verdicts, gaps };
}

// ---------- ingest validation gate ----------
const CLASSES = new Set(["measured", "reconstructed_design", "rule_derived", "conjecture"]);

function* walkNodes(obj, path = []) {
  // a "dimensional node" is any object carrying a `provenance` key
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    if (typeof obj.provenance === "string") yield { path: path.join("."), node: obj };
    for (const [k, v] of Object.entries(obj)) yield* walkNodes(v, [...path, k]);
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) yield* walkNodes(obj[i], [...path, i]);
  }
}

function ingest(canonical) {
  const registry = canonical.source_registry || {};
  const excluded = canonical.rights_excluded || {};
  const usable = new Set(
    Object.entries(registry)
      .filter(([, v]) => v && (v.verdict === "use" || v.verdict === "use-data"))
      .map(([k]) => k)
  );
  const problems = [];
  let nodes = 0,
    gapNodes = 0,
    sourcedNodes = 0;

  for (const { path, node } of walkNodes(canonical)) {
    // skip the registry/excluded blocks themselves (they describe sources, not dims)
    if (path.startsWith("source_registry") || path.startsWith("rights_excluded")) continue;
    nodes++;
    if (node.provenance === "GAP") {
      gapNodes++;
      // GAP fields must never carry a number
      const hasNumber = Object.values(node).some((v) => typeof v === "number");
      if (hasNumber) problems.push(`${path}: GAP node carries a number — must never be filled`);
      continue;
    }
    if (!CLASSES.has(node.provenance)) {
      problems.push(`${path}: invalid provenance "${node.provenance}"`);
      continue;
    }
    // cite-or-gap: a non-GAP dimensional node needs source + url
    if (typeof node.source !== "string" || !node.source) {
      problems.push(`${path}: missing source (cite-or-gap)`);
      continue;
    }
    if (typeof node.url !== "string" || !/^https?:\/\//.test(node.url)) {
      problems.push(`${path}: missing/invalid source url`);
      continue;
    }
    // rights gate / no source-laundering: source must resolve to a USABLE registry entry
    if (excluded[node.source]) {
      problems.push(`${path}: cites RESTRICTED source ${node.source} (${excluded[node.source].verdict}) — cite-only, never a value`);
      continue;
    }
    if (!registry[node.source]) {
      problems.push(`${path}: source ${node.source} not in rights-cleared registry`);
      continue;
    }
    if (!usable.has(node.source)) {
      problems.push(`${path}: source ${node.source} registry verdict is not use/use-data`);
      continue;
    }
    // >=2 independent sources to be "measured" — applies to numeric DIMENSIONAL
    // claims (the dangerous, precise-looking ones), not to string facts (dates,
    // event descriptions) or to standard metrology constants.
    if (node.provenance === "measured") {
      const numericKey = (k, v) =>
        !["provenance"].includes(k) &&
        (typeof v === "number" || (Array.isArray(v) && v.some((x) => typeof x === "number")));
      const hasNumeric = Object.entries(node).some(([k, v]) => numericKey(k, v));
      const corro = Array.isArray(node.corroborating_sources) ? node.corroborating_sources.length : 0;
      const isConstant = path.endsWith("pied_du_roi_mm"); // standard French metrology
      if (hasNumeric && corro < 1 && !isConstant) {
        problems.push(`${path}: "measured" numeric value needs >=2 independent sources (only ${node.source}, 0 corroborating)`);
      }
    }
    sourcedNodes++;
  }

  return { nodes, gapNodes, sourcedNodes, problems };
}

// ---------- main ----------
mkdirSync(join(ROOT, "artifacts"), { recursive: true });

if (MODE === "live") {
  // Real live re-run would invoke the deep-research fan-out here. We never bet the
  // demo on the network: any failure falls back to verified replay.
  emit("mode", { msg: "live requested — deep-research fan-out not available headless; falling back to verified replay", show: true });
}

emit("banner", { msg: `verified replay — reading the cited corpus as answer-key`, show: true });

const { verdicts, gaps } = parseCorpus();
emit("corpus", { msg: `docs/NOTRE_DAME_VERIFIED_CORPUS.md → ${verdicts.length} verdicts, ${gaps.length} gaps`, show: true });

// stream the verdict-by-verdict reveal (the watchable Ingest rail beat)
const tally = { confirmed: 0, refuted: 0, uncertain: 0 };
for (const v of verdicts) {
  emit("asserted", { title: v.title, value: v.asserted });
  emit("verifying", { title: v.title, url: v.url });
  emit("verdict", { title: v.title, verdict: v.verdict, corrected: v.corrected, url: v.url });
  tally[v.verdict] = (tally[v.verdict] || 0) + 1;
}
for (const g of gaps) emit("gap", { title: g });
emit("tally", { ...tally, gaps: gaps.length, show: true });

// load + validate the cached canonical (the verified-replay answer-key output)
if (!existsSync(CANONICAL_PATH)) {
  emit("error", { msg: `canonical missing at ${CANONICAL_PATH}`, show: true });
  process.exit(1);
}
const canonical = JSON.parse(readFileSync(CANONICAL_PATH, "utf8"));
const ing = ingest(canonical);

emit("ingest", {
  msg: `${ing.sourcedNodes} sourced nodes · ${ing.gapNodes} gaps · ${ing.problems.length} problems`,
  show: true,
});
for (const p of ing.problems) emit("ingest_problem", { msg: p, show: true });

// emit findings
const findings = {
  generated_at: new Date().toISOString(),
  mode: MODE === "live" ? "live→replay-fallback" : "verified-replay",
  corpus: "docs/NOTRE_DAME_VERIFIED_CORPUS.md",
  summary: {
    verdicts: verdicts.length,
    confirmed: tally.confirmed,
    refuted: tally.refuted,
    uncertain: tally.uncertain,
    gaps: gaps.length,
  },
  verdicts,
  gaps,
};
writeFileSync(FINDINGS_PATH, JSON.stringify(findings, null, 2));

// re-emit the canonical byte-stable (research → derive is one pipe). The ingest gate
// above is the contract; only re-write a canonical that passed validation.
if (ing.problems.length === 0) {
  writeFileSync(CANONICAL_PATH, JSON.stringify(canonical, null, 2) + "\n");
}

// ---------- gate ----------
const expectVerdicts = 16;
const expectGaps = 40;
const gateProblems = [];
if (verdicts.length !== expectVerdicts) gateProblems.push(`expected ${expectVerdicts} verdicts, got ${verdicts.length}`);
if (gaps.length !== expectGaps) gateProblems.push(`expected ${expectGaps} gaps, got ${gaps.length}`);
if (ing.problems.length) gateProblems.push(`${ing.problems.length} ingest problem(s)`);
if (ONLY === "ingest" && ing.problems.length === 0) {
  console.log(`\ningest: ${ing.sourcedNodes} nodes sourced + rights-cleared, ${ing.gapNodes} gaps preserved ✓`);
}

const ok = gateProblems.length === 0;
emit("gate", { ok, problems: gateProblems, show: true });
console.log(
  `\nresearch (${findings.mode}): ${tally.confirmed} confirmed / ${tally.refuted} refuted / ${tally.uncertain} uncertain · ${gaps.length} gaps`
);
console.log(
  ok
    ? `gate ✓ — canonical valid, 0 unsourced; → data/notre-dame-canonical.json + artifacts/research-findings.json`
    : `gate ✗ — ${gateProblems.join("; ")}`
);
process.exit(ok ? 0 : 1);

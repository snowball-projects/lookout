import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  prepareWorkspace,
  loadDocument,
  parseJSON,
  canonical,
  digest,
  dec,
  mul,
  str,
} from "../web/data.js";
const fixture = JSON.parse(
  readFileSync(new URL("../web/example.json", import.meta.url)),
);
const copy = () => structuredClone(fixture);
function python(bundle) {
  const r = spawnSync(
    "python3",
    [
      "-c",
      'import json,sys;sys.path.insert(0,"src");from workspace import prepare_workspace;print(json.dumps(prepare_workspace(json.load(sys.stdin))))',
    ],
    { input: JSON.stringify(bundle), encoding: "utf8" },
  );
  if (r.status !== 0) throw Error(r.stderr);
  return JSON.parse(r.stdout);
}
test("browser valuation equals the independent Python implementation", () => {
  const b = copy().workspace;
  assert.deepEqual(prepareWorkspace(b), python(b));
});
test("exact decimal products survive large balances and tiny prices", () => {
  const b = copy().workspace;
  b.holdings[0].quantity = "12345678901234567890.12345678";
  b.quotes[0].price = "0.000000000000000123";
  assert.deepEqual(prepareWorkspace(b), python(b));
  assert.equal(str(mul(dec("0.1"), dec("0.2"))), "0.02");
});
test("deterministic range of quantities agrees across runtimes", () => {
  for (let n = 1; n <= 16; n++) {
    const b = copy().workspace;
    b.holdings.forEach((h, i) => (h.quantity = `${n * (i + 1)}.${n * 17}`));
    b.quotes.forEach((q, i) => (q.price = `${n + i}.${n * 137}`));
    assert.deepEqual(prepareWorkspace(b), python(b));
  }
});
test("unknown prices stay unknown, including cash", () => {
  const b = copy().workspace;
  b.quotes = [];
  const w = prepareWorkspace(b);
  assert.equal(w.known_market_value, "0");
  assert.equal(w.unpriced.length, 4);
  assert.equal(w.exposure_input, null);
  assert.deepEqual(w, python(b));
});
test("zero-valued holdings are known and not omitted", () => {
  const b = copy().workspace;
  b.holdings.forEach((h) => (h.quantity = "0"));
  assert.deepEqual(prepareWorkspace(b), python(b));
  assert.equal(prepareWorkspace(b).valuation_complete, true);
});
test("duplicate, dangling, malformed and future records fail", () => {
  const mutations = [
    (b) => b.accounts.push(b.accounts[0]),
    (b) => b.holdings.push(b.holdings[0]),
    (b) => b.quotes.push(b.quotes[0]),
    (b) => (b.holdings[0].account_id = "account:missing"),
    (b) => (b.currency = "usd"),
    (b) => (b.quotes[0].currency = "EUR"),
    (b) => (b.holdings[0].quantity = "-1"),
    (b) => (b.holdings[0].quantity = "1e9"),
    (b) => (b.holdings[0].quantity = "1.0000000000000000001"),
    (b) => (b.quotes[0].as_of = "2026-08-28T12:00:00Z"),
    (b) => (b.valuation_as_of = "2026-02-30"),
    (b) => (b.holdings[0].as_of = "2026-08-27T24:00:00Z"),
    (b) => (b.holdings[0].source.retrieved_at = "2026-08-26T12:00:00Z"),
    (b) => (b.credentials = "unexpected"),
  ];
  for (const mutate of mutations) {
    const b = copy().workspace;
    mutate(b);
    assert.throws(() => prepareWorkspace(b));
    assert.throws(() => python(b));
  }
});
test("nested duplicate JSON fields and excessive depth are rejected", () => {
  assert.throws(
    () => parseJSON('{"a":{"price":"1","price":"2"}}'),
    /Duplicate/,
  );
  assert.throws(
    () => parseJSON("[".repeat(60) + "0" + "]".repeat(60)),
    /complex/,
  );
  for (const v of ["[1,]", '{"a":1,}', "01", "1e500", '{"a":"\n"}'])
    assert.throws(() => parseJSON(v));
});
test("parser preserves hostile keys as inert own properties", () => {
  const v = parseJSON('{"__proto__":{"polluted":true},"constructor":1}');
  assert.equal(Object.getPrototypeOf(v), null);
  assert.equal({}.polluted, undefined);
  assert.equal(v.constructor, 1);
});
test("parser and canonicalization retain unicode and string escapes", () => {
  const v = {
    label: "Σ café 😀",
    text: 'quote " slash \\ newline\n',
    nested: [true, null, 1],
  };
  assert.equal(canonical(parseJSON(JSON.stringify(v))), canonical(v));
});
test("input and result do not alias", () => {
  const b = copy().workspace,
    r = prepareWorkspace(b);
  r.holdings[0].source.name = "Changed";
  assert.notEqual(b.holdings[0].source.name, "Changed");
});
test("checked report preserves native totals, paths and provenance", async () => {
  const r = await loadDocument(copy());
  assert.equal(r.exposure.coverage.resolved_value, "1100");
  assert.equal(r.exposure.coverage.unresolved_value, "200");
  assert.equal(r.exposure.paths.length, 7);
  assert.equal(r.exposure.provenance.used_snapshots[0].stale, true);
});
test("report cannot remain attached after holdings change", async () => {
  const f = copy();
  f.workspace.holdings[0].quantity = "11";
  await assert.rejects(loadDocument(f), /different input/);
});
test("report cannot remain attached after a source snapshot changes", async () => {
  const f = copy();
  f.workspace.snapshots[0].holdings[0].weight = "0.4";
  await assert.rejects(loadDocument(f), /different input/);
});
test("corrupt paths, coverage, aggregates and provenance fail", async () => {
  for (const mutate of [
    (r) => (r.paths[0].value = "900"),
    (r) => (r.aggregates[0].value = "900"),
    (r) => (r.coverage.resolved_value = "999"),
    (r) => (r.paths[0].path = ["ticker:OTHER"]),
    (r) => (r.provenance.used_snapshots[0].stale = "yes"),
    (r) => (r.portfolio.currency = "EUR"),
    (r) => r.aggregates.push(r.aggregates[0]),
    (r) => (r.paths[0].status = "unknown"),
  ]) {
    const f = copy();
    mutate(f.exposure.report);
    await assert.rejects(loadDocument(f));
  }
});
test("incomplete or empty workspace remains a useful holdings-only import", async () => {
  const b = copy().workspace;
  b.quotes = [];
  const r = await loadDocument(b);
  assert.equal(r.exposure, null);
  b.holdings = [];
  assert.deepEqual(prepareWorkspace(b), python(b));
});
test("stored input association agrees with Python canonical digest", async () => {
  const f = copy();
  assert.equal(
    await digest(prepareWorkspace(f.workspace).exposure_input),
    f.exposure.input_sha256,
  );
});
test("file schema and engine provenance are checked", async () => {
  const f = copy();
  f.exposure.engine_commit = "latest";
  await assert.rejects(loadDocument(f));
  await assert.rejects(loadDocument({ ...copy(), extra: 1 }));
});

test("optional agent navigation uses one validated action without exposing portfolio data", async () => {
  const { registerNavigation } = await import("../web/agent.js");
  let tool,
    current = "holdings";
  const lifecycle = registerNavigation(
    {
      registerTool: (t) => {
        tool = t;
      },
    },
    (view) => {
      current = view;
    },
  );
  assert.equal(tool.name, "navigate_portfolio_view");
  assert.deepEqual(tool.execute({ view: "exposure" }), { view: "exposure" });
  assert.equal(current, "exposure");
  assert.throws(() => tool.execute({ view: "holdings", extra: 1 }));
  assert.equal(current, "exposure");
  assert.throws(() => tool.execute({ view: "markets" }));
  lifecycle.abort();
  assert.equal(
    registerNavigation(null, () => {}),
    null,
  );
});

test("report options and snapshot-age labels cannot contradict attached inputs", async () => {
  for (const mutate of [
    (r) => (r.options.max_depth = 7),
    (r) => (r.provenance.used_snapshots[0].stale = false),
    (r) => (r.provenance.used_snapshots[0].age_days = 1),
  ]) {
    const f = copy();
    mutate(f.exposure.report);
    await assert.rejects(loadDocument(f));
  }
});

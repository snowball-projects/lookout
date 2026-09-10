// Exact decimal arithmetic for valuation. Floating point is used only for chart widths.
export function dec(s) {
  if (
    typeof s !== "string" ||
    s.length > 160 ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(s)
  )
    throw Error("Expected a nonnegative decimal string.");
  let [a, b = ""] = s.split(".");
  return { n: BigInt(a + b), s: b.length };
}
export function str(d) {
  let s = d.n.toString().padStart(d.s + 1, "0");
  if (d.s) s = s.slice(0, -d.s) + "." + s.slice(-d.s);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}
const pow = (n) => 10n ** BigInt(n);
export function add(a, b) {
  const s = Math.max(a.s, b.s);
  return { n: a.n * pow(s - a.s) + b.n * pow(s - b.s), s };
}
export function mul(a, b) {
  return { n: a.n * b.n, s: a.s + b.s };
}
export function cmp(a, b) {
  const s = Math.max(a.s, b.s);
  const x = a.n * pow(s - a.s),
    y = b.n * pow(s - b.s);
  return x < y ? -1 : x > y ? 1 : 0;
}
const sum = (xs) => xs.reduce((a, x) => add(a, dec(x)), dec("0"));
function close(a, b, total) {
  const s = Math.max(a.s, b.s, total.s + 32);
  let d = a.n * pow(s - a.s) - b.n * pow(s - b.s);
  if (d < 0) d = -d;
  const t = cmp(total, dec("1")) < 0 ? dec("1") : total;
  return d <= t.n * pow(s - t.s - 32);
}
function exact(v, keys, p) {
  if (
    !v ||
    Array.isArray(v) ||
    typeof v !== "object" ||
    Object.keys(v).sort().join(" ") !== keys.split(" ").sort().join(" ")
  )
    throw Error(`${p}: unexpected or missing fields.`);
}
function text(v, p) {
  if (typeof v !== "string" || !v.trim() || v !== v.trim() || v.length > 512)
    throw Error(`${p}: expected text of 1–512 characters.`);
  return v;
}
function id(v) {
  if (
    !/^[a-z][a-z0-9._-]*:[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(
      text(v, "Identifier"),
    )
  )
    throw Error("Expected a scheme-qualified identifier.");
  return v;
}
function list(v, p, max = 10000) {
  if (!Array.isArray(v) || v.length > max)
    throw Error(`${p}: too many or invalid rows.`);
  return v;
}
function number(v) {
  const d = dec(v);
  if (
    v.length > 48 ||
    v.replace(".", "").replace(/^0+/, "").length > 28 ||
    d.s > 18
  )
    throw Error("Input exceeds 28 digits or 18 decimal places.");
  return d;
}
function day(v) {
  if (
    typeof v !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
    Number(v.slice(0, 4)) < 1 ||
    !Number.isFinite(Date.parse(v)) ||
    new Date(v).toISOString().slice(0, 10) !== v
  )
    throw Error("Expected a valid YYYY-MM-DD date.");
  return v;
}
function stamp(v) {
  text(v, "Timestamp");
  const m =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|([+-])(\d{2}):(\d{2}))$/.exec(
      v,
    );
  if (
    !m ||
    +m[2] > 23 ||
    +m[3] > 59 ||
    +m[4] > 59 ||
    +(m[7] || 0) > 23 ||
    +(m[8] || 0) > 59
  )
    throw Error("Expected a valid timestamp with a timezone.");
  day(m[1]);
  const t = Date.parse(v);
  if (
    !Number.isFinite(t) ||
    new Date(t).getUTCFullYear() < 1 ||
    new Date(t).getUTCFullYear() > 9999
  )
    throw Error("Invalid timestamp.");
  return t;
}
function source(v) {
  exact(v, "name reference retrieved_at", "Source");
  text(v.name, "Source name");
  text(v.reference, "Source reference");
  return stamp(v.retrieved_at);
}
function observed(item, valuation) {
  const t = stamp(item.as_of);
  if (new Date(t).toISOString().slice(0, 10) > valuation)
    throw Error("Observation postdates the valuation day.");
  if (source(item.source) < t)
    throw Error("Source retrieval predates observation.");
}
export function prepareWorkspace(input) {
  const b = structuredClone(input);
  exact(
    b,
    "schema_version valuation_as_of currency accounts instruments holdings quotes snapshots",
    "Workspace",
  );
  if (b.schema_version !== "lookout.workspace/1")
    throw Error("Unsupported workspace format.");
  if (typeof b.currency !== "string" || !/^[A-Z]{3}$/.test(b.currency))
    throw Error("Use a three-letter uppercase currency.");
  day(b.valuation_as_of);
  list(b.snapshots, "Snapshots");
  const accounts = new Map(),
    instruments = new Map(),
    quotes = new Map(),
    seen = new Set(),
    totals = new Map(),
    accountTotals = new Map();
  for (const a of list(b.accounts, "Accounts")) {
    exact(a, "id label", "Account");
    id(a.id);
    text(a.label, "Account label");
    if (accounts.has(a.id)) throw Error("Duplicate account.");
    accounts.set(a.id, a);
    accountTotals.set(a.id, dec("0"));
  }
  for (const i of list(b.instruments, "Instruments")) {
    exact(i, "id label kind", "Instrument");
    id(i.id);
    text(i.label, "Instrument label");
    if (!["security", "fund", "cash", "derivative", "unknown"].includes(i.kind))
      throw Error("Unsupported instrument kind.");
    if (instruments.has(i.id)) throw Error("Duplicate instrument.");
    instruments.set(i.id, i);
  }
  for (const q of list(b.quotes, "Quotes")) {
    exact(q, "instrument_id currency price as_of source", "Quote");
    id(q.instrument_id);
    if (!instruments.has(q.instrument_id) || quotes.has(q.instrument_id))
      throw Error("Unknown or duplicate quote instrument.");
    if (q.currency !== b.currency)
      throw Error("Quote currency differs; FX conversion is not supported.");
    number(q.price);
    observed(q, b.valuation_as_of);
    quotes.set(q.instrument_id, q);
  }
  const holdings = [],
    unpriced = [];
  let total = dec("0");
  for (const h of list(b.holdings, "Holdings")) {
    exact(h, "account_id instrument_id quantity as_of source", "Holding");
    id(h.account_id);
    id(h.instrument_id);
    const key = h.account_id + "\u0000" + h.instrument_id;
    if (!accounts.has(h.account_id) || !instruments.has(h.instrument_id))
      throw Error("Unknown holding account or instrument.");
    if (seen.has(key)) throw Error("Duplicate account/instrument holding.");
    seen.add(key);
    number(h.quantity);
    observed(h, b.valuation_as_of);
    const q = quotes.get(h.instrument_id) || null,
      v = q ? mul(dec(h.quantity), dec(q.price)) : null;
    holdings.push({
      ...h,
      market_value: v === null ? null : str(v),
      quote: q,
      valuation_status: q ? "priced" : "missing_quote",
    });
    if (v === null)
      unpriced.push({
        account_id: h.account_id,
        instrument_id: h.instrument_id,
        reason: "missing_quote",
      });
    else {
      total = add(total, v);
      totals.set(
        h.instrument_id,
        add(totals.get(h.instrument_id) || dec("0"), v),
      );
      accountTotals.set(h.account_id, add(accountTotals.get(h.account_id), v));
    }
  }
  const sort = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const positions = [...totals]
    .sort(([a], [b]) => sort(a, b))
    .map(([i, v]) => ({
      instrument_id: i,
      kind: instruments.get(i).kind,
      market_value: str(v),
    }));
  const unsupported = positions
    .filter((p) => {
      const [a, b = ""] = p.market_value.split(".");
      return (a + b).replace(/^0+/, "").length > 28 || b.length > 8;
    })
    .map((p) => p.instrument_id);
  const ready = !unpriced.length && !unsupported.length && holdings.length > 0;
  return {
    schema_version: "lookout.workspace-result/1",
    currency: b.currency,
    valuation_as_of: b.valuation_as_of,
    holdings: holdings.sort(
      (a, b) =>
        sort(a.account_id, b.account_id) ||
        sort(a.instrument_id, b.instrument_id),
    ),
    known_market_value: str(total),
    valuation_complete: !unpriced.length,
    unpriced: unpriced.sort(
      (a, b) =>
        sort(a.account_id, b.account_id) ||
        sort(a.instrument_id, b.instrument_id),
    ),
    account_known_values: Object.fromEntries(
      [...accountTotals]
        .sort(([a], [b]) => sort(a, b))
        .map(([a, v]) => [a, str(v)]),
    ),
    exposure_blockers: {
      missing_quotes: unpriced.length,
      unsupported_precision: unsupported,
      empty_portfolio: !holdings.length,
    },
    exposure_input: ready
      ? {
          schema_version: "1",
          portfolio: {
            currency: b.currency,
            valuation_as_of: b.valuation_as_of,
            positions,
          },
          snapshots: b.snapshots,
          options: { max_depth: 8, stale_after_days: 90 },
        }
      : null,
  };
}
// Bounded parser rejects duplicate fields instead of letting JSON.parse discard them.
export function parseJSON(s) {
  if (typeof s !== "string" || new TextEncoder().encode(s).length > 5_000_000)
    throw Error("Files must be 5 MB or smaller.");
  let i = 0,
    nodes = 0;
  const ws = () => {
    while (/[\t\n\r ]/.test(s[i] || "X")) i++;
  };
  const quoted = () => {
    const start = i++;
    let escape = false;
    while (i < s.length) {
      const c = s[i++];
      if (c === '"' && !escape) return JSON.parse(s.slice(start, i));
      if (c === "\\" && !escape) escape = true;
      else escape = false;
    }
    throw Error("Unfinished string.");
  };
  function value(depth) {
    if (depth > 48 || ++nodes > 200000) throw Error("File is too complex.");
    ws();
    let c = s[i];
    if (c === '"') return quoted();
    if (c === "{" || c === "[") {
      const obj = c === "{",
        end = obj ? "}" : "]",
        out = obj ? Object.create(null) : [];
      i++;
      ws();
      if (s[i] === end) {
        i++;
        return out;
      }
      while (i < s.length) {
        if (obj) {
          if (s[i] !== '"') throw Error("Expected a field name.");
          const key = quoted();
          if (Object.hasOwn(out, key))
            throw Error("Duplicate JSON field: " + key);
          ws();
          if (s[i++] !== ":") throw Error("Expected a colon.");
          out[key] = value(depth + 1);
        } else out.push(value(depth + 1));
        ws();
        c = s[i++];
        if (c === end) return out;
        if (c !== ",") throw Error("Expected a comma.");
        ws();
      }
      throw Error("Unfinished JSON.");
    }
    for (const [word, v] of [
      ["true", true],
      ["false", false],
      ["null", null],
    ])
      if (s.startsWith(word, i)) {
        i += word.length;
        return v;
      }
    const m = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(s.slice(i));
    if (m && m.index === 0) {
      i += m[0].length;
      const v = Number(m[0]);
      if (!Number.isFinite(v)) throw Error("Number exceeds supported range.");
      return v;
    }
    throw Error("Invalid JSON.");
  }
  const v = value(0);
  ws();
  if (i !== s.length) throw Error("Unexpected content after JSON.");
  return v;
}
export function canonical(v) {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical(v[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
export async function digest(v) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical(v)),
  );
  return [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export function validateReport(r, w) {
  exact(
    r,
    "schema_version engine_version portfolio options coverage aggregates paths provenance warnings",
    "Exposure report",
  );
  if (r.schema_version !== "1") throw Error("Unsupported exposure report.");
  text(r.engine_version, "Engine version");
  exact(
    r.portfolio,
    "currency valuation_as_of total_value",
    "Report portfolio",
  );
  if (
    r.portfolio.currency !== w.currency ||
    r.portfolio.valuation_as_of !== w.valuation_as_of ||
    cmp(dec(r.portfolio.total_value), dec(w.known_market_value)) !== 0
  )
    throw Error("Report portfolio differs from workspace.");
  const total = dec(w.known_market_value),
    paths = list(r.paths, "Exposure paths", 25000),
    aggregates = list(r.aggregates, "Exposure aggregates", 25000),
    roots = new Map(),
    groups = new Map();
  const statuses = new Set(["resolved", "unresolved"]);
  for (const row of paths) {
    exact(
      row,
      "root_position_id exposure_id subject_id kind status reason path expansions value portfolio_percentage",
      "Path",
    );
    id(row.root_position_id);
    id(row.subject_id);
    if (row.exposure_id !== null) id(row.exposure_id);
    if (
      !statuses.has(row.status) ||
      !["security", "fund", "cash", "derivative", "unknown"].includes(row.kind)
    )
      throw Error("Invalid exposure status or kind.");
    if (row.reason !== null) text(row.reason, "Exposure reason");
    if (
      (row.status === "resolved") !== (row.reason === null) ||
      row.exposure_id !== (row.status === "resolved" ? row.subject_id : null)
    )
      throw Error("Inconsistent path status.");
    dec(row.portfolio_percentage);
    const route = list(row.path, "Path", 10);
    if (
      !route.length ||
      route[0] !== row.root_position_id ||
      route.at(-1) !== row.subject_id
    )
      throw Error("Invalid contribution path.");
    route.forEach(id);
    for (const e of list(row.expansions, "Expansions", 8)) {
      exact(
        e,
        "fund_id snapshot_as_of source_name source_reference retrieved_at",
        "Expansion",
      );
      id(e.fund_id);
      day(e.snapshot_as_of);
      text(e.source_name, "Source");
      text(e.source_reference, "Reference");
      stamp(e.retrieved_at);
    }
    const v = dec(row.value);
    roots.set(
      row.root_position_id,
      add(roots.get(row.root_position_id) || dec("0"), v),
    );
    const k = canonical([row.subject_id, row.kind, row.status, row.reason]);
    groups.set(k, add(groups.get(k) || dec("0"), v));
  }
  const expected = w.exposure_input?.portfolio.positions;
  if (!expected || roots.size !== expected.length)
    throw Error("Report roots differ from portfolio.");
  for (const p of expected)
    if (
      !roots.has(p.instrument_id) ||
      !close(roots.get(p.instrument_id), dec(p.market_value), total)
    )
      throw Error("Report does not conserve a root position.");
  const seen = new Set();
  for (const a of aggregates) {
    exact(
      a,
      "subject_id kind status reason value portfolio_percentage",
      "Aggregate",
    );
    const k = canonical([a.subject_id, a.kind, a.status, a.reason]);
    if (
      seen.has(k) ||
      !groups.has(k) ||
      !close(groups.get(k), dec(a.value), total)
    )
      throw Error("Exposure aggregates do not match contribution paths.");
    seen.add(k);
    dec(a.portfolio_percentage);
  }
  if (seen.size !== groups.size) throw Error("Exposure aggregate missing.");
  exact(
    r.coverage,
    "resolved_value unresolved_value resolved_percentage unresolved_percentage",
    "Coverage",
  );
  for (const status of statuses) {
    const v = sum(
      aggregates.filter((a) => a.status === status).map((a) => a.value),
    );
    if (!close(v, dec(r.coverage[status + "_value"]), total))
      throw Error("Coverage differs from aggregates.");
    dec(r.coverage[status + "_percentage"]);
  }
  if (
    !close(
      add(dec(r.coverage.resolved_value), dec(r.coverage.unresolved_value)),
      total,
      total,
    )
  )
    throw Error("Exposure does not conserve total value.");
  exact(r.options, "max_depth stale_after_days", "Options");
  if (
    !Number.isInteger(r.options.max_depth) ||
    r.options.max_depth < 0 ||
    r.options.max_depth > 8 ||
    !Number.isInteger(r.options.stale_after_days) ||
    r.options.stale_after_days < 0
  )
    throw Error("Invalid report options.");
  if (canonical(r.options) !== canonical(w.exposure_input.options))
    throw Error("Report calculation options differ from the associated input.");
  exact(r.provenance, "used_snapshots unused_snapshot_fund_ids", "Provenance");
  for (const s of list(r.provenance.used_snapshots, "Used snapshots")) {
    exact(
      s,
      "fund_id snapshot_as_of source_name source_reference retrieved_at age_days stale reported_weight residual_weight",
      "Snapshot provenance",
    );
    id(s.fund_id);
    day(s.snapshot_as_of);
    text(s.source_name, "Source");
    text(s.source_reference, "Reference");
    stamp(s.retrieved_at);
    if (
      !Number.isInteger(s.age_days) ||
      s.age_days < 0 ||
      typeof s.stale !== "boolean"
    )
      throw Error("Invalid snapshot age.");
    const age =
      (Date.parse(w.valuation_as_of) - Date.parse(s.snapshot_as_of)) / 86400000;
    if (age !== s.age_days || s.stale !== age > r.options.stale_after_days)
      throw Error("Snapshot age or stale status is inconsistent.");
    dec(s.reported_weight);
    dec(s.residual_weight);
  }
  list(r.provenance.unused_snapshot_fund_ids, "Unused snapshots").forEach(id);
  for (const warning of list(r.warnings, "Warnings", 10000)) {
    text(warning.code, "Warning code");
    text(warning.message, "Warning message");
  }
  return structuredClone(r);
}
export async function loadDocument(doc) {
  if (doc?.schema_version === "lookout.workspace/1")
    return {
      bundle: structuredClone(doc),
      workspace: prepareWorkspace(doc),
      exposure: null,
      engine: null,
    };
  exact(doc, "schema_version workspace exposure", "File");
  if (doc.schema_version !== "lookout.file/1")
    throw Error("Use a lookout workspace or report file.");
  const workspace = prepareWorkspace(doc.workspace);
  let exposure = null,
    engine = null;
  if (doc.exposure !== null) {
    exact(
      doc.exposure,
      "input_sha256 engine_commit report",
      "Exposure attachment",
    );
    if (
      !workspace.exposure_input ||
      (await digest(workspace.exposure_input)) !== doc.exposure.input_sha256
    )
      throw Error("Exposure report belongs to different input.");
    if (!/^[a-f0-9]{40}$/.test(doc.exposure.engine_commit))
      throw Error("Missing engine revision.");
    exposure = validateReport(doc.exposure.report, workspace);
    engine = doc.exposure.engine_commit;
  }
  return {
    bundle: structuredClone(doc.workspace),
    workspace,
    exposure,
    engine,
  };
}

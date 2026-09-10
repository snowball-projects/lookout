import { registerNavigation } from "./agent.js";
import { loadDocument, parseJSON, dec, cmp } from "./data.js";
const $ = (s) => document.querySelector(s),
  content = $("#content");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const short = (id) => id.replace(/^[^:]+:/, "").replaceAll("_", " ");
let labels = new Map(),
  accountLabels = new Map();
let state = null,
  original = null,
  filename = "",
  example = false,
  page = "holdings",
  account = "",
  search = "",
  sort = "value",
  selected = "",
  operation = 0;
const pct = (v, total) =>
  Number(total) > 0
    ? Math.min(100, Math.max(0, (Number(v) / Number(total)) * 100))
    : 0;
const display = (v) => {
  if (v === null) return "Unknown";
  let [a, b = ""] = v.split(".");
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (b ? "." + b : "");
};
function currency(v, price = false) {
  if (v === null) return "Unknown";
  const n = Number(v);
  if (n > 0 && n < (price ? 0.00000001 : 0.005))
    return (
      "<" + (price ? "0.00000001" : "0.01") + " " + state.workspace.currency
    );
  if (Math.abs(n) < 1e15) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: state.workspace.currency,
        maximumFractionDigits: price ? 8 : 2,
      }).format(n);
    } catch {}
  }
  return display(v) + " " + state.workspace.currency;
}
const width = (v) => `${Number.isFinite(v) ? v : 0}%`;
const label = (id) => labels.get(id) || short(id);
const accountLabel = (id) => accountLabels.get(id) || id;
function notice(message = "") {
  $("#notice").textContent = message;
}
function heading(title, subtitle) {
  return `<div class="page-head"><div><h1>${title}</h1><div class="subtitle">${subtitle}</div></div>${example ? '<span class="tag">Synthetic example</span>' : '<span class="tag">Imported file</span>'}</div>`;
}
function metric(label, value, unit = "") {
  return `<div class="metric"><div class="label">${label}</div><div class="value">${value}${unit ? `<small>${unit}</small>` : ""}</div></div>`;
}
function holdings() {
  const w = state.workspace,
    rows = w.holdings.filter(
      (h) =>
        (!account || h.account_id === account) &&
        `${label(h.instrument_id)} ${h.instrument_id} ${accountLabel(h.account_id)}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  rows.sort((a, b) =>
    sort === "name"
      ? label(a.instrument_id).localeCompare(label(b.instrument_id))
      : a.market_value === null
        ? b.market_value === null
          ? 0
          : 1
        : b.market_value === null
          ? -1
          : -cmp(dec(a.market_value), dec(b.market_value)),
  );
  const total = w.known_market_value,
    unknown = w.unpriced.length;
  content.innerHTML =
    heading(
      "Holdings",
      `Snapshot · ${esc(w.valuation_as_of)} · ${esc(w.currency)}`,
    ) +
    `<div class="metrics">${metric(unknown ? "Known value · incomplete" : "Portfolio value", esc(currency(total)))}${metric("Positions", w.holdings.length)}${metric("Accounts", state.bundle.accounts.length)}</div>${unknown ? `<div class="warning">${unknown} position${unknown === 1 ? " has" : "s have"} no price. Known value excludes these positions; a complete exposure calculation is unavailable.</div>` : ""}<div class="split"><section class="panel"><div class="panel-head"><h2>Positions <span class="muted">${rows.length}</span></h2><div class="controls"><input type="search" id="search" aria-label="Search positions" placeholder="Find a position" value="${esc(search)}"><select id="account" aria-label="Filter by account"><option value="">All accounts</option>${state.bundle.accounts.map((a) => `<option value="${esc(a.id)}" ${account === a.id ? "selected" : ""}>${esc(a.label)}</option>`).join("")}</select><select id="sort" aria-label="Sort positions"><option value="value" ${sort === "value" ? "selected" : ""}>Value ↓</option><option value="name" ${sort === "name" ? "selected" : ""}>Name A–Z</option></select></div></div><div class="table-scroll"><table><thead><tr><th>Instrument / account</th><th class="num">Quantity</th><th class="num">Price</th><th class="num">Value</th></tr></thead><tbody>${rows
      .slice(0, 200)
      .map(
        (h) =>
          `<tr><td><strong>${esc(label(h.instrument_id))}</strong><span class="cell-meta">${esc(h.instrument_id)} · ${esc(accountLabel(h.account_id))}</span></td><td class="num">${esc(display(h.quantity))}</td><td class="num ${h.quote ? "" : "unknown"}" title="${esc(h.quote ? `${h.quote.price} · ${h.quote.as_of}` : "No quote supplied")}">${h.quote ? esc(currency(h.quote.price, true)) : "Unknown"}</td><td class="num ${h.market_value === null ? "unknown" : "amount"}" title="${esc(h.market_value)}">${esc(currency(h.market_value))}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table>${rows.length > 200 ? '<p class="inline-note">Showing the first 200 matches. Narrow the search or choose an account.</p>' : rows.length ? "" : '<p class="empty">No matching positions.</p>'}</div><p class="inline-note">Values use the supplied quotes. Displayed money is rounded; exports retain the original precision.</p></section><aside class="sidebox"><h2>By account</h2>${state.bundle.accounts
      .filter((a) => !account || a.id === account)
      .slice(0, 200)
      .map(
        (a) =>
          `<div class="account"><div class="account-line"><span>${esc(a.label)}</span><span class="num">${esc(currency(w.account_known_values[a.id]))}</span></div><div class="bar"><div class="fill" style="width:${width(pct(w.account_known_values[a.id], total))}"></div></div>${w.unpriced.some((h) => h.account_id === a.id) ? '<span class="cell-meta unknown">Incomplete valuation</span>' : ""}</div>`,
      )
      .join(
        "",
      )}<p class="inline-note">${state.bundle.accounts.length > 200 && !account ? "First 200 accounts; use the account filter to inspect others." : unknown ? "Shares of known value." : "Each position retains its account origin."}</p></aside></div><details class="details"><summary>Sources for shown positions</summary>${rows
      .slice(0, 200)
      .map(
        (h) =>
          `<div class="trace"><strong>${esc(label(h.instrument_id))}</strong> · ${esc(accountLabel(h.account_id))}<div class="source-line">Holding: ${esc(h.as_of)} · ${esc(h.source.name)}<br>${esc(h.source.reference)} · retrieved ${esc(h.source.retrieved_at)}</div>${h.quote ? `<div class="source-line">Quote: ${esc(h.quote.as_of)} · ${esc(h.quote.source.name)}<br>${esc(h.quote.source.reference)} · retrieved ${esc(h.quote.source.retrieved_at)}</div>` : ""}</div>`,
      )
      .join("")}</details>`;
  $("#account").onchange = (e) => {
    account = e.target.value;
    render();
  };
  $("#sort").onchange = (e) => {
    sort = e.target.value;
    render();
  };
  $("#search").oninput = (e) => {
    const at = e.target.selectionStart;
    search = e.target.value;
    render();
    $("#search").focus();
    $("#search").setSelectionRange(at, at);
  };
}
function exposure() {
  const r = state.exposure,
    w = state.workspace;
  if (!r) {
    content.innerHTML =
      heading("Exposure", `Snapshot · ${esc(w.valuation_as_of)}`) +
      `<div class="empty"><h2>${w.valuation_complete ? "Add an exposure report" : "Some holdings need prices"}</h2><p>${w.valuation_complete ? "This file contains holdings only. Import a lookout file prepared with Moneyprinter to trace underlying fund positions." : "Complete the missing quotes before calculating fund exposure."}</p><button id="help-report">Preparing a report</button></div>`;
    $("#help-report").onclick = () => $("#about").showModal();
    return;
  }
  const total = r.portfolio.total_value,
    coverage = pct(r.coverage.resolved_value, total),
    rows = [...r.aggregates].sort((a, b) => -cmp(dec(a.value), dec(b.value)));
  const paths = selected
    ? r.paths.filter(
        (p) => p.subject_id === selected || p.path.includes(selected),
      )
    : [];
  const resolved = r.aggregates.filter((a) => a.status === "resolved");
  content.innerHTML =
    heading("Exposure", `Fund look-through · ${esc(w.valuation_as_of)}`) +
    `<div class="metrics">${metric("Underlying instruments", resolved.length)}${metric("Resolved value", esc(currency(r.coverage.resolved_value)))}${metric("Unresolved value", esc(currency(r.coverage.unresolved_value)))}</div>${r.warnings.length ? `<div class="warning">${r.warnings.map((x) => `<p>${esc(x.message)}</p>`).join("")}</div>` : ""}<div class="split"><section class="panel"><div class="panel-head"><h2>Underlying exposure</h2><span class="muted">Select an instrument to trace its sources</span></div><div class="table-scroll"><table><thead><tr><th>Instrument</th><th>Share of portfolio</th><th class="num">Value</th></tr></thead><tbody>${rows.map((a) => `<tr><td><button class="row-button" data-subject="${esc(a.subject_id)}" aria-pressed="${selected === a.subject_id}">${esc(label(a.subject_id))}</button><span class="cell-meta ${a.status === "unresolved" ? "unknown" : ""}">${a.status === "resolved" ? esc(a.kind) : "Unresolved · " + esc(a.reason.replaceAll("_", " "))}</span></td><td style="min-width:150px"><div>${pct(a.value, total).toFixed(1)}%</div><div class="bar"><div class="fill ${a.status === "unresolved" ? "amber-fill" : ""}" style="width:${width(pct(a.value, total))}"></div></div></td><td class="num ${a.status === "unresolved" ? "unknown" : "amount"}" title="${esc(a.value)}">${esc(currency(a.value))}</td></tr>`).join("")}</tbody></table></div>${selected ? `<section class="details" aria-live="polite"><div class="panel-head"><h2>Paths through ${esc(label(selected))}</h2><button id="close-trace" class="quiet">Close ×</button></div>${paths.map((p) => `<div class="trace"><div class="account-line"><span class="trace-path">${p.path.map((x) => esc(label(x))).join(" → ")}</span><span class="num">${esc(currency(p.value))}</span></div><div class="source-line">${p.status === "unresolved" ? "Unresolved: " + esc(p.reason.replaceAll("_", " ")) : "Resolved"}${p.expansions.map((e) => " · " + esc(e.source_name) + " (" + esc(e.snapshot_as_of) + ")").join("")}</div></div>`).join("")}</section>` : ""}</section><aside class="sidebox"><h2>Coverage</h2><div class="coverage">${Number(total) > 0 ? coverage.toFixed(1) + "%" : "—"}</div><div class="muted">${Number(total) > 0 ? "of portfolio value resolved" : "No positive portfolio value"}</div><div class="bar wide stack"><div class="fill" style="width:${width(coverage)}"></div><div class="fill amber-fill" style="width:${width(Number(total) > 0 ? 100 - coverage : 0)}"></div></div><div class="legend"><span><i></i>Resolved</span><span><i class="amber"></i>Unknown</span></div><p class="inline-note">Unreported fund weights stay unresolved instead of disappearing from the total.</p><details><summary>Report provenance</summary><p class="inline-note">Moneyprinter ${esc(r.engine_version)}<br>Revision ${esc(state.engine.slice(0, 12))}<br>Imported report; input association and accounting totals checked locally.</p></details></aside></div><details class="details"><summary>Fund snapshots · ${r.provenance.used_snapshots.length}</summary>${r.provenance.used_snapshots.map((s) => `<div class="trace"><strong>${esc(label(s.fund_id))}</strong> <span class="${s.stale ? "unknown" : "muted"}">${s.stale ? "Older than report threshold" : "Within report age threshold"}</span><div class="source-line">${esc(s.snapshot_as_of)} · ${s.age_days} days before valuation · ${esc(s.source_name)}<br>${esc(s.source_reference)} · retrieved ${esc(s.retrieved_at)}</div></div>`).join("")}</details>`;
  document.querySelectorAll("[data-subject]").forEach(
    (b) =>
      (b.onclick = () => {
        selected = b.dataset.subject;
        render();
      }),
  );
  if ($("#close-trace"))
    $("#close-trace").onclick = () => {
      selected = "";
      render();
    };
}
const pages = {
  holdings: { title: "Holdings", group: "Portfolio" },
  exposure: { title: "Exposure", group: "Portfolio" },
  allocation: {
    title: "Allocation",
    group: "Portfolio",
    planned: "Compare portfolio weights, constraints and risk scenarios.",
  },
  markets: {
    title: "Markets",
    group: "Research",
    planned: "Explore dated price history, volume and screening conditions.",
  },
  derivatives: {
    title: "Derivatives",
    group: "Research",
    planned: "Explore option prices, sensitivities and model assumptions.",
  },
  strategies: {
    title: "Strategies",
    group: "Research",
    planned:
      "Inspect historical strategy reports, costs and evaluation assumptions.",
  },
};
function render() {
  const route = location.hash.slice(1);
  page = Object.hasOwn(pages, route) ? route : "holdings";
  const view = pages[page];
  document.querySelectorAll("[data-page]").forEach((a) => {
    if (a.dataset.page === page) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("#crumb").textContent = view.title;
  $("#crumb-group").textContent = view.group;
  document.title = `${view.title} · lookout`;
  $("#export").disabled = !state;
  $("#clear").disabled = !state;
  $("#dataset").textContent = state
    ? `${example ? "Synthetic example" : filename} · ${state.workspace.valuation_as_of}`
    : "No file loaded";
  if (view.planned) {
    content.innerHTML = `<div class="page-head"><h1>${view.title}</h1><span class="tag">Planned</span></div><section class="empty"><p>${view.planned}</p><p class="muted">Not available in this release.</p></section>`;
    return;
  }
  if (!state) {
    content.innerHTML =
      '<div class="empty"><h1>Your portfolio, in view.</h1><p>Import a lookout JSON file or explore the synthetic example.</p><button id="empty-demo">Load example</button></div>';
    $("#empty-demo").onclick = demo;
    return;
  }
  page === "holdings" ? holdings() : exposure();
}
async function accept(text, name, isExample = false, ticket = ++operation) {
  const next = await loadDocument(parseJSON(text));
  if (ticket !== operation) return;
  state = next;
  labels = new Map(state.bundle.instruments.map((i) => [i.id, i.label]));
  accountLabels = new Map(state.bundle.accounts.map((a) => [a.id, a.label]));
  original = text;
  filename = name;
  example = isExample;
  account = "";
  search = "";
  selected = "";
  notice();
  render();
}
async function demo() {
  const ticket = ++operation;
  try {
    const response = await fetch("./example.json");
    if (!response.ok) throw Error("Could not load the example.");
    await accept(await response.text(), "Synthetic example", true, ticket);
  } catch (e) {
    if (ticket === operation) notice(e.message);
  }
}
$("#import").onclick = () => $("#file").click();
$("#file").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const ticket = ++operation;
  try {
    if (file.size > 5_000_000) throw Error("Files must be 5 MB or smaller.");
    await accept(await file.text(), file.name, false, ticket);
  } catch (e) {
    if (ticket === operation) notice("File not loaded. " + e.message);
  } finally {
    e.target.value = "";
  }
};
$("#demo").onclick = demo;
$("#export").onclick = () => {
  if (!original) return;
  const url = URL.createObjectURL(
    new Blob([original], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = example ? "lookout-example.json" : filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("#clear").onclick = () => {
  operation++;
  state = null;
  original = null;
  notice();
  render();
};
$("#info").onclick = () => $("#about").showModal();
window.addEventListener("hashchange", render);
render();
demo();

const agentLifecycle = registerNavigation(document.modelContext, (view) => {
  location.hash = view;
  render();
});
window.addEventListener("pagehide", () => agentLifecycle?.abort(), {
  once: true,
});

// Execute the interface against an in-memory element harness; no browser or network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("import, navigation, trace, error recovery, export and clear use the real app actions", async () => {
  const html = readFileSync(
    new URL("../web/index.html", import.meta.url),
    "utf8",
  );
  const fixture = readFileSync(
    new URL("../web/example.json", import.meta.url),
    "utf8",
  );
  const elements = new Map(),
    events = new Map(),
    requests = [],
    downloads = [];
  let content = "";
  function element() {
    return {
      value: "",
      textContent: "",
      disabled: false,
      dataset: {},
      setAttribute() {},
      removeAttribute() {},
      focus() {},
      setSelectionRange() {},
      showModal() {
        this.open = true;
      },
      click() {
        downloads.push(this);
      },
    };
  }
  for (const [, id] of html.matchAll(/id="([^"]+)"/g))
    elements.set("#" + id, element());
  Object.defineProperty(elements.get("#content"), "innerHTML", {
    get: () => content,
    set(v) {
      content = v;
      for (const [, id] of v.matchAll(/id="([^"]+)"/g))
        elements.set("#" + id, element());
    },
  });
  const nav = [
    "holdings",
    "exposure",
    "allocation",
    "markets",
    "derivatives",
    "strategies",
  ].map((page) => ({
    ...element(),
    dataset: { page },
  }));
  globalThis.document = {
    title: "lookout",
    querySelector: (s) => elements.get(s) || null,
    querySelectorAll(s) {
      if (s === "[data-page]") return nav;
      if (s === "[data-subject]")
        return [...content.matchAll(/data-subject="([^"]+)"/g)].map(
          ([, subject]) => {
            const key = "subject:" + subject;
            if (!elements.has(key))
              elements.set(key, { ...element(), dataset: { subject } });
            return elements.get(key);
          },
        );
      return [];
    },
    createElement: () => element(),
  };
  globalThis.location = { hash: "" };
  globalThis.window = { addEventListener: (name, fn) => events.set(name, fn) };
  let finishExample;
  globalThis.fetch = (url) => {
    requests.push(url);
    return new Promise((resolve) => {
      finishExample = () => resolve({ ok: true, text: async () => fixture });
    });
  };
  let exportBlob;
  const originalURL = URL.createObjectURL;
  URL.createObjectURL = (blob) => {
    exportBlob = blob;
    return "blob:local-test";
  };
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = () => {};
  try {
    await import("../web/app.js");
    assert.match(content, /Import a lookout JSON/);
    const fileInput = elements.get("#file");
    async function importText(text, name = "portfolio.json") {
      fileInput.files = [
        { name, size: Buffer.byteLength(text), text: async () => text },
      ];
      await fileInput.onchange({ target: fileInput });
    }
    const changed = JSON.parse(fixture).workspace;
    changed.holdings[0].quantity = "20";
    changed.instruments[0].label = "<img src=x onerror=alert(1)>";
    const raw = JSON.stringify(changed);
    await importText(raw);
    assert.match(content, /2,300\.00/);
    assert.match(content, /&lt;img/);
    assert.doesNotMatch(content, /<img src=x/);
    finishExample();
    await new Promise((r) => setTimeout(r, 50));
    assert.match(
      content,
      /2,300\.00/,
      "late startup example must not overwrite an imported portfolio",
    );
    const previous = content;
    await importText('{"bad":');
    assert.equal(content, previous);
    assert.match(elements.get("#notice").textContent, /File not loaded/);
    assert.deepEqual(
      requests,
      ["./example.json"],
      "imports must not issue network requests",
    );
    elements.get("#export").onclick();
    assert.equal(await exportBlob.text(), raw);
    assert.equal(downloads.at(-1).download, "portfolio.json");
    await importText(fixture, "report.json");
    location.hash = "#exposure";
    events.get("hashchange")();
    assert.match(content, /84\.6%/);
    assert.match(content, /Unresolved value/);
    elements.get("subject:ticker:ACME").onclick();
    assert.match(content, /Paths through Example security/);
    for (const page of ["allocation", "markets", "derivatives", "strategies"]) {
      location.hash = "#" + page;
      events.get("hashchange")();
      assert.match(content, /Planned/);
      assert.match(content, /Not available in this release/);
      assert.equal(
        elements.get("#crumb-group").textContent,
        page === "allocation" ? "Portfolio" : "Research",
      );
      assert.equal(elements.get("#export").disabled, false);
    }
    location.hash = "#holdings";
    events.get("hashchange")();
    assert.match(
      content,
      /1,300\.00/,
      "planned pages must preserve the imported workspace",
    );
    elements.get("#info").onclick();
    assert.equal(elements.get("#about").open, true);
    elements.get("#clear").onclick();
    assert.match(content, /Import a lookout JSON/);
    assert.equal(elements.get("#export").disabled, true);
    assert.equal(elements.get("#dataset").textContent, "No file loaded");
    location.hash = "#strategies";
    events.get("hashchange")();
    assert.match(
      content,
      /Planned/,
      "planned pages are available without portfolio data",
    );
    assert.equal(elements.get("#export").disabled, true);
  } finally {
    URL.createObjectURL = originalURL;
    URL.revokeObjectURL = originalRevoke;
  }
});

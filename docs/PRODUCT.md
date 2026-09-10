# Approved product decisions

The owner approved these decisions on September 9–10, 2026. They describe the
intended product. The current development interface implements Holdings and
Exposure on top of the offline foundation; the six-page public dashboard is not
yet complete.

## Website and catalog

- Product name: **lookout**, maintained by snowball.
- One website repository and deployment, with Portfolio (Holdings, Exposure,
  Allocation) and Research (Markets, Derivatives, Strategies).
- Show one lookout card on snowball's website, as a peer of the existing projects.
  Add it when a working dashboard is deployed and its destination is verified.
- Proposed concise card summary: “Explore portfolios, market data and financial
  models.” Adjust to the actually shipped capabilities before publication.
- Do not create separate catalog cards, branding pages or icons for Moneyprinter,
  OptionPricingEngine or marketbro merely because their repositories are retained.
  Explain the relevant engine and link its canonical public source/docs from
  lookout when available. Keep private repositories out of public source links
  until their publication is separately completed.
- An engine may merit a separate catalog entry later if the owner chooses to
  present it as an independently useful developer tool. This does not imply a
  hierarchy among snowball projects.

## Initial operating model

- Start with user-controlled file imports, manual/synthetic examples and
  local/offline calculations. Users should not need an account or provider key
  to explore the first release.
- Imported portfolio contents stay on the user's device. Preserve the original
  input and make any local persistence explicit and user-controlled; do not add
  uploads, telemetry or background account synchronization.
- Defer automatic account connections, shared live feeds and paid infrastructure
  until a concrete task justifies their data, maintenance and operating needs.
- Keep timestamps, source identity, missing coverage, calculation assumptions
  and model uncertainty visible. Imported historical data is not live data.
- Use lightweight browser calculations where suitable. Evaluate a bounded C++
  browser build for pricing against native fixtures before adopting it. Accept
  offline-generated reports for heavier research, with explicit engine/input
  provenance. A Python/C++ repository is not automatically a browser runtime.
- Do not add broker execution, other-user account management, signals sold as
  recommendations or an always-running research service to implement these pages.

## Implementation and verification

Design the shared contracts for all six pages, then build usable flows
incrementally. Do not publish empty tabs or claim every proposed experiment is
already implemented. Framework, internal module layout, adapters and numerical
libraries are implementation decisions, subject to measured correctness, size,
performance and maintainability rather than additional owner naming decisions.

Before launch, verify that selected files remain local, exports preserve source
and scenario identity, missing data fails clearly, calculations match independent
fixtures, workloads have useful limits/cancellation, and real flows work with
keyboard access and narrow screens. Avoid introducing network dependencies just
to render user-imported data. Data sources and third-party dependencies keep their
own terms; snowball-owned source uses MIT.

Repository boundaries and retirement decisions remain in
[REPOSITORIES.md](REPOSITORIES.md) and [PRESERVATION.md](PRESERVATION.md).

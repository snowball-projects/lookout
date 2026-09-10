// Optional browser-native agent navigation. Never exposes imported portfolio contents.
export function registerNavigation(context, navigate) {
  if (!context?.registerTool) return null;
  const lifecycle = new AbortController();
  try {
    Promise.resolve(
      context.registerTool(
        {
          name: "navigate_portfolio_view",
          title: "Open a portfolio view",
          description:
            "Open the Holdings or Exposure view of the current lookout workspace. Does not import, export or change portfolio data.",
          inputSchema: {
            type: "object",
            properties: {
              view: { type: "string", enum: ["holdings", "exposure"] },
            },
            required: ["view"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (
              !input ||
              typeof input !== "object" ||
              Object.keys(input).join() !== "view" ||
              !["holdings", "exposure"].includes(input.view)
            )
              throw Error("Choose holdings or exposure.");
            navigate(input.view);
            return { view: input.view };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {
    return null;
  }
  return lifecycle;
}

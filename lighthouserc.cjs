module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready",
      url: ["http://127.0.0.1:3000/"],
      numberOfRuns: 3,
      settings: { formFactor: "mobile", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 1, aggregationMethod: "median" }],
        "categories:accessibility": ["error", { minScore: 1, aggregationMethod: "median" }],
        "largest-contentful-paint": ["error", { maxNumericValue: 1500, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, aggregationMethod: "median" }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};

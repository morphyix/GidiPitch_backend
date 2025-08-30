// Global rules applied to all slides
const globalRules = `
IMPORTANT:
- Return ONLY valid RFC 8259 JSON
- Do NOT include markdown/code fences, comments, or extra text
- Ensure all text is concise, factual, and relevant
`;

// Reusable base prompt builder
const baseSlidePrompt = (title, fields) => `
${globalRules}
Create a "${title}" slide as a JSON object with:
${fields.map(f => `- ${f}`).join("\n")}
`;

// Generate pitch deck prompts using startup data
const pitchDeckSlidePrompt = (startupData) => ({
  cover: baseSlidePrompt("Cover", [
    `title: "${startupData.startupName}" or a concise pitch title`,
    `subtitle: A compelling tagline summarizing "${startupData.description}"`,
    `design: Visual theme based on brand color "${startupData.brandColor}" and style "${startupData.brandStyle || 'modern, minimal, professional'}"`,
    `imagePrompt: DALL·E/Midjourney prompt reflecting industry (${startupData.industry}) and sector (${startupData.sector})`,
    "example: A URL or file of a well-designed cover slide"
  ]),

  vision: baseSlidePrompt("Vision", [
    `statement: Bold, inspiring statement on ${startupData.startupName}'s long-term impact in ${startupData.country}`,
    "objectives: 3–5 measurable objectives",
    "dataPoints: Country-specific statistics (cite sources)",
    "imagePrompt: Futuristic, industry-focused symbol",
    "design: Impactful typography and visuals"
  ]),

  problem: baseSlidePrompt("Problem", [
    `problemStatements: Array of major problems from "${startupData.problems}"`,
    "demographic: Who is most affected, with statistics",
    "impact: Quantifiable economic/social effects (cite sources)",
    "urgency: Why solving it now matters, with trend data",
    "existingSolutions: Current market approaches and limitations",
    "dataSources: Array of credible URLs",
    "imagePrompt: Visual metaphor of the problem",
    "graphPrompt: Graph showing problem scale over last 5 years",
    "design: Layout emphasizing urgency"
  ]),

  solution: baseSlidePrompt("Solution", [
    `statements: How "${startupData.solutions}" addresses each problem`,
    `uniqueValue: Unique value proposition of "${startupData.startupName}"`,
    "benefits: Tangible customer benefits",
    `features: Core features from "${startupData.features}"`,
    "imagePrompt: Visual showing solution in action",
    "graphPrompt: Solution workflow diagram",
    "design: Clear professional layout"
  ]),

  market: baseSlidePrompt("Market", [
    `title: "Market Opportunity in ${startupData.country}"`,
    "totalMarketSizeUSD, TAM, SAM, SOM",
    "trends: Emerging growth trends",
    "growthRate: CAGR with timeline",
    `regulations: Key regulations in ${startupData.industry}`,
    "dataSources: Array of URLs",
    "graphPrompt: Market growth trend graph",
    "chartPrompt: Market segmentation pie chart",
    "design: Number-focused layout",
    "icons: Icons for size, growth, trends"
  ]),

  businessModel: baseSlidePrompt("Business Model", [
    `description: How "${startupData.businessModel}" works in practice`,
    "revenueStreams: All revenue sources",
    "imagePrompt: Business model canvas diagram",
    "design: Infographic-like layout"
  ]),

  goToMarket: baseSlidePrompt("Go-to-Market", [
    "description: Concise strategy plan",
    "channels: Digital & offline channels",
    "timeline: Launch and scale-up phases",
    "imagePrompt: Campaign visual",
    "graphPrompt: Funnel chart of acquisition flow",
    "design: Roadmap visual layout"
  ]),

  competition: baseSlidePrompt("Competition", [
    `Competitor objects: include "${startupData.competitors}" plus 2 more from ${startupData.country}`,
    "fields: name, similarities, differences, competitiveEdge, logoURL",
    "dataSources: URLs for market share",
    "design: Comparative table/quadrant",
    "imagePrompt: Competitive positioning map"
  ]),

  team: baseSlidePrompt("Team", [
    `members: From "${startupData.team}" with name, role, bio, socialLinks`,
    "imagePrompt: Professional team photo style",
    "design: Profile card layout"
  ]),

  financials: baseSlidePrompt("Financials", [
    "projections: Yearly revenue, expenses, profit (3–5 years)",
    "keyMetrics: LTV, CAC, break-even point",
    "dataSources: Industry benchmarks if used",
    "graphPrompt: Revenue vs Expenses line chart",
    "chartPrompt: Cost breakdown pie chart",
    "design: Clean financial table"
  ]),

  ask: baseSlidePrompt("Funding Ask", [
    `amount: ${startupData.askAmount}`,
    "useOfFunds: % breakdown",
    "milestones: Key deliverables tied to funding",
    "graphPrompt: Fund allocation bar chart",
    "design: Large funding number with visuals"
  ]),

  milestones: baseSlidePrompt("Milestones", [
    `completed: From "${startupData.milestones}" with dates`,
    "upcoming: Next 12 months plan",
    "design: Horizontal timeline",
    "imagePrompt: Progress path visual"
  ]),

  productDemo: baseSlidePrompt("Product Demo", [
    "description: Step-by-step walkthrough",
    "media: URL or placeholder for demo",
    "imagePrompt: Screenshot-style mockup",
    "design: Live demo showcase"
  ]),

  targetCustomers: baseSlidePrompt("Target Customers", [
    "profiles: 3–4 personas",
    "needs: Problems they want solved",
    "buyingBehavior: Purchase insights",
    "imagePrompt: Persona illustrations",
    "design: Profile card layout"
  ]),

  traction: baseSlidePrompt("Traction", [
    "metrics: User growth, revenue growth, partnerships",
    "proof: Testimonials, awards, press",
    "graphPrompt: Growth trend chart",
    "design: Metric-focused layout"
  ]),

  testimonials: baseSlidePrompt("Testimonials", [
    "quotes: Real or placeholder customer quotes",
    "imagePrompt: Smiling customer visuals",
    "design: Quote-focused layout"
  ]),

  exitStrategy: baseSlidePrompt("Exit Strategy", [
    "options: Acquisition, IPO, merger, buyout",
    `examples: Companies in ${startupData.country} with exits`,
    "dataSources: URLs for exit data",
    "design: Timeline or decision tree"
  ]),

  callToAction: baseSlidePrompt("Call To Action", [
    "statement: Strong investor CTA",
    "contact: Email, phone, website",
    "design: Bold, urgent tone"
  ]),

  thankYou: baseSlidePrompt("Thank You", [
    "message: Short gratitude message",
    "design: Minimal, warm visual",
    "imagePrompt: Appreciation-themed illustration"
  ]),

  caseStudies: baseSlidePrompt("Case Studies", [
    "examples: 1–2 mini case studies",
    "metrics: Before/after numbers",
    "dataSources: URLs for verification",
    "design: Side-by-side comparison"
  ]),

  contactInfo: baseSlidePrompt("Contact Info", [
    "email, phone, website, location",
    "design: Clear professional card style",
    "imagePrompt: Map with company location"
  ])
});

// Export
module.exports = { pitchDeckSlidePrompt };

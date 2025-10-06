// Global rules applied to all slides
const globalRules = `
IMPORTANT:
- Return ONLY valid RFC 8259 JSON
- No markdown, no comments, no extra text
- Each slide JSON must match this shape:
  {
    "slideType": "string",
    "title": "string",
    "bullets": ["string", "string"],
    "notes": "string",
    "layout": "default|title-bullets|image-text|full-image",
    "images": [
      { "prompt": "string", "caption": "string" }
    ]
  }
`;

// Base slide prompt builder
const baseSlidePrompt = (slideType, title, bullets, notes, layoutHint, imagePrompts) => `
${globalRules}
Generate a "${title}" slide with:
- slideType: "${slideType}"
- title: Short and compelling
- bullets: ${bullets}
- notes: ${notes}
- layout: Suggest one layout, prefer "${layoutHint}"
- images: ${imagePrompts}
`;

// Main slide prompt builder (core + industry + scope)
const pitchDeckSlidePrompt = (startupData) => {
  const scopeContext = startupData.scope
    ? `Focus on the operational scope: "${startupData.scope}" when describing context, opportunities, and examples.`
    : "";

  const slides = {
    cover: baseSlidePrompt(
      "cover",
      "Cover",
      "1–2 strong statements (startup name + tagline)",
      `Brief context about "${startupData.startupName}" in ${startupData.scope || "its target region"}.`,
      "full-image",
      `1 image prompt capturing brand color "${startupData.brandColor}", style "${startupData.brandStyle}", and industry "${startupData.industry}" within ${startupData.scope || "the target market"}`
    ),

    problem: baseSlidePrompt(
      "problem",
      "Problem",
      `3–4 concise problem statements affecting "${startupData.scope}" in the "${startupData.industry}" space from "${startupData.problems}".`,
      `Explain why solving these issues in ${startupData.scope || "the target region"} is urgent and impactful.`,
      "title-bullets",
      `1 metaphorical image prompt visualizing the key challenge within ${startupData.scope || "target market"}`
    ),

    solution: baseSlidePrompt(
      "solution",
      "Solution",
      `3–4 bullet points showing how "${startupData.solutions}" directly addresses the pain points in ${startupData.scope || "the operational region"}.`,
      `Why "${startupData.startupName}" is uniquely positioned in ${startupData.scope || "its target area"}.`,
      "image-text",
      `1 image prompt showing the product/service solving problems in ${startupData.scope || "target market"}`
    ),

    market: baseSlidePrompt(
      "market",
      "Market Opportunity",
      `Key market size estimates (TAM, SAM, SOM) relevant to ${startupData.scope || "target geography"}.`,
      `Explain the potential and market dynamics of ${startupData.industry} in ${startupData.scope || "the region"}.`,
      "title-bullets",
      `1 data visualization prompt showing market opportunity within ${startupData.scope || "target region"}`
    ),

    businessModel: baseSlidePrompt(
      "businessModel",
      "Business Model",
      `2–3 bullet points describing how "${startupData.businessModel}" operates and generates revenue in ${startupData.scope || "its key markets"}.`,
      `Explain the monetization strategy adapted for ${startupData.scope || "the operational landscape"}.`,
      "image-text",
      `1 image prompt showing the revenue flow or business canvas in ${startupData.scope || "target region"}`
    ),

    competitions: baseSlidePrompt(
      "competition",
      "Competitive Landscape",
      `Identify at least 3 major competitors in the "${startupData.industry}" sector within "${startupData.scope}". Use "${startupData.competitions}" as reference if provided.`,
      `Compare "${startupData.startupName}" with these competitors, focusing on differentiation in technology, pricing, customer focus, innovation, or reach within ${startupData.scope}.`,
      "title-bullets",
      `1 infographic image prompt comparing ${startupData.startupName} vs top 3 competitors in ${startupData.scope} (${startupData.industry} sector)`
    ),

    team: baseSlidePrompt(
      "team",
      "Team",
      `Founders and team members: ${startupData.team?.map(t => t.name).join(", ") || "List founders and advisors"}.`,
      `Show how the team’s experience aligns with success in ${startupData.scope || "target region"}.`,
      "image-text",
      "1 image prompt showing team portraits or symbolic leadership representation"
    ),

    financials: baseSlidePrompt(
      "financials",
      "Financials",
      "3–4 key projections or metrics relevant to the startup’s activities in its scope.",
      `Include growth outlook and funding utilization for ${startupData.scope || "target region"}.`,
      "title-bullets",
      `1 graph or chart prompt showing revenue growth projection for ${startupData.startupName} in ${startupData.scope || "target area"}`
    ),

    ask: baseSlidePrompt(
      "ask",
      "Funding Ask",
      [`Funding required: ${startupData.ask}`],
      `Describe how the funds will be used to expand operations within ${startupData.scope || "target region"} and achieve key milestones.`,
      "title-bullets",
      `1 image prompt showing funding allocation or milestone roadmap in ${startupData.scope || "target geography"}`
    ),
  };

  // Industry-specific slides
  const industry = (startupData.industry || "").toLowerCase();

  if (industry === "healthtech" || industry === "biotech") {
    slides.compliance = baseSlidePrompt(
      "compliance",
      "Compliance & Regulation",
      [
        `Certifications: ${startupData.compliance || "HIPAA, GDPR, FDA pathways"}`,
        `Local compliance in ${startupData.scope || "target region"}`,
        "Future regulatory roadmap"
      ],
      "Highlight trust and adherence to regional standards.",
      "image-text",
      `1 image prompt showing health compliance and data protection visuals in ${startupData.scope || "target area"}`
    );

    slides.validation = baseSlidePrompt(
      "validation",
      "Clinical Validation",
      [
        `Evidence: ${startupData.clinicalValidation || "Clinical trials, pilots, or partnerships"}`,
        `Validation status within ${startupData.scope || "operational region"}`
      ],
      "Prove scientific and clinical credibility.",
      "title-bullets",
      `1 image prompt showing healthcare or research validation results in ${startupData.scope || "target market"}`
    );
  }

  if (industry === "fintech") {
    slides.security = baseSlidePrompt(
      "security",
      "Security & Risk",
      [
        `Practices: ${startupData.security || "KYC/AML, fraud detection, encryption"}`,
        `Regional regulations followed in ${startupData.scope || "target region"}`
      ],
      "Highlight data protection and trust mechanisms.",
      "image-text",
      `1 image prompt showing fintech data protection or encryption visual in ${startupData.scope || "target region"}`
    );

    slides.regulation = baseSlidePrompt(
      "regulation",
      "Compliance & Licensing",
      [
        `Licenses: ${startupData.compliance || "SEC, FCA, CBN, or equivalent authorities"}`,
        `Status and process in ${startupData.scope || "target region"}`
      ],
      "Demonstrate readiness for regional compliance.",
      "title-bullets",
      `1 image prompt showing fintech compliance approvals in ${startupData.scope || "target region"}`
    );
  }

  if (industry === "edtech") {
    slides.adoption = baseSlidePrompt(
      "adoption",
      "Adoption & Partnerships",
      [
        `Institutions: ${startupData.educationPartnerships?.join(", ") || "Schools, universities, ministries"}`,
        `Adoption metrics and pilots within ${startupData.scope || "target region"}`
      ],
      "Show traction and collaboration strength.",
      "image-text",
      `1 image prompt showing teachers/students using digital tools in ${startupData.scope || "region"}`
    );

    slides.outcomes = baseSlidePrompt(
      "outcomes",
      "Learning Outcomes",
      [
        `Results: ${startupData.outcomes || "Improved engagement, retention, or test performance"}`,
        `Quantify educational improvements within ${startupData.scope || "region"}`
      ],
      "Prove the educational impact of your solution.",
      "title-bullets",
      `1 image prompt showing improved learning results in ${startupData.scope || "region"}`
    );
  }

  return slides;
};

// Generate prompts for selected slides
const generatePromptsForSlides = (startupData, slides) => {
  const allPrompts = pitchDeckSlidePrompt(startupData);
  const selectedPrompts = {};

  if (!Array.isArray(slides)) {
    console.warn("⚠️ Expected slides to be an array, received:", typeof slides);
    return {};
  }

  slides.forEach(slide => {
    if (allPrompts[slide]) selectedPrompts[slide] = allPrompts[slide];
  });

  return selectedPrompts;
};

// Allowed slide types
const getAllowedSlides = (industry) => {
  const baseSlides = [
    'cover', 'problem', 'solution', 'market',
    'businessModel', 'competitions', 'team', 'financials', 'ask'
  ];

  const industrySlides = {
    healthtech: ["compliance", "validation"],
    biotech: ["compliance", "validation"],
    fintech: ["security", "regulation"],
    edtech: ["adoption", "outcomes"],
  };

  const extra = industrySlides[industry.toLowerCase()] || [];
  return [...baseSlides, ...extra];
};

module.exports = { generatePromptsForSlides, getAllowedSlides };

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
  const {
    startupName, industry, scope, problems, solutions,
    brandColor, brandStyle, competitions, businessModel,
    milestones, financials, ask, team, moreInfo, features
  } = startupData;

  const scopeContext = scope
    ? `Focus on the operational scope: "${scope}" when describing context, opportunities, and examples.`
    : "";

  // Helper to ensure team is handled gracefully
  const teamNames = team?.map(t => t.name).join(", ") || "Founders and key executives";

  const slides = {
    // 1. Cover Slide
    cover: baseSlidePrompt(
      "cover",
      "Cover",
      // Use startupName, scope, businessModel, solutions, and industry for a unique tagline
      `1–2 strong statements positioning "${startupName}" as the ${businessModel} solution for ${problems} in the ${industry} sector within ${scope || "its target region"}.`,
      `Brief context about "${startupName}" in ${scope || "its target region"}, focusing on its unique value proposition based on "${solutions}".`,
      "full-image",
      // Use brand attributes for visual
      `1 image prompt capturing brand color "${brandColor}", style "${brandStyle}", and industry "${industry}" within ${scope || "the target market"}`
    ),

    // 2. Problem Slide
    problem: baseSlidePrompt(
      "problem",
      "Problem",
      `3–4 concise problem statements from "${problems}" affecting ${scope || "the target market"} in the "${industry}" space.`,
      `Explain why solving these specific issues in ${scope || "the target region"} is urgent and highly impactful.`,
      "title-bullets",
      `1 metaphorical image prompt visualizing the key challenge related to "${problems}" within ${scope || "target market"}`
    ),

    // 3. Solution Slide
    solution: baseSlidePrompt(
      "solution",
      "Solution",
      // Link solutions directly to problems and scope
      `3–4 bullet points showing how "${solutions}" directly addresses the pain points in ${scope || "the operational region"}, emphasizing the core innovation.`,
      `Why "${startupName}" is uniquely positioned to deliver this solution in ${scope || "its target area"} compared to existing alternatives.`,
      "image-text",
      `1 image prompt showing the product/service "${solutions}" solving problems in ${scope || "target market"}`
    ),

    // 4. Product/Features Slide
    product: baseSlidePrompt(
      "product",
      "Product & Features",
      // Detail the features and their benefits
      `3–4 key features of the product/service based on "${features}" and how they translate into tangible benefits for the user in the ${industry} sector.`,
      `Describe the current development stage (e.g., MVP, beta, live) and the core technology stack used by "${startupName}".`,
      "image-text",
      // Use imageGenType for product visuals
      `1 image prompt of a user interface (UI) or product concept, using the imageGenType: "${startupData.imageGenType}" and brandStyle: "${brandStyle}"`
    ),

    // 5. Market Opportunity Slide
    market: baseSlidePrompt(
      "market",
      "Market Opportunity",
      // Include key market size estimates (TAM, SAM, SOM)
      `Key market size estimates (TAM, SAM, SOM) relevant to "${industry}" within ${scope || "target geography"}, quantifying the opportunity.`,
      `Explain the potential for rapid growth and the current market dynamics of ${industry} in ${scope || "the region"}.`,
      "title-bullets",
      `1 data visualization prompt showing market opportunity size and growth within ${scope || "target region"}`
    ),

    // 6. Business Model Slide
    businessModel: baseSlidePrompt(
      "businessModel",
      "Business Model",
      // Detail the revenue generation and pricing adapted for the scope
      `2–3 bullet points describing how "${businessModel}" operates, its pricing strategy, and how it generates scalable revenue in ${scope || "its key markets"}.`,
      `Explain the unit economics and the monetization strategy adapted for ${scope || "the operational landscape"}.`,
      "image-text",
      `1 image prompt showing the revenue flow diagram or business canvas model in ${scope || "target region"}`
    ),

    // 7. Go-to-Market Strategy
    goMarket: baseSlidePrompt(
      "goMarket",
      "Go-to-Market Strategy",
      // Use businessModel, features, scope, and solutions to craft the strategy
      `3–4 key channels (e.g., digital, direct sales, partnerships) for reaching the target customer in ${scope || "the region"} based on "${businessModel}".`,
      `Outline the customer acquisition cost (CAC) and lifetime value (LTV) strategy, emphasizing how "${features}" and "${solutions}" drive adoption.`,
      "title-bullets",
      `1 image prompt visualizing a marketing funnel or customer acquisition strategy map for ${startupName} in ${scope || "target area"}`
    ),

    // 8. Competitive Landscape Slide
    competitions: baseSlidePrompt(
      "competition",
      "Competitive Landscape & Moat",
      // Identify competitors and focus on unique advantages
      `Identify at least 3 major competitors in the "${industry}" sector within "${scope}". Use "${competitions}" as reference if provided.`,
      `Compare "${startupName}" with these competitors, focusing on its sustainable competitive advantage (Moat) derived from "${solutions}" and "${features}".`,
      "title-bullets",
      `1 infographic image prompt comparing ${startupName} vs top 3 competitors in ${scope} (${industry} sector), highlighting key differentiation factors`
    ),

    // 9. Milestones & Traction
    milestones: baseSlidePrompt(
      "milestones",
      "Milestones & Traction",
      // Use milestones and features
      `3–4 major achievements to date, including key metrics (e.g., users, revenue, product releases) and future goals from "${milestones}".`,
      `Quantify the current traction in ${scope || "target region"} and link past milestones to future product developments based on "${features}".`,
      "title-bullets",
      `1 timeline or roadmap image prompt showing past achievements and future product milestones for ${startupName}`
    ),

    // 10. Team Slide
    team: baseSlidePrompt(
      "team",
      "Team",
      `Founders and team members: ${teamNames}. Highlight 1–2 key relevant experiences or domain expertise.`,
      `Show how the team’s combined experience and expertise are critical for success in the "${industry}" sector within ${scope || "target region"}.`,
      "image-text",
      "1 image prompt showing team portraits or symbolic representation of diverse, expert leadership"
    ),

    // 11. Financials Slide
    financials: baseSlidePrompt(
      "financials",
      "Financials & Projections",
      // Use financials data
      `3–4 key financial metrics or projections (e.g., historical revenue, 3-year forecast, burn rate) relevant to the startup's activities in ${scope}. Use "${financials}" as primary data.`,
      `Include growth outlook, key assumptions, and the path to profitability for ${scope || "target region"}.`,
      "title-bullets",
      `1 graph or chart prompt showing revenue growth projection and key financial milestones for ${startupName} in ${scope || "target area"}`
    ),

    // 12. Industry Specifics & Partnerships (NEW - uses moreInfo)
    industrySpecific: baseSlidePrompt(
      "industrySpecific",
      `Industry & ${industry === "fintech" || industry === "healthtech" ? "Regulation" : "Key Partnerships"}`,
      // Use moreInfo for compliance/partnerships/etc.
      `2–3 critical industry-specific details, such as compliance requirements, strategic partnerships, or IP status, captured in "${moreInfo}".`,
      `Explain how ${startupName} navigates the regulatory or partnership landscape in ${scope || "target region"} to maintain a competitive edge.`,
      "image-text",
      `1 image prompt showing visuals related to compliance, strategic alliances, or proprietary technology in the ${industry} sector within ${scope || "target region"}`
    ),

    // 13. Funding Ask Slide
    ask: baseSlidePrompt(
      "ask",
      "Funding Ask & Use of Funds",
      // Use ask data
      [`Funding required: ${ask}`],
      `Describe in detail how the funds will be used to achieve the next 18–24 months of milestones (from "${milestones}") and expand operations within ${scope || "target region"}.`,
      "title-bullets",
      `1 image prompt showing funding allocation pie chart or milestone roadmap tied to the capital raise in ${scope || "target geography"}`
    ),

    // 14. Appendix/Contact Slide
    contact: baseSlidePrompt(
      "contact",
      "Contact & Next Steps",
      [`Contact Information: (email) | Website: (url)`],
      `A call to action for investors, suggesting a demo or follow-up meeting.`,
      "full-image",
      `1 abstract image prompt capturing brand color "${brandColor}" and style "${brandStyle}" to serve as a strong closing visual`
    ),
  };

  // --- Industry-specific slides (CORRECTED LOGIC: Bullets are now a single string instruction) ---

  const industryLower = (industry || "").toLowerCase();

  if (industryLower === "healthtech" || industryLower === "biotech") {
    slides.compliance = baseSlidePrompt(
      "compliance",
      "Compliance & Regulation",
      // Combined into a single string instruction
      `REQUIRED BULLETS:
1. Regulatory Status: ${moreInfo.includes("FDA") || moreInfo.includes("EMA")
          ? "Currently pursuing key regulatory pathways (e.g., FDA/CE Mark). Founder's detailed note on status: " + moreInfo
          : "Adhering to relevant local health data privacy standards (e.g., HIPAA/GDPR) across " + scope + "."}
2. Key Certifications and Compliance Details: ${moreInfo || "HIPAA, GDPR, or equivalent local health data standards."}
3. Local compliance roadmap in ${scope || "target region"}`,
      `Highlight trust, data security, and adherence to regional healthcare standards to de-risk investment. IMPORTANT: Use the full context of "${moreInfo}" to elaborate on the regulatory status and risks.`,
      "image-text",
      `1 image prompt showing health compliance, secure data management, or regulatory approval badges in ${scope || "target area"}`
    );

    slides.validation = baseSlidePrompt(
      "validation",
      "Clinical Validation & IP",
      // Combined into a single string instruction
      `REQUIRED BULLETS:
1. Evidence/Validation: ${moreInfo.includes("clinical trial") || moreInfo.includes("pilot")
          ? "Strong validation results based on founder data: " + moreInfo
          : "Early academic validation or robust pilot program results."}
2. IP Status: ${moreInfo.includes("patent")
          ? "Key technology is patent-pending or granted. Further IP details: " + moreInfo
          : "Proprietary algorithms/data are protected via trade secrets."}`,
      `Prove scientific credibility and show proprietary advantage. IMPORTANT: Reference specific details from "${moreInfo}" for validation results, efficacy, and IP status.`,
      "title-bullets",
      `1 image prompt showing healthcare or research validation results, focusing on patient/data outcomes in ${scope || "target market"}`
    );
  }

  if (industryLower === "fintech") {
    slides.security = baseSlidePrompt(
      "security",
      "Security & Risk Mitigation",
      // Combined into a single string instruction
      `REQUIRED BULLETS:
1. Security Practices: ${moreInfo.includes("KYC") || moreInfo.includes("AML")
          ? "Robust KYC/AML and fraud detection systems. Founder added specific details: " + moreInfo
          : "Bank-grade encryption (e.g., AES-256) for all sensitive data in " + scope + "."}
2. Risk Mitigation & Audits: ${moreInfo.includes("audit")
          ? "Successfully completed a third-party audit. Audit details: " + moreInfo
          : "Active fraud loss rate is below industry average."}`,
      `Highlight data protection, operational security, and trust mechanisms to assure investors. IMPORTANT: Use the context of "${moreInfo}" to elaborate on specific security and audit details.`,
      "image-text",
      `1 image prompt showing fintech data protection, encryption, and secure transaction visual in ${scope || "target region"}`
    );

    slides.regulation = baseSlidePrompt(
      "regulation",
      "Compliance & Licensing",
      // Combined into a single string instruction
      `REQUIRED BULLETS:
1. Key Licenses: ${moreInfo.includes("license")
          ? "Holds or is pursuing key financial licenses (e.g., MTO, EMI) in " + scope + ". Specifics provided by founder: " + moreInfo
          : "Operates under a trusted partner's license or a compliant model."}
2. Compliance Roadmap: ${moreInfo.includes("authority")
          ? "Status and process for achieving full compliance with regional authorities. Founder note: " + moreInfo
          : "Following local financial regulations and seeking future licenses."}`,
      `Demonstrate readiness and adherence to regional financial compliance standards. IMPORTANT: Incorporate specifics from "${moreInfo}" regarding regulatory status and licensing.`,
      "title-bullets",
      `1 image prompt showing fintech compliance, regulatory approvals, or licensing seals in ${scope || "target region"}`
    );
  }

  if (industryLower === "edtech") {
    slides.adoption = baseSlidePrompt(
      "adoption",
      "Adoption & Strategic Partnerships",
      // Combined into a single string instruction
      `REQUIRED BULLETS:
1. Strategic Partners: ${moreInfo.includes("ministry") || moreInfo.includes("district")
          ? "Key partnerships established with education institutions. Founder's details: " + moreInfo
          : "Successful pilot programs in key schools/institutions across ${scope}."}
2. Adoption Metrics: ${moreInfo.includes("users") || moreInfo.includes("engagement")
          ? "High user adoption and engagement rates. Specific metrics: " + moreInfo
          : "Rapid increase in student adoption in the last quarter."}`,
      `Show traction and strong collaboration strength in the education ecosystem. IMPORTANT: Use "${moreInfo}" to elaborate on partnership status and quantifiable adoption metrics.`,
      "image-text",
      `1 image prompt showing teachers/students using digital learning tools and educational collaboration in ${scope || "region"}`
    );

    slides.outcomes = baseSlidePrompt(
      "outcomes",
      "Learning Outcomes & Pedagogy",
      // Combined into a single string instruction
      `REQUIRED BULLETS:
1. Impact: ${moreInfo.includes("test score") || moreInfo.includes("retention")
          ? "Proven link to measurable student improvements. Founder notes: " + moreInfo
          : "Significant improvements in student engagement and retention rates."}
2. Pedagogy: Explain how the solution aligns with modern learning theories. Alignment specifics from founder: ${moreInfo.includes("curriculum") ? moreInfo : "Global education best practices."}`,
      `Prove the quantifiable educational impact and academic rigor of your solution. IMPORTANT: Incorporate specific results and curriculum alignment details from "${moreInfo}".`,
      "title-bullets",
      `1 image prompt showing quantifiable improved learning results or a graph of academic progress in ${scope || "region"}`
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
    'cover', 'problem', 'solution', 'product', 'market',
    'businessModel', 'goMarket', 'competitions', 'milestones',
    'team', 'financials', 'industrySpecific', 'ask', 'contact' // All new and old core slides
  ];

  const industrySlides = {
    healthtech: ["compliance", "validation"],
    biotech: ["compliance", "validation"],
    fintech: ["security", "regulation"],
    edtech: ["adoption", "outcomes"],
  };

  const extra = industrySlides[(industry || "").toLowerCase()] || [];
  return [...baseSlides, ...extra];
};

module.exports = { generatePromptsForSlides, getAllowedSlides };

// Global rules applied to all slides - *CRUCIAL CONTEXT ADDED*
const globalRules = (startupData) => {
    const { startupName, industry, scope, problems, solutions, financials, milestones, ask } = startupData;

    // Condense all core data into a single, cohesive context block
    const allContext = `
        STARTUP NAME: ${startupName}
        INDUSTRY / SCOPE: ${industry} within ${scope || "Global Market"}
        CORE PROBLEM: ${problems}
        CORE SOLUTION / VALUE: ${solutions}
        TRACTION / MILESTONES: ${milestones}
        FINANCIALS / ASK: Ask is ${ask}. Key financials are ${financials}.
    `;

    return `
IMPORTANT NARRATIVE & FORMATTING RULES:
- Return ONLY valid RFC 8259 JSON
- No markdown, no comments, no extra text
- The generated content for this slide **MUST BE FACTUAL, QUANTIFIED, AND CONSISTENT** with the "FULL PITCH CONTEXT" provided below.
- Do not generate speculative content or "hallucinations." Stick to analyzing the provided context data.
- Keep all bullets brief, concise, and persuasive (max 3 bullets per slide).
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

FULL PITCH CONTEXT:
${allContext}
`;
};

// Optimized Base slide prompt builder (Now accepts startupData for global context)
const baseSlidePrompt = (slideType, titlePrefix, bulletsInstruction, notesInstruction, layoutHint, imagePrompts, startupData) => {
  
  // Enforce the title format: "SlideType: The Compelling Topic"
  const title = `${titlePrefix}: Short, compelling phrase that frames the slide's key takeaway. (Must reference context data)`;

  return `
${globalRules(startupData)}

TASK: Generate the JSON for the "${titlePrefix}" slide.

Generate a "${titlePrefix}" slide with:
- slideType: "${slideType}"
- title: ${title}
- bullets: Generate a maximum of **3 brief, high-impact, quantifiable bullet points**. The content MUST be based on and explicitly reference the context data: ${bulletsInstruction}
- notes: The note must be concise and persuasive, and **MUST draw specific facts or data** from the "FULL PITCH CONTEXT" block: ${notesInstruction}
- layout: Suggest one layout, prefer "${layoutHint}"
- images: ${imagePrompts}
`;
};

// Main slide prompt builder (core + industry + scope) - *FINAL OPTIMIZATION*
const pitchDeckSlidePrompt = (startupData) => {
  const {
    startupName, industry, scope, problems, solutions,
    brandColor, brandStyle, competitions, businessModel,
    milestones, financials, ask, team, moreInfo, features
  } = startupData;

  const scopeContext = scope
    ? `Focus on the operational scope: "${scope}" when describing context, opportunities, and examples.`
    : "";

  const teamNames = team?.map(t => t.name).join(", ") || "Founders and key executives";

  const slides = {
    // 1. Cover Slide - *STRICTLY CONCISE*
    cover: baseSlidePrompt(
      "cover",
      "Cover",
      // Bullets instruction for the cover is now a single, catchy tagline
      `Generate a single, **catchy, investor-appealing tagline** (max 10 words) that immediately sells the core idea. MUST reference "${startupName}", "${industry}", and "${solutions}".`,
      // Notes for the cover should be EMPTY as per investor deck best practices
      `Return an empty string for the notes field.`,
      "full-image",
      `1 image prompt capturing brand color "${brandColor}", style "${brandStyle}", and industry "${industry}" within ${scope || "the target market"}`,
      startupData
    ),

    // 2. Problem Slide - *DATA DRIVEN PROBLEM*
    problem: baseSlidePrompt(
      "problem",
      "Problem: The Quantified Pain",
      `3 bullet points: Each must be a **specific, quantified problem statement** derived from the "CORE PROBLEM" context, highlighting its financial impact (e.g., "$5M lost annually due to X").`,
      `Explain the "Why Now?"—why this problem is critical and timely to solve in ${scope || "the target region"}, referencing the severity stated in the context.`,
      "title-bullets",
      `1 metaphorical image prompt visualizing the key challenge related to "${problems}" within ${scope || "target market"}`,
      startupData
    ),

    // 3. Solution Slide - *DATA DRIVEN VALUE*
    solution: baseSlidePrompt(
      "solution",
      "Solution: The Value Proposition",
      `3 bullet points: Explain how the "CORE SOLUTION / VALUE" directly addresses the quantified pain points, focusing on **measurable benefits** (e.g., "Saves $X and Y hours/week"). **MUST link back to the pain points in the context.**`,
      `Briefly describe the core innovation ("Magic") that makes this solution possible or superior to current alternatives.`,
      "image-text",
      `1 image prompt showing the product/service "${solutions}" solving problems in ${scope || "target market"}`,
      startupData
    ),

    // 4. Product/Features Slide - *TRACTION FIRST*
    product: baseSlidePrompt(
      "product",
      "Product & Traction",
      `3 bullet points: 1. The **most defensible feature** from "${features}". 2. The **key traction metric** from the "TRACTION / MILESTONES" context (e.g., "30k MRR," "10k Active Users"). 3. The current **development stage**.`,
      `Describe the core technology and how the features deliver a superior user experience, consistent with the solutions described in the context.`,
      "image-text",
      `1 image prompt of a user interface (UI) or product concept, using the imageGenType: "${startupData.imageGenType}" and brandStyle: "${brandStyle}"`,
      startupData
    ),

    // 5. Market Opportunity Slide - *QUANTIFIED MARKET*
    market: baseSlidePrompt(
      "market",
      "Market Opportunity: Size & Growth",
      `3 bullet points: 1. **Quantified TAM** estimate relevant to the "${industry}" context. 2. **Quantified SOM** focused on ${scope || "target geography"}. 3. The **growth rate or key trend** driving market expansion.`,
      `Explain the market dynamics and identify the specific beachhead market where "${startupName}" will focus for the next 12 months.`,
      "title-bullets",
      `1 data visualization prompt showing market opportunity size (TAM/SOM) and growth within ${scope || "target region"}`,
      startupData
    ),

    // 6. Business Model Slide - *UNIT ECONOMICS*
    businessModel: baseSlidePrompt(
      "businessModel",
      "Business Model & Unit Economics",
      `3 bullet points: 1. Primary **revenue stream** (from "${businessModel}") and **ASP**. 2. Clear statement on **Unit Economics** (e.g., "LTV $X / CAC $Y = Ratio Z"). 3. Key channel for margin defense/cost reduction. **Must be consistent with the solution's nature in the context.**`,
      `Explain the key drivers for revenue scalability (e.g., network effects, low marginal cost) in ${scope || "the operational landscape"}.`,
      "image-text",
      `1 image prompt showing the revenue flow diagram or business canvas model in ${scope || "target region"}`,
      startupData
    ),

    // 7. Go-to-Market Strategy - *SCALABLE CHANNELS*
    goMarket: baseSlidePrompt(
      "goMarket",
      "Go-to-Market (GTM) Strategy",
      `3 bullet points outlining the **three most efficient customer acquisition channels** for ${scope || "the region"}, including a mention of the estimated customer acquisition cost (CAC) or conversion rate. **MUST reference "${businessModel}" and "${features}" for channel choice.**`,
      `Outline the early sales process and the scaling plan for achieving a defensible distribution advantage.`,
      "title-bullets",
      `1 image prompt visualizing a marketing funnel or customer acquisition strategy map for ${startupName} in ${scope || "target area"}`,
      startupData
    ),

    // 8. Competitive Landscape Slide - *THE MOAT*
    competitions: baseSlidePrompt(
      "competition",
      "Competitive Moat & Advantage",
      `3 bullet points: 1. Identification of **2-3 closest competitors** (from "${competitions}"). 2. Clear statement on "${startupName}'s" **unique, sustainable competitive advantage (Moat)** derived from the "CORE SOLUTION" in the context. 3. Key difference **quantified**.`,
      `Justify why competitors have not successfully addressed the problem or why the timing is right for disruption.`,
      "title-bullets",
      `1 infographic image prompt comparing ${startupName} vs top 3 competitors in ${scope} (${industry} sector), highlighting key differentiation factors`,
      startupData
    ),

    // 9. Milestones & Traction - *FUTURE LOOKING*
    milestones: baseSlidePrompt(
      "milestones",
      "Traction & Future Timeline",
      `3 bullet points: 1. **Most impressive historical metric** from the "TRACTION / MILESTONES" context. 2. The **specific, measurable 6-month goal** to be hit with this funding. 3. The **major outcome/milestone** that triggers the next funding round.`,
      `Quantify the current momentum and demonstrate a credible plan to achieve significant growth based on the context's milestones.`,
      "title-bullets",
      `1 timeline or roadmap image prompt showing past achievements and future product milestones for ${startupName}`,
      startupData
    ),

    // 10. Team Slide - *FIT FOR PURPOSE*
    team: baseSlidePrompt(
      "team",
      "Team: Fit for Execution",
      `3 bullet points: 1. Highlight the **most relevant domain expertise** of the founders (${teamNames}). 2. Mention the **collective experience**. 3. The team's unique network or competitive advantage in ${scope} within the "${industry}" context.`,
      `Emphasize why this specific team's background, resilience, and network are uniquely suited to execute the plan.`,
      "image-text",
      "1 image prompt showing team portraits or symbolic representation of diverse, expert leadership",
      startupData
    ),

    // 11. Financials Slide - *FACTUAL PROJECTIONS*
    financials: baseSlidePrompt(
      "financials",
      "Financial Projections & Outlook",
      `3 bullet points: 1. **Historical Revenue or MRR** and **current burn rate**. 2. **3-Year Revenue Forecast** (clear, high number). 3. **Key Assumption** driving the growth. **MUST use the facts/figures from the "FINANCIALS / ASK" context block.**`,
      `Briefly describe the key assumptions underpinning the projections and the projected path to profitability within the next 3-5 years.`,
      "title-bullets",
      `1 graph or chart prompt showing revenue growth projection and key financial milestones for ${startupName} in ${scope || "target area"}`,
      startupData
    ),

    // 12. Industry Specifics & Partnerships - *DERISKING*
    industrySpecific: baseSlidePrompt(
      "industrySpecific",
      `Industry & ${industry === "fintech" || industry === "healthtech" ? "Regulation" : "Key Partnerships"}`,
      `3 bullet points outlining **2 critical derisking factors** (e.g., partnership, IP, compliance status) and **1 key strategic asset** (e.g., proprietary data, regulatory advantage). **MUST use specific details from "${moreInfo}"**.`,
      `Explain how ${startupName} leverages its unique position to overcome industry-specific barriers or accelerates growth.`,
      "image-text",
      `1 image prompt showing visuals related to compliance, strategic alliances, or proprietary technology in the ${industry} sector within ${scope || "target region"}`,
      startupData
    ),

    // 13. Funding Ask Slide - *FUNDS UTILIZATION*
    ask: baseSlidePrompt(
      "ask",
      "The Ask & Use of Funds",
      `3 bullet points: 1. **Total Funding Amount** and **Round Type** (from "FINANCIALS / ASK" context). 2. The **clear breakdown** of funds use (e.g., "70% Product, 30% GTM"). 3. The **single biggest milestone** the fund will achieve (from "TRACTION / MILESTONES" context).`,
      `Describe the expected runway (e.g., 18 months) and the key metrics/valuation target for the next funding round.`,
      "title-bullets",
      `1 image prompt showing funding allocation pie chart or milestone roadmap tied to the capital raise in ${scope || "target geography"}`,
      startupData
    ),

    // 14. Contact/Call to Action Slide - *FINAL CTA*
    contact: baseSlidePrompt(
      "contact",
      "Next Steps & Contact",
      `2 bullet points: 1. **Clear Call-to-Action** for the investor (e.g., "Schedule a Demo" or "Discuss Term Sheet"). 2. Key contact information (Email and Website).`,
      `A final, brief statement of conviction and excitement about the opportunity.`,
      "full-image",
      `1 abstract image prompt capturing brand color "${brandColor}" and style "${brandStyle}" to serve as a strong closing visual`,
      startupData
    ),
  };

  // --- Industry-specific slides (STRICTLY DATA DRIVEN) ---

  const industryLower = (industry || "").toLowerCase();

  // Healthtech/Biotech
  if (industryLower === "healthtech" || industryLower === "biotech") {
    slides.compliance = baseSlidePrompt(
      "compliance",
      "Regulatory Status & Risk",
      `3 bullet points: 1. **Specific regulatory status** (e.g., "FDA Clearance anticipated Q3 2026"). 2. **Key compliance measures** (e.g., "HIPAA/GDPR adherence verified"). 3. **Mitigation plan** for the largest regulatory risk. **MUST use specific compliance data from "${moreInfo}"**.`,
      `Highlight how the regulatory roadmap is a key competitive advantage and derisks the investment.`,
      "image-text",
      `1 image prompt showing health compliance, secure data management, or regulatory approval badges in ${scope || "target area"}`,
      startupData
    );

    slides.validation = baseSlidePrompt(
      "validation",
      "Clinical Efficacy & IP Moat",
      `3 bullet points: 1. **Strongest quantified clinical/pilot outcome** (e.g., "Phase 2 Trial showed 85% efficacy"). 2. **IP protection status** (e.g., "Patent-pending U.S. priority"). 3. **Source of validation data**. **MUST use specific validation and IP data from "${moreInfo}"**.`,
      `Prove scientific credibility and show proprietary advantage against potential competitors.`,
      "title-bullets",
      `1 image prompt showing healthcare or research validation results, focusing on patient/data outcomes in ${scope || "target market"}`,
      startupData
    );
  }

  // Fintech
  if (industryLower === "fintech") {
    slides.security = baseSlidePrompt(
      "security",
      "Security & Risk Mitigation",
      `3 bullet points: 1. **Key security protocol** (e.g., "AES-256 encryption, bank-grade"). 2. **Quantified Risk Mitigation** (e.g., "Fraud loss rate maintained below X% due to enhanced KYC/AML systems"). 3. **Audit/Certification Status** (e.g., "PCI DSS compliant"). **MUST use specific security data from "${moreInfo}"**.`,
      `Assure investors of operational security, data protection, and adherence to industry best practices to manage financial risk.`,
      "image-text",
      `1 image prompt showing fintech data protection, encryption, and secure transaction visual in ${scope || "target region"}`,
      startupData
    );

    slides.regulation = baseSlidePrompt(
      "regulation",
      "Compliance & Licensing Status",
      `3 bullet points: 1. **Specific Licensing Status** in ${scope}. 2. **Next compliance milestone** (e.g., "Achieve full regulatory status in Brazil by Q2"). 3. **Regulatory advantage** over competitors. **MUST use specific licensing data from "${moreInfo}"**.`,
      `Demonstrate readiness and adherence to the regional financial compliance standards, which is a key barrier to entry.`,
      "title-bullets",
      `1 image prompt showing fintech compliance, regulatory approvals, or licensing seals in ${scope || "target region"}`,
      startupData
    );
  }

  // Edtech
  if (industryLower === "edtech") {
    slides.adoption = baseSlidePrompt(
      "adoption",
      "Adoption & Strategic Network",
      `3 bullet points: 1. **Key quantifiable adoption metric** (e.g., "50k Student Users, 90% retention"). 2. **Most valuable strategic partnership** (e.g., "Exclusive pilot with State Education Ministry"). 3. **User retention/engagement metric**. **MUST use specific adoption and partnership data from "${moreInfo}"**.`,
      `Show strong collaboration strength and measurable traction in the education ecosystem.`,
      "image-text",
      `1 image prompt showing teachers/students using digital learning tools and educational collaboration in ${scope || "region"}`,
      startupData
    );

    slides.outcomes = baseSlidePrompt(
      "outcomes",
      "Learning Impact & Pedagogy",
      `3 bullet points: 1. **Quantifiable student impact result** (e.g., "20% increase in national test scores"). 2. **Alignment with key curriculum/standards**. 3. **Proprietary learning theory/data advantage**. **MUST use specific outcome and curriculum data from "${moreInfo}"**.`,
      `Prove the measurable educational impact and academic rigor of the solution to justify its value to institutions/users.`,
      "title-bullets",
      `1 image prompt showing quantifiable improved learning results or a graph of academic progress in ${scope || "region"}`,
      startupData
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


/**
 * Correction Prompt Generator - *NO CHANGE REQUIRED*
 */
const generateCorrectionPrompt = (slideData, correctionPrompt) => {
  if (!slideData || typeof slideData !== 'object') {
    throw new Error("Invalid slideData provided to correction prompt generator.");
  }

  const {
    slideType,
    title,
    bullets = [],
    notes = "",
    layout = "default",
    images = [],
  } = slideData;

  // Serialize image prompts for reference
  const imagePrompts = images
    ?.map((img, i) => ({
      index: i + 1,
      prompt: img.prompt || "",
      caption: img.caption || "",
      source: img.source || "ai-generated",
    }))
    ?.filter(img => img.prompt || img.caption)
    ?.map(img => `Image ${img.index}: prompt="${img.prompt}", caption="${img.caption}", source="${img.source}"`)
    ?.join("\n") || "No image prompts found.";

  // RFC 8259 JSON compliance + formatting instruction
  // NOTE: We rely on the calling function (the user's execution environment) to provide the full context
  // when regenerating, but for the correction prompt itself, we only need to enforce schema.
  const globalRulesSchema = `
IMPORTANT:
- Return ONLY valid RFC 8259 JSON
- No markdown, no comments, no extra text
- The final output must exactly match this schema:
{
  "slideType": "string",
  "title": "string",
  "bullets": ["string"],
  "notes": "string",
  "layout": "default|title-bullets|image-text|full-image",
  "images": [
    { "prompt": "string", "caption": "string" }
  ]
}
`;

  // The core correction prompt with full context
  return `
${globalRulesSchema}

You are an expert AI prompt engineer and startup storytelling designer.
You will revise an existing pitch deck slide JSON object based on the user’s correction instructions.

Here is the CURRENT SLIDE DATA:
{
  "slideType": "${slideType}",
  "title": "${title}",
  "bullets": ${JSON.stringify(bullets, null, 2)},
  "notes": "${notes}",
  "layout": "${layout}",
  "images": ${JSON.stringify(images.map(i => ({ prompt: i.prompt, caption: i.caption })) || [], null, 2)}
}

IMAGE CONTEXT:
${imagePrompts}

USER CORRECTION INSTRUCTION:
"${correctionPrompt}"

TASK:
Regenerate the slide based on the correction above while preserving its logical intent, accuracy, and relevance to the pitch deck.
Ensure the output remains concise, persuasive, and formatted as strict JSON according to the provided schema.
`;
};


// Allowed slide types - *NO CHANGE REQUIRED*
const getAllowedSlides = (industry) => {
  const baseSlides = [
    'cover', 'problem', 'solution', 'product', 'market',
    'businessModel', 'goMarket', 'competitions', 'milestones',
    'team', 'financials', 'industrySpecific', 'ask', 'contact'
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

module.exports = { generatePromptsForSlides, getAllowedSlides, generateCorrectionPrompt };
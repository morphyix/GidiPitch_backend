// Global rules applied to all slides - *MODIFIED FOR MAX INFO DENSITY, QUANTIFICATION & HIGH-IMPACT VOICE*
const globalRules = (startupData) => {
    // NOTE: 'milestones', 'financials', and 'ask' are now expected to be consolidated within 'moreInfo'.
    const { startupName, industry, scope, problems, solutions, moreInfo, team } = startupData;

    // Condense all core data into a single, cohesive context block
    const teamContext = team ? team.map(t => `${t.name} (${t.role}): ${t.expertise}`).join(" | ") : "Founders and key executives with relevant expertise.";

    // Consolidate the data that is no longer required as separate fields
    const financialMilestoneContext = moreInfo || "No specific financial, ask, or milestone data provided. The AI must use Google Search to find relevant industry benchmarks (TAM, CAGR, LTV/CAC) to fill this gap.";

    const allContext = `
        STARTUP NAME: ${startupName}
        INDUSTRY / SCOPE: ${industry} within ${scope || "Global Market"}
        CORE PROBLEM: ${problems}
        CORE SOLUTION / VALUE: ${solutions}
        ALL KEY FINANCIALS, MILESTONES, AND ASK DETAILS: ${financialMilestoneContext}
        CORE TEAM EXPERTISE: ${teamContext}
    `;

    return `
IMPORTANT NARRATIVE & FORMATTING RULES:
- Return ONLY valid RFC 8259 JSON
- No markdown, no comments, no extra text
- The voice must be **aggressive, confident, and ROI-focused** (like an expert selling a massive opportunity).
- The generated content for this slide **MUST BE FACTUAL, QUANTIFIED, AND CONSISTENT** with the "FULL PITCH CONTEXT" provided below.
- **MANDATORY GOOGLE SEARCH:** If any core metric (TAM, CAGR, LTV/CAC ratio, problem size) is missing or vague in the context, **you MUST use your Google Search tool to find a relevant, current, and quantified fact** that supports the narrative.
- **Keep all content extremely concise and high-impact.** Every bullet must convey a quantified or strategic advantage (MAX 25 WORDS per bullet to capture 80% of value).
- Keep all bullets brief, concise, and persuasive (maximum of 3 main bullet points per slide, unless explicitly noted).
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

// Optimized Base slide prompt builder - *MODIFIED FOR HIGH-IMPACT TITLES & INVESTOR TAKEAWAYS*
const baseSlidePrompt = (slideType, titlePrefix, bulletsInstruction, notesInstruction, layoutHint, imagePrompts, startupData) => {

    // The title should be a *claim* of massive potential, not just a topic.
    const title = slideType === 'cover'
        ? `${titlePrefix}`
        : `TITLE FORMAT (STRICTLY REQUIRED): "${titlePrefix}: [Quantified, High-Impact Claim]" (Total Max 15 words). Generate the single, most compelling, quantified claim (max 10 words) that sells this slide's argument. The claim MUST be grounded in context/research and focus on ROI/Scale/Defensibility, e.g., "${titlePrefix}: [85% Retention in the First 6 Months]".`;

    return `
${globalRules(startupData)}

TASK: Generate the JSON for the "${titlePrefix}" slide.

Generate a "${titlePrefix}" slide with:
- slideType: "${slideType}"
- title: ${title}
- bullets: Generate a maximum of **3 maximally dense, quantified, and visually dynamic data points or strategic claims**. The content MUST be based on and explicitly reference the context data, **using external research to quantify when necessary**. Focus on **traction, scale, and defensibility**: ${bulletsInstruction}
- notes: **THE INVESTOR TAKEAWAY (Single, Powerfully Persuasive Sentence):** ${notesInstruction}
- layout: Suggest one layout, prefer "${layoutHint}"
- images: **(Focus on Interactive/Lively Prompts):** ${imagePrompts}
`;
};

// Main slide prompt builder (core + industry + scope) - *STREAMLINED & IMPROVED FOR INVESTOR APPEAL*
const pitchDeckSlidePrompt = (startupData) => {
    const {
        startupName, industry, scope, problems, solutions,
        brandColor, brandStyle, competitions, businessModel,
        // The following fields are now consolidated into 'moreInfo' for the global context.
        // milestones, financials, ask,
        team, moreInfo, features
    } = startupData;

    const scopeContext = scope
        ? `Focus on the operational scope: "${scope}" when describing context, opportunities, and examples.`
        : "";

    // Pre-process team data for specific instructions
    const teamNamesList = team?.map(t => t.name).join(", ") || "Founders and key executives";
    const teamImageCount = team?.length || 3;

    const slides = {
        // 1. Cover Slide - *HIGHLY CATCHY & DYNAMIC*
        cover: baseSlidePrompt(
            "cover",
            `${startupName}`,
            `Generate a single, **hyper-compelling and creative tagline** (max 15 words) that immediately sells the **massive opportunity**. Example style: 'Uber: The NetJets of Limos' or 'Monzo: Banking that feels like magic'. MUST reference "${startupName}", "${industry}", and the core value of "${solutions}". (MANDATORY: Return EXACTLY ONE bullet point)`,
            // Notes for the cover should be EMPTY as per investor deck best practices
            `Generate a single, power-packed sentence (max 10 words) selling the unique, quantified benefit of the solution/features/business model. Focus on the core USP of "${solutions}", referencing key features from "${features}" and the commercial angle of the business model from "${businessModel}".`,
            "full-image",
            `1 **lively, interactive, and visually stunning** image prompt capturing the **disruptive future** of brand color "${brandColor}", style "${brandStyle}", and industry "${industry}" within ${scope || "the target market"}`,
            startupData
        ),

        // 2. Problem Slide - *FEEL THE PAIN*
        problem: baseSlidePrompt(
            "problem",
            "Problem",
            `3 bullet points: Each must be a **specific, quantified problem statement** (e.g., "$500B wasted annually" or "80% of users drop off") (MAX 25 WORDS each) derived from the "CORE PROBLEM" context. The language must be aggressive, highlighting the **massive financial or efficiency impact** this problem creates.`,
            `The note must be a single, powerful sentence emphasizing the market's current pain and the **immediate urgency/opportunity window** for ${startupName} to capture it.`,
            "title-bullets",
            `1 **dramatic, symbolic, and high-quality** image prompt visualizing the **magnitude** of the challenge related to "${problems}" within ${scope || "target market"}`,
            startupData
        ),

        // 3. Solution Slide - *THE MAGIC*
        solution: baseSlidePrompt(
            "solution",
            "Solution",
            `3 bullet points: (MAX 25 WORDS each) Explain how the "CORE SOLUTION / VALUE" directly addresses the quantified pain points, focusing on **measurable, highly-leveraged benefits** (e.g., "10x speed boost" or "Guaranteed $X ROI"). One bullet **MUST** explain the "magic" or core intellectual property/network effect that makes it proprietary. **MUST link back to the quantified pain points.**`,
            `The note must define the **core innovation/technology** that makes this solution possible or superior to current alternatives (e.g., "The only platform built on a proprietary LLM for B2B contracts").`,
            "image-text",
            `1 **interactive product demonstration** image prompt showing the product/service "${solutions}" in action, showcasing its unique value in ${scope || "target market"}`,
            startupData
        ),

        // 4. Product/Features Slide - *CUSTOMER OUTCOMES & MAGIC*
        product: baseSlidePrompt(
            "product",
            "Product",
            `3 bullet points: (MAX 25 WORDS each) 1. A clear, quantified **customer outcome** or testimonial summary (e.g., "90% retention, 5-star reviews"). 2. The key **"Magic" or core product differentiator** (e.g., proprietary AI, network effect) from "${features}". 3. The **most impressive traction metric** extracted from the "ALL KEY FINANCIALS, MILESTONES, AND ASK DETAILS" context, emphasizing velocity.`,
            `The note must briefly describe the superior user experience and defensible technology that secures initial market adoption.`,
            "image-text",
            `1 **lively screenshot** image prompt of a user interface (UI) or product concept, using the imageGenType: "${startupData.imageGenType}" and brandStyle: "${brandStyle}"`,
            startupData
        ),

        // 5. Market Opportunity Slide - *QUANTIFIED MARKET*
        market: baseSlidePrompt(
            "market",
            "Market Opportunity",
            `3 bullet points: (MAX 25 WORDS each) 1. **Quantified TAM** estimate for the "${industry}" context. 2. **Quantified SOM** focused on ${scope || "target geography"}. 3. The **CAGR or key quantified trend** driving market expansion. **Use external research if internal context is vague.**`,
            `Explain the market dynamics and identify the specific beachhead market where "${startupName}" will focus for the next 12 months.`,
            "title-bullets",
            `1 **dynamic data visualization** prompt showing market opportunity size (TAM/SOM) and growth within ${scope || "target region"}`,
            startupData
        ),

        // 6. Business Model Slide - *UNIT ECONOMICS*
        businessModel: baseSlidePrompt(
            "businessModel",
            "Business Model",
            `3 bullet points: (MAX 25 WORDS each) 1. Primary **revenue stream** (from "${businessModel}") and **ASP**. 2. Clear statement on **Unit Economics** (e.g., "LTV $X / CAC $Y = Ratio Z > 3.0"). 3. Key channel for margin defense/cost reduction. **Must be consistent with the solution's nature in the context.**`,
            `Explain the key drivers for revenue scalability (e.g., network effects, low marginal cost) in ${scope || "the operational landscape"}.`,
            "image-text",
            `1 **clear, interactive** image prompt showing the revenue flow diagram or business canvas model in ${scope || "target region"}`,
            startupData
        ),

        // 7. Go-to-Market Strategy - *SCALABLE & VIRAL CHANNELS*
        goMarket: baseSlidePrompt(
            "goMarket",
            "Go-to-Market (GTM)",
            `3 bullet points (MAX 25 WORDS each) outlining the **three most efficient/scalable customer acquisition channels** (e.g., SEO, Referral, Virality). Include a mention of the estimated customer acquisition cost (CAC) or conversion rate. **MUST reference "${businessModel}" and "${features}" for channel choice, prioritizing organic/viral loops.**`,
            `Outline the early sales process and the scaling plan for achieving a defensible distribution advantage.`,
            "title-bullets",
            `1 **dynamic visualization** image prompt showing a marketing funnel or customer acquisition strategy map for ${startupName} in ${scope || "target area"}`,
            startupData
        ),

        // 8. Competitive Landscape Slide - *THE MOAT*
        competitions: baseSlidePrompt(
            "competition",
            "Competitive Moat",
            `3 bullet points: (MAX 25 WORDS each) 1. Identification of **2-3 closest competitors** (from "${competitions}"). 2. Clear statement on "${startupName}'s" **unique, sustainable competitive advantage (Moat)** derived from the "CORE SOLUTION" in the context. 3. Key difference **quantified** (e.g., "5x faster" or "70% lower cost").`,
            `Justify why competitors have not successfully addressed the problem or why the timing is right for disruption.`,
            "title-bullets",
            `1 **infographic image prompt** comparing ${startupName} vs top 3 competitors in ${scope} (${industry} sector), highlighting key differentiation factors`,
            startupData
        ),

        // 9. Milestones & Traction - *FUTURE LOOKING*
        milestones: baseSlidePrompt(
            "milestones",
            "Traction & Future Velocity",
            `3 bullet points (MAX 25 WORDS each): 1. **Most impressive historical metric** extracted from the "ALL KEY FINANCIALS, MILESTONES, AND ASK DETAILS" context, focused on growth velocity. 2. The **specific, measurable 6-month goal** to be hit with this funding. 3. The **major outcome/milestone** that triggers the next funding round.`,
            `Quantify the current momentum and demonstrate a credible plan to achieve significant growth based on the context's milestones.`,
            "title-bullets",
            `1 **dynamic timeline or roadmap** image prompt showing past achievements and future product milestones for ${startupName}`,
            startupData
        ),

        // 10. Team Slide - *FIT FOR EXECUTION - CUSTOM FORMAT*
        team: baseSlidePrompt(
            "team",
            "Team",
            `Generate **one high-impact bullet point per core team member** (max ${teamImageCount} bullets) (MAX 25 WORDS each). Each bullet must state the team member's **Name, Role, and a single, quantified career achievement/expertise summary** directly relevant to the startup's success (e.g., "Jane Doe, CTO: 10+ years scaling $100M infrastructure"). MUST be derived from the context data or essential expertise for the ${industry} industry.`,
            `The note must be a single, persuasive paragraph (max 2 sentences) that emphasizes the team's collective domain expertise, founder-market fit, and track record of collaboration/resilience. It must sell the team as capable of executing the plan based on their cumulative skills.`,
            "image-text",
            `Generate a separate image object for each of the ${teamImageCount} core team members (${teamNamesList}). The prompt for each should be a professional, high-quality portrait/headshot placeholder for the specific team member's name and role, emphasizing **competence and diversity of expertise**.`,
            startupData
        ),

        // 11. Financials Slide - *FACTUAL PROJECTIONS*
        financials: baseSlidePrompt(
            "financials",
            "Financial Projections",
            `3 bullet points: (MAX 25 WORDS each) 1. **Historical Revenue or MRR** and **current burn rate**. 2. **3-Year Revenue Forecast** (clear, high number). 3. **Key Assumption** driving the growth. **MUST use the facts/figures from the "ALL KEY FINANCIALS, MILESTONES, AND ASK DETAILS" context block, using external research to benchmark against industry standards if numbers are vague.**`,
            `Briefly describe the key assumptions underpinning the projections and the projected path to profitability within the next 3-5 years.`,
            "title-bullets",
            `1 **clear, vibrant graph or chart** prompt showing revenue growth projection and key financial milestones for ${startupName} in ${scope || "target area"}`,
            startupData
        ),

        // 12. Vision & Exit Strategy - *NEW REQUIRED SLIDE*
        vision: baseSlidePrompt(
            "vision",
            "Vision",
            `3 bullet points: (MAX 25 WORDS each) 1. The **long-term vision** for market disruption. 2. **2-3 credible strategic acquirers** (e.g., Google, Stripe, Pfizer). 3. The **specific, measurable outcome** (e.g., $100M ARR, 5M users) that makes the company a target for acquisition at a $1B+ valuation. **Use external research to justify potential acquirers/valuations for the ${industry} sector.**`,
            `A final, inspiring statement on the potential for massive, disruptive returns, framing the investment as a pathway to an IPO or major acquisition within 5-7 years.`,
            "title-bullets",
            `1 **abstract image prompt** symbolizing exponential growth, market domination, and a clear path to exit/IPO for ${startupName}`,
            startupData
        ),

        // 13. Industry Specifics & Partnerships - *DERISKING*
        industrySpecific: baseSlidePrompt(
            "industrySpecific",
            `Industry & ${industry === "fintech" || industry === "healthtech" ? "Regulation" : "Key Partnerships"}(max 15 words)`,
            `3 bullet points (MAX 25 WORDS each) outlining **2 critical derisking factors** (e.g., partnership, IP, compliance status) and **1 key strategic asset** (e.g., proprietary data, regulatory advantage). **MUST use specific details from "${moreInfo}"**.`,
            `Explain how ${startupName} leverages its unique position to overcome industry-specific barriers or accelerates growth.`,
            "image-text",
            `1 **highly specific** image prompt showing visuals related to compliance, strategic alliances, or proprietary technology in the ${industry} sector within ${scope || "target region"}`,
            startupData
        ),

        // 14. Funding Ask Slide - *FUNDS UTILIZATION*
        ask: baseSlidePrompt(
            "ask",
            "The Ask & Use of Funds(max 15 words)",
            `3 bullet points (MAX 25 WORDS each): 1. **Total Funding Amount** and **Round Type** (from "ALL KEY FINANCIALS, MILESTONES, AND ASK DETAILS" context). 2. The **clear breakdown** of funds use (e.g., "70% Product, 30% GTM"). 3. The **single biggest milestone** the fund will achieve (from "ALL KEY FINANCIALS, MILESTONES, AND ASK DETAILS" context).`,
            `Describe the expected runway (e.g., 18 months) and the key metrics/valuation target for the next funding round.`,
            "title-bullets",
            `1 **dynamic, clear image prompt** showing funding allocation pie chart or milestone roadmap tied to the capital raise in ${scope || "target geography"}`,
            startupData
        ),

        // 15. Contact/Call to Action Slide - *FINAL CTA*
        contact: baseSlidePrompt(
            "contact",
            "Next Steps(max 15 words)",
            `2 bullet points (MAX 25 WORDS each): 1. **Clear Call-to-Action** for the investor (e.g., "Schedule a Demo" or "Discuss Term Sheet"). 2. Key contact information (Email and Website).`,
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
            "Regulatory Status(max 15 words)",
            `3 bullet points (MAX 25 WORDS each): 1. **Specific regulatory status** (e.g., "FDA Clearance anticipated Q3 2026"). 2. **Key compliance measures** (e.g., "HIPAA/GDPR adherence verified"). 3. **Mitigation plan** for the largest regulatory risk. **MUST use specific compliance data from "${moreInfo}" or relevant external research for validation.**`,
            `Highlight how the regulatory roadmap is a key competitive advantage and derisks the investment.`,
            "image-text",
            `3 distinct icons symbolizing compliance, secure data, and risk mitigation in the health sector`,
            startupData
        );

        slides.validation = baseSlidePrompt(
            "validation",
            "Clinical Efficacy & IP Moat(max 15 words)",
            `3 bullet points: (MAX 25 WORDS each) 1. **Strongest quantified clinical/pilot outcome** (e.g., "Phase 2 Trial showed 85% efficacy"). 2. **IP protection status** (e.g., "Patent-pending U.S. priority"). 3. **Source of validation data**. **MUST use specific validation and IP data from "${moreInfo}" or relevant external research for validation.**`,
            `Prove scientific credibility and show proprietary advantage against potential competitors.`,
            "title-bullets",
            `3 distinct icons representing clinical efficacy, intellectual property (IP), and scientific validation in healthtech`,
            startupData
        );
    }

    // Fintech
    if (industryLower === "fintech") {
        slides.security = baseSlidePrompt(
            "security",
            "Security & Risk Mitigation(max 15 words)",
            `3 bullet points (MAX 25 WORDS each): 1. **Key security protocol** (e.g., "AES-256 encryption, bank-grade"). 2. **Quantified Risk Mitigation** (e.g., "Fraud loss rate maintained below X% due to enhanced KYC/AML systems"). 3. **Audit/Certification Status** (e.g., "PCI DSS compliant"). **MUST use specific security data from "${moreInfo}" or relevant external research for validation.**`,
            `Assure investors of operational security, data protection, and adherence to industry best practices to manage financial risk.`,
            "image-text",
            `3 distinct icons symbolizing data protection, fraud prevention, and audit certification for a fintech product in ${scope || "target region"}`,
            startupData
        );

        slides.regulation = baseSlidePrompt(
            "regulation",
            "Compliance & Licensing Status(max 15 words)",
            `3 bullet points (MAX 25 WORDS each): 1. **Specific Licensing Status** in ${scope}. 2. **Next compliance milestone** (e.g., "Achieve full regulatory status in Brazil by Q2"). 3. **Regulatory advantage** over competitors. **MUST use specific licensing data from "${moreInfo}" or relevant external research for validation.**`,
            `Demonstrate readiness and adherence to the regional financial compliance standards, which is a key barrier to entry.`,
            "title-bullets",
            `3 distinct icons representing regulatory licensing, compliance milestones, and legal advantage in a fintech setting within ${scope || "target region"}`,
            startupData
        );
    }

    // Edtech
    if (industryLower === "edtech") {
        slides.adoption = baseSlidePrompt(
            "adoption",
            "Adoption & Strategic Network(max 15 words)",
            `3 bullet points (MAX 25 WORDS each): 1. **Key quantifiable adoption metric** (e.g., "50k Student Users, 90% retention"). 2. **Most valuable strategic partnership** (e.g., "Exclusive pilot with State Education Ministry"). 3. **User retention/engagement metric**. **MUST use specific adoption and partnership data from "${moreInfo}" or relevant external research for validation.**`,
            `Show strong collaboration strength and measurable traction in the education ecosystem.`,
            "image-text",
            `3 distinct icons representing student user count, strategic partnerships, and user engagement/retention in edtech`,
            startupData
        );

        slides.outcomes = baseSlidePrompt(
            "outcomes",
            "Learning Impact & Pedagogy(max 15 words)",
            `3 bullet points (MAX 25 WORDS each): 1. **Quantifiable student impact result** (e.g., "20% increase in national test scores"). 2. **Alignment with key curriculum/standards**. 3. **Proprietary learning theory/data advantage**. **MUST use specific outcome and curriculum data from "${moreInfo}" or relevant external research for validation.**`,
            `Prove the measurable educational impact and academic rigor of the solution to justify its value to institutions/users.`,
            "title-bullets",
            `3 distinct icons symbolizing measurable learning outcomes, curriculum alignment, and proprietary learning data/AI`,
            startupData
        );
    }

    return slides;
};

// Generate prompts for selected slides - *NO CHANGE REQUIRED*
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
  "generateImage": "boolean",
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

## WORD COUNT & STYLE RULES (STRICTLY ENFORCE)
- **Title**: Maximum of 15 words.
- **Bullets**: Each bullet point (item in the "bullets" array) has a maximum of 25 words.
- **Notes**: Maximum of 25 words for the actual notes text.

Here is the CURRENT SLIDE DATA:

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
**CRITICAL IMAGE EVALUATION**: Analyze the USER CORRECTION INSTRUCTION. If the instruction explicitly requests a **new image** (e.g., "add an image of X") or a **significant change to an existing image's 'prompt' or 'caption'** (e.g., "change the image to be a photo of Y"), set the **"generateImage"** field in the final JSON output to **true**.
If the instruction only modifies text (title, bullets, notes) or layout without changing image content, set **"generateImage"** to **false**.
Ensure the output remains concise, persuasive, and formatted as strict JSON according to the provided schema.
`;
};


// Allowed slide types - *MODIFIED TO INCLUDE 'vision'*
const getAllowedSlides = (industry) => {
    const baseSlides = [
        'cover', 'problem', 'solution', 'product', 'market',
        'businessModel', 'goMarket', 'competitions', 'milestones',
        'team', 'financials', 'vision', 'industrySpecific', 'ask', 'contact'
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


/**
 * Generate Brand guidlines for a startup pitch deck slides.
 */
const createTailwindPrompt = (brandColor = 'orange', brandStyle = 'default') => {
    const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(brandColor);
  const colorHint = isHex
    ? `The background color should use a Tailwind class that best matches the hex code ${brandColor}.`
    : `The background color should be set using Tailwind's color palette for "${brandColor}".`;

  const prompt = `
IMPORTANT:
You are to generate a Tailwind CSS design kit for a startup pitch deck slide.

Requirements:
- Return ONLY valid RFC 8259 JSON.
- No markdown, no comments, no extra text.
- The JSON should describe Tailwind CSS classes to style a slide.

Branding:
- Brand color: ${brandColor}
- Font style: ${brandStyle}

${colorHint}
Generate complementary Tailwind text colors for the title, bullets, and notes so that the design is:
- Investor appealing
- Professional and legible
- Harmonious and interactive

JSON structure:
{
  "background": "tailwind-bg-class",
  "title": {
    "color": "tailwind-text-class",
    "font": "tailwind-font-class",
    "size": "tailwind-text-size-class",
    "weight": "tailwind-font-weight-class",
    "tracking": "tailwind-tracking-class"
  },
  "bullets": {
    "color": "tailwind-text-class",
    "font": "tailwind-font-class",
    "size": "tailwind-text-size-class",
    "spacing": "tailwind-leading-class"
  },
  "notes": {
    "color": "tailwind-text-class",
    "font": "tailwind-font-class",
    "size": "tailwind-text-size-class",
    "opacity": "tailwind-opacity-class"
  }
}

The tone of the visual hierarchy should make the title dominant, the bullets clean and readable, and the notes subtle but clear.
`;

  return prompt;
}


module.exports = { generatePromptsForSlides, getAllowedSlides, generateCorrectionPrompt, createTailwindPrompt };
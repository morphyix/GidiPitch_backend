// PHILOSOPHY: The AI is an expert pitch deck consultant who READS startup data, 
// UNDERSTANDS the business, and CRAFTS a compelling narrative using that knowledge.
// It doesn't cite the data—it INTERPRETS and PRESENTS it professionally.

// Global rules with intelligent context utilization
const globalRules = (startupData) => {
    const { startupName, industry, scope, problems, solutions, moreInfo, team, features, businessModel } = startupData;

    // Parse team into usable intelligence
    const teamContext = team?.length 
        ? team.map(t => `${t.name} (${t.role}): ${t.expertise}`).join(" | ")
        : "Founding team with relevant domain expertise.";

    // Create rich context blocks for AI interpretation
    const contextBlocks = {
        startup: `${startupName} operates in ${industry}${scope ? ` within ${scope}` : ''}`,
        problem: problems || "Market inefficiency requiring technology solution",
        solution: solutions || "Technology-enabled solution",
        features: features || "Core product capabilities",
        businessModel: businessModel || "Revenue generation approach",
        additionalInfo: moreInfo || "Additional startup details",
        team: teamContext
    };

    return `
CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY valid RFC 8259 JSON
- No markdown, no comments, no extra text outside JSON structure

YOUR ROLE:
You are an expert pitch deck consultant with 15+ years helping startups raise capital from top-tier VCs.
You have deep expertise in storytelling, financial modeling, and investor psychology.

YOUR TASK:
Read and DEEPLY UNDERSTAND the startup information below.
Then SYNTHESIZE this raw data into compelling, investor-grade slide content.
DO NOT simply cite the information—INTERPRET and PRESENT it professionally.

TONE & STYLE REQUIREMENTS:
- Professional and confident (like a seasoned founder, not a marketer)
- Data-driven with specific metrics (not vague claims)
- Action-oriented verbs: "Reduced," "Achieved," "Targeting" (not "Crushing," "Unlocking," "Dominating")
- Include measured uncertainty where appropriate: "Targeting," "Projecting," "Initial data suggests"
- Avoid ALL marketing hyperbole: NO "massive," "explosive," "revolutionary," "game-changing"

INTELLIGENT DATA UTILIZATION:
1. READ the raw startup data carefully
2. IDENTIFY the key insights, metrics, and differentiators
3. USE web_search to find supporting industry data, benchmarks, TAM/SAM, CAGR when needed
4. SYNTHESIZE everything into clear, compelling narratives
5. PRESENT findings professionally with appropriate context

CONTENT DENSITY RULES:
- Maximum 20 words per bullet point (force precision)
- Each bullet conveys ONE clear, defensible insight
- Include specific numbers with context (not bare percentages)
- Maximum 3 bullets per slide

CREDIBILITY CHECKLIST (EVERY CLAIM MUST PASS):
✓ Is this claim grounded in the provided data or credible research?
✓ Would a skeptical VC believe this without pushback?
✓ Does this sound like an experienced founder?
✓ Is the metric realistic and achievable?
✓ Am I showing appropriate nuance?

JSON STRUCTURE:
{
    "slideType": "string",
    "title": "string",
    "bullets": ["string", "string", "string"],
    "notes": "string",
    "layout": "default|title-bullets|image-text|full-image",
    "images": [
        { "prompt": "string", "caption": "string" }
    ]
}

STARTUP INFORMATION TO ANALYZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY: ${contextBlocks.startup}
PROBLEM SPACE: ${contextBlocks.problem}
SOLUTION APPROACH: ${contextBlocks.solution}
PRODUCT FEATURES: ${contextBlocks.features}
BUSINESS MODEL: ${contextBlocks.businessModel}
TEAM COMPOSITION: ${contextBlocks.team}

ADDITIONAL CONTEXT (contains variable information - funding ask, milestones, industry-specific details, traction, partnerships, etc.):
${contextBlocks.additionalInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL INSTRUCTION:
Analyze ALL the above information. Extract the most compelling insights for THIS specific slide.
Use web_search when you need industry benchmarks, market sizing, or competitive intelligence.
Then craft slide content that an investor would find credible and compelling.
`;
};

const generateDynamicIconPrompt = (brandColor, bulletContext) => {
  return `
AFTER you generate the bullets above, create icon keywords for them.

You are an expert at mapping concepts to visual icons. Generate precise icon keywords that can be used to fetch icons from Iconify libraries (Lucide, Heroicons, Material Icons, etc.).

ICON KEYWORD REQUIREMENTS:
- Each keyword must represent a CONCRETE, TANGIBLE OBJECT or SYMBOL
- Think: "What single physical object/symbol represents this concept?"
- Keywords should match common icon library naming conventions
- Use simple, recognizable objects that work well as icons
- Avoid abstract concepts like "innovation", "growth", "success", "efficiency"
- Prefer nouns over verbs (e.g., "clock" not "timing")

KEYWORD SELECTION STRATEGY:
1. Identify the CORE VISUAL ELEMENT of the bullet point
2. Choose the most LITERAL object that represents it
3. Provide 3 keywords as fallbacks (primary, secondary, tertiary)
4. Order from most specific to most generic
5. Use standard icon terminology (check what's commonly available in Lucide/Heroicons)

FALLBACK KEYWORD STRATEGY:
- Primary: Most specific/compound keyword (e.g., "clock-fast")
- Secondary: Simpler alternative (e.g., "timer")
- Tertiary: Generic fallback that will definitely exist (e.g., "clock")

GOOD KEYWORDS (Concrete Objects):
✓ clock, timer, stopwatch
✓ target, bullseye, crosshair
✓ brain, cpu, circuit
✓ rocket, speed-gauge, zap
✓ shield, lock, key
✓ map, route, navigation
✓ users, team, people
✓ dollar-sign, coins, wallet
✓ chart-line, trending-up, bar-chart
✓ package, box, truck
✓ calendar, schedule, clock
✓ bell, alert, notification
✓ wrench, settings, tool
✓ lightning, bolt, flash
✓ graph, network, nodes

BAD KEYWORDS (Abstract/Vague):
✗ innovation, efficiency, optimization
✗ improvement, enhancement, transformation
✗ solution, strategy, approach
✗ excellence, quality, performance
✗ value, benefit, advantage

CAPTION REQUIREMENTS:
- Each caption must be EXACTLY 4 words
- Caption should be a title/headline for the bullet (not a description of the icon)
- Use Title Case (e.g., "Reduces Driver Wait Time" not "reduces driver wait time")
- Think of it as a slide sub-heading that encapsulates the bullet's key message

CONTEXT FOR ICON MAPPING:
${bulletContext}

OUTPUT FORMAT (must be valid JSON):
[
  {
    "prompt": "clock-fast,timer,clock",
    "caption": "Booking Time Reduced Drastically"
  },
  {
    "prompt": "brain-circuit,cpu,brain",
    "caption": "Machine Learning Algorithm Optimizes"
  },
  {
    "prompt": "target-arrow,target,bullseye",
    "caption": "Delivery Success Rate Improved"
  }
]

ICON MAPPING EXAMPLES:

Example 1:
- Bullet: "Reduced booking time from 2 hours to 3 minutes"
  → Think: Time being reduced/accelerated
  → Primary: "clock-fast" (specific compound)
  → Secondary: "timer" (simpler alternative)
  → Tertiary: "clock" (guaranteed fallback)
  → Keywords: "clock-fast,timer,clock"
  → Caption: "Booking Time Reduced Drastically"

Example 2:
- Bullet: "Algorithm learns from 10K+ daily transactions"
  → Think: Learning/processing data
  → Primary: "brain-circuit" (specific compound)
  → Secondary: "cpu" (simpler alternative)
  → Tertiary: "brain" (guaranteed fallback)
  → Keywords: "brain-circuit,cpu,brain"
  → Caption: "Machine Learning Algorithm Optimizes"

Example 3:
- Bullet: "98% delivery success rate vs 75% industry average"
  → Think: Accuracy/hitting target
  → Primary: "target-arrow" (specific compound)
  → Secondary: "target" (simpler alternative)
  → Tertiary: "bullseye" (guaranteed fallback)
  → Keywords: "target-arrow,target,bullseye"
  → Caption: "Delivery Success Rate Improved"

Example 4:
- Bullet: "Automated route optimization saves 30% fuel costs"
  → Think: Navigation/path/route
  → Primary: "route-square" (specific compound)
  → Secondary: "map-pin" (simpler alternative)
  → Tertiary: "map" (guaranteed fallback)
  → Keywords: "route-square,map-pin,map"
  → Caption: "Automated Route Optimization Saves"

Example 5:
- Bullet: "Real-time driver tracking improves customer satisfaction"
  → Think: Location tracking
  → Primary: "map-pin-check" (specific compound)
  → Secondary: "radar" (simpler alternative)
  → Tertiary: "map-pin" (guaranteed fallback)
  → Keywords: "map-pin-check,radar,map-pin"
  → Caption: "Real Time Driver Tracking"

Example 6:
- Bullet: "Reduced carbon emissions by 40% through route optimization"
  → Think: Environmental protection
  → Primary: "leaf-check" (specific compound)
  → Secondary: "sprout" (simpler alternative)
  → Tertiary: "leaf" (guaranteed fallback)
  → Keywords: "leaf-check,sprout,leaf"
  → Caption: "Carbon Emissions Reduced Significantly"

KEYWORD GUIDELINES BY CATEGORY:

Time/Speed:
- Primary: clock-fast, timer-reset, hourglass-fast
- Secondary: timer, stopwatch, gauge-high
- Tertiary: clock, hourglass, zap

Money/Cost:
- Primary: dollar-decrease, coins-hand, wallet-check
- Secondary: trending-down, piggy-bank, coins
- Tertiary: dollar-sign, wallet, chart

Accuracy/Success:
- Primary: target-arrow, shield-check, badge-check
- Secondary: target, bullseye, check-circle
- Tertiary: crosshair, shield, badge

Technology/AI:
- Primary: brain-circuit, chip-check, network-wired
- Secondary: cpu, circuit-board, network
- Tertiary: brain, chip, nodes

Analytics/Data:
- Primary: chart-line-up, trending-up-double, bar-chart-big
- Secondary: trending-up, bar-chart, activity
- Tertiary: chart-line, pie-chart, graph

Location/Navigation:
- Primary: map-pin-check, route-square, radar-scan
- Secondary: map-pin, route, radar
- Tertiary: map, navigation, compass

People/Team:
- Primary: users-check, user-group, team-check
- Secondary: users, people, user-check
- Tertiary: user, team, person

Communication:
- Primary: bell-ring, message-check, mail-open
- Secondary: bell, message-circle, mail
- Tertiary: notification, chat, envelope

Automation/Process:
- Primary: settings-automation, cog-play, workflow-check
- Secondary: settings, workflow, cog
- Tertiary: gear, process, tool

Speed/Performance:
- Primary: rocket-launch, zap-fast, gauge-max
- Secondary: rocket, zap, speedometer
- Tertiary: fast-forward, bolt, gauge

CRITICAL RULES:
1. Always provide EXACTLY 3 keywords separated by commas (no spaces)
2. Order keywords from most specific to most generic
3. Keywords must be concrete, searchable terms found in icon libraries
4. Caption must be EXACTLY 4 words (not 3, not 5)
5. Each icon keyword set must be UNIQUE and SPECIFIC to its bullet point
6. Always use lowercase with hyphens (kebab-case)
7. NO SPACES in the prompt string - only commas between keywords

FORMAT REMINDER:
✅ CORRECT: "clock-fast,timer,clock"
❌ WRONG: "clock-fast, timer, clock" (has spaces)
❌ WRONG: "clock-fast" (only one keyword)
❌ WRONG: "clock-fast,timer,clock,stopwatch" (too many keywords)

Generate the icon keywords now based on the bullets you created above.
`;
};

// Base slide prompt with intelligent synthesis instructions
const baseSlidePrompt = (slideType, titlePrefix, dataAnalysisInstruction, bulletsInstruction, notesInstruction, layoutHint, imagePrompts, startupData) => {

    const title = slideType === 'cover'
        ? `${titlePrefix}`
        : `TITLE: "${titlePrefix}: [Clear, Specific Claim]" (Max 7 words). 
        
After analyzing the startup data, create a title that captures the key insight for this slide.
Focus on outcomes, not aspirations. 
Example: "Market Opportunity: Capturing 15% of Africa's $2.1B SaaS Market"
NOT: "Market Opportunity: Dominating Africa's Explosive SaaS Boom"`;

    return `
${globalRules(startupData)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SLIDE GENERATION TASK: "${titlePrefix}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 - ANALYZE THE DATA:
${dataAnalysisInstruction}

STEP 2 - RESEARCH (if needed):
If the startup data lacks specific metrics (TAM, CAGR, benchmarks, competitor data), use web_search to find:
- Current market size and growth rates
- Industry benchmarks and standards
- Competitive landscape intelligence
- Regulatory or compliance requirements (for healthtech/fintech)

STEP 3 - SYNTHESIZE CONTENT:
Generate slide JSON with:
- slideType: "${slideType}"
- title: ${title}
- bullets: ${bulletsInstruction}
- notes: ${notesInstruction}
- layout: "${layoutHint}"
- images: ${imagePrompts}

ANTI-PATTERNS TO AVOID:
❌ "Crushing the competition with our proprietary algorithm"
✅ "Algorithm reduces matching time from 2 hours to under 3 minutes"

❌ "Unlocking 30%+ higher earnings for drivers"  
✅ "Pilot drivers earned 32% more vs. independent operators (n=50, 90 days)"

❌ "Dominating the $28B explosive logistics market"
✅ "Targeting $2.1B last-mile segment, growing 12% annually in Lagos"

❌ "Revolutionary AI-powered platform"
✅ "Machine learning model trained on 50,000+ successful African pitch decks"

Remember: You're interpreting and presenting insights, not quoting data back.
`;
};

// Main slide prompt builder with intelligent data synthesis
const pitchDeckSlidePrompt = (startupData) => {
    const {
        startupName, industry, scope, problems, solutions,
        brandColor, brandStyle, competitions, businessModel,
        team, moreInfo, features
    } = startupData;

    console.log("Generating slide prompts for:", startupName);

    const scopeContext = scope || "the target market";
    const teamNamesList = team?.map(t => t.name).join(", ") || "Founding team";
    const teamImageCount = team?.length || 3;

    const slides = {
        // 1. COVER SLIDE
        cover: baseSlidePrompt(
            "cover",
            `${startupName}`,
            `Analyze: What does ${startupName} actually do? What value does it create? For whom? What's the key differentiator?
Look at: solutions, features, businessModel (especially pricing), industry context.
Extract: The ONE thing that makes this startup memorable and fundable.`,
            `Generate ONE compelling tagline (max 10 words) that makes an investor stop and pay attention.

WINNING FORMULA OPTIONS:
1. **Value + Price Anchoring**: "[What you do] for [dramatic price point]"
   Example: "Investor-ready pitch decks for $1.35"
   Example: "Bank-grade security for $10/month"

2. **Category + Audience**: "[Category leader] for [specific market]"
   Example: "Stripe for African founders"
   Example: "Notion for Nigerian SMEs"

3. **Transformation Statement**: "[Specific outcome] in [time/cost]"
   Example: "Series A-ready decks in 5 minutes"
   Example: "Verified riders in under 2 minutes"

CRITICAL ANALYSIS STEPS:
1. Look at businessModel - is there disruptive pricing? (e.g., $1.35 vs. $100/month) → USE IT
2. Look at solutions + features - what's the core transformation? (e.g., "weeks to minutes")
3. Look at industry + scope - is there geographic specificity? (e.g., "African," "Nigerian")
4. Combine the MOST COMPELLING element into 7-10 words

EXAMPLES FROM REAL SUCCESSFUL STARTUPS:
- "Stripe: Payments infrastructure for the internet" (7 words)
- "Notion: One workspace for your team" (6 words)
- "Figma: Where teams design together" (5 words)
- "Airbnb: Belong anywhere" (2 words + context)

BAD EXAMPLES TO AVOID:
❌ "The AI pitch deck generator for emerging market startups" (too long, too generic)
❌ "Revolutionizing fundraising with cutting-edge AI" (hyperbole, vague)
❌ "Affordable, pay-as-you-go AI platform for professional pitch decks" (feature list, not hook)

YOUR TASK:
Analyze "${solutions}", "${features}", and especially "${businessModel}" (look for pricing).
Create a 7-10 word tagline using one of the formulas above.
If there's a dramatic price point ($1-5 range), LEAD WITH IT.

(RETURN EXACTLY ONE BULLET POINT - THE TAGLINE ONLY)`,
            `Generate one sentence (max 15 words) that expands on the tagline by stating WHO benefits and HOW. Use solutions, features, and businessModel to make this concrete and specific.`,
            "full-image",
            `1 clean, professional hero image representing ${industry} in ${scopeContext}. Style: ${brandColor}. Show the CUSTOMER using the product in a real scenario, not abstract concepts or technology. Example: For pitch deck tool, show a founder presenting to investors. For logistics, show a delivery in progress.`,
            startupData
        ),

        // 2. PROBLEM SLIDE
        problem: baseSlidePrompt(
            "problem",
            "Problem",
            `Analyze the "problems" context: What pain points exist? Who experiences them? How severe are they?
Look at: problems, industry, scope, moreInfo (may contain market data or customer pain points).
Use web_search if you need to quantify the problem size or find industry-specific data.`,
            `Generate 3 bullets (max 20 words each) that quantify the problem:

REQUIRED FORMAT FOR EACH BULLET:
- WHO experiences this problem
- WHAT the specific pain point is  
- HOW MUCH it costs (time, money, opportunity)

Example: "Nigerian logistics SMEs lose ₦2.5M annually to failed deliveries, 40% of total logistics spend"
NOT: "Massive inefficiencies plague the fragmented logistics sector"

Analyze the problems data and use web_search to quantify impact where needed.`,
            `One sentence explaining why this problem exists now and why ${startupName} is positioned to solve it.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 problem bullets you generated.
Focus on visualizing the pain points: time waste, financial loss, inefficiency, trust issues, etc.`),
            startupData
        ),

        // 3. SOLUTION SLIDE
        solution: baseSlidePrompt(
            "solution",
            "Solution",
            `Analyze: How does the solution address each problem? What's the core innovation?
Look at: solutions, features, businessModel, moreInfo (may contain technical details or IP).
Identify: The "secret sauce" - what makes this solution defensible?`,
            `Generate 3 bullets (max 20 words each) explaining HOW the solution works:

BULLET 1: Direct problem → solution mapping with measurable outcome
Example: "Real-time rider verification system reduced booking time from 2+ hours to under 2 minutes"

BULLET 2: Core innovation or "secret sauce" 
Example: "Proprietary matching algorithm learns from 10K+ daily transactions to optimize routes and pricing"

BULLET 3: Key benefit that creates competitive advantage
Example: "98% delivery success rate vs. 75% industry average, improving merchant retention 40%"

Synthesize from solutions, features, and any technical details in moreInfo.`,
            `One sentence explaining the core technology or business model innovation that makes this defensible.`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 solution bullets you generated.
Focus on visualizing: speed/efficiency, innovation/technology, results/outcomes.`),
            startupData
        ),

        // 4. PRODUCT SLIDE
        product: baseSlidePrompt(
            "product",
            "Product",
            `Analyze: What are the core product features? How do they work together? What makes the product sticky?
Look at: features (CRITICAL - this should contain the actual product capabilities), moreInfo (may contain feature details, user workflows).
Focus: The 3 most important features that create the product's value and differentiation.`,
            `Generate 3 bullets (max 20 words each) highlighting KEY PRODUCT FEATURES:

REQUIRED FORMAT - Feature + Benefit:
Each bullet should explain WHAT the feature is and WHY it matters to users.

Example 1: "Real-time rider matching algorithm connects customers with verified drivers in under 2 minutes"
Example 2: "AI pitch deck generator trained on 50K+ funded decks creates investor-ready slides in 5 minutes"
Example 3: "Automated compliance checking flags regulatory issues before submission, reducing rejection rate 60%"

CRITICAL INSTRUCTIONS:
- Analyze the "features" context deeply - this is your primary source
- Each bullet = One feature + Its measurable impact
- Focus on features that differentiate from competitors
- If features context is sparse, look in moreInfo for product capabilities
- Make features concrete and specific, not vague ("AI-powered" needs to explain WHAT the AI does)

Show what the product DOES and why users choose it.`,
            `One sentence describing how these features work together to create a superior user experience.`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 product feature bullets you generated.
Focus on visualizing: key capabilities, user benefits, technical differentiators.`),
            startupData
        ),

        // 5. TRACTION SLIDE (Proof the Product Works)
        traction: baseSlidePrompt(
            "traction",
            "Traction & Validation",
            `Analyze: What proof exists that customers want this? Growth metrics? User feedback? Revenue?
Look at: moreInfo (CRITICAL - should contain user numbers, revenue, growth rates, retention, satisfaction scores, pilot results).
Focus: The most compelling evidence that validates product-market fit.`,
            `Generate 3 bullets (max 20 words each) proving market validation:

BULLET 1: Primary growth or adoption metric
Example: "Acquired 500 users in 90 days with zero marketing spend; 30% month-over-month growth rate"
Example: "Processed $150K in deliveries across 2,000 transactions in first 3 months of operation"
(Extract from moreInfo - look for user counts, revenue, transaction volume)

BULLET 2: Retention, satisfaction, or quality metric
Example: "85% 30-day user retention; 4.8/5 average rating; 92% would recommend to peers"
Example: "Merchants report 98% delivery success rate vs. 75% with previous providers"
(Look for retention, NPS, satisfaction data in moreInfo)

BULLET 3: Key validation milestone or proof point
Example: "Selected for TechStars Lagos 2024; LOI from 3 enterprise customers worth $200K annual contract value"
Example: "Pilot with Lagos State Ministry resulted in 18% improvement in student test scores"
(Extract partnerships, pilots, awards, customer commitments from moreInfo)

Show momentum and product-market fit with real numbers.`,
            `One sentence explaining what these metrics reveal about customer demand and business viability.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 traction bullets you generated.
Focus on visualizing: growth trajectory, customer satisfaction, validation milestones.`),
            startupData
        ),

        market: baseSlidePrompt(
    "market",
    "Market Opportunity",
    `Analyze: What market is this startup in? How big is it? How fast is it growing?
Look at: industry, scope, moreInfo (may contain market data).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY MARKET RESEARCH PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL: You CANNOT write this slide without conducting google searches. Market sizing REQUIRES external data.

STEP 1: SEARCH FOR TAM (Total Addressable Market)
Run these searches in order:

A. Primary TAM search:
   web_search: "${industry} market size ${scopeContext} 2024"
   web_search: "${industry} ${scopeContext} TAM total addressable market"
   
B. Look for credible sources:
   - Research firms (McKinsey, PwC, Deloitte, BCG)
   - Industry reports (Gartner, IDC, Statista)
   - Government data (World Bank, national statistics)
   - Trade associations
   
C. If no results for specific geography:
   google_search: "${industry} Africa market size" (broader region)
   google_search: "${industry} global market size" (calculate regional share)

STEP 2: SEARCH FOR CAGR (Growth Rate)
google_search: "${industry} ${scopeContext} CAGR growth rate 2024"
google_search: "${industry} market growth forecast ${scopeContext}"

Look for:
- Historical CAGR (past 3-5 years)
- Projected CAGR (next 3-5 years)
- If no specific data, use broader regional or global CAGR

STEP 3: SEARCH FOR MARKET DRIVERS
google_search: "${industry} ${scopeContext} trends 2024"
google_search: "${industry} growth drivers ${scopeContext}"

Look for:
- Regulatory changes
- Technology adoption rates
- Demographic shifts
- Economic factors

STEP 4: CALCULATE SAM (Serviceable Addressable Market)
After finding TAM, calculate SAM based on:
- Geographic focus (from scope)
- Target segment (from businessModel)
- Product category

Formula: SAM = TAM × (Geographic % × Segment % × Category %)

Example: If TAM is $50B global, Nigeria is 5% of market, and you target B2B segment (30% of market):
SAM = $50B × 0.05 × 0.30 = $750M

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION BEFORE WRITING BULLETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before writing ANY market bullet, confirm:
✓ I ran at least 3 web searches for market data
✓ I found TAM from a credible source (can name the source)
✓ I found CAGR from research (not estimated)
✓ Numbers are current (2023-2024 data, not 2019)
✓ I can cite where each number came from

If ANY answer is NO → Run more searches until you find real data

DO NOT PROCEED without completing searches.`,
    
    `Generate 3 bullets (max 20 words each) sizing the opportunity:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET 1: Total Addressable Market (TAM) with SOURCE CITATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MANDATORY FORMAT: "$[Number] [Market Description], growing [CAGR]% annually ([Source] [Year])"

WRONG (no source, suspicious precision):
❌ "$28B Nigerian logistics market, growing 8.6% annually"
Problem: Where did $28B come from? How do we know it's 8.6%?

RIGHT (source cited, verifiable):
✅ "$2.1B Nigerian last-mile delivery market, growing 12% annually (PwC Nigeria 2024)"
Word count: 13 words ✓
Source: PwC Nigeria 2024 report (found via web_search)

✅ "$450M African pitch deck software market, 15% CAGR through 2027 (Statista 2024)"
Word count: 13 words ✓
Source: Statista market research (found via web_search)

RESEARCH REQUIREMENTS:
1. Search: "${industry} market size ${scopeContext} 2024"
2. Find: Credible source (research firm, industry report, government data)
3. Verify: Number is current (2023-2024), not outdated
4. Extract: Exact market size and CAGR
5. Cite: Source name and year in parentheses

CRITICAL: If you cannot find TAM data after searching:
- Try broader geography (e.g., "Africa" instead of "Nigeria")
- Try global market and calculate regional share
- State: "Global ${industry} market at $XB, ${scopeContext} represents estimated X% share"

DO NOT invent market sizes. Better to say "Market data limited" than fake numbers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET 2: Serviceable Addressable Market (SAM) - Your Specific Segment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMULA: "Targeting $[SAM] [specific segment], [geographic focus + key constraint]"

WRONG (vague, no calculation shown):
❌ "Targeting $2.1B last-mile delivery segment in Lagos metro area"
Problem: How did you get $2.1B? Show your work.

RIGHT (calculated from TAM, specific):
✅ "Targeting $800M B2B last-mile segment in Lagos (38% of $2.1B Nigerian market)"
Word count: 14 words ✓
Calculation: $2.1B TAM × 38% B2B segment = $800M SAM

✅ "Focus on $120M pre-seed pitch deck segment in Africa (emerging market founders under $1M raise)"
Word count: 16 words ✓
Calculation: Based on 50K African startups × $2.4K average spend

CALCULATION TEMPLATE:
1. Start with TAM from Bullet 1
2. Apply filters based on YOUR focus:
   - Geographic: (Lagos = 60% of Nigerian market)
   - Segment: (B2B = 40% of logistics market)
   - Price tier: (SME = 70% of business customers)
3. SAM = TAM × Geographic % × Segment % × Price tier %
4. Show calculation in bullet or explain in notes

REQUIREMENTS:
✓ SAM must be smaller than TAM (you're narrowing down)
✓ Show how you calculated it (percentages or constraints)
✓ Be specific about segment (not just "our target market")
✓ Based on businessModel and scope data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET 3: Key Market Driver Creating Urgency
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMULA: "[Trend/Driver] [increased/grew] [metric]% [timeframe], driving [demand for your solution]"

WRONG (vague trend, no data):
❌ "E-commerce penetration in Nigeria increased 45% YoY, driving delivery demand"
Problem: Where's the 45% from? What time period?

RIGHT (specific trend with source):
✅ "Nigerian e-commerce grew 32% in 2023 to $7.6B, increasing demand for last-mile delivery (Statista)"
Word count: 16 words ✓
Source: Statista Nigeria e-commerce report 2024

✅ "African startup funding reached $4.8B in 2023 despite 35% global decline, sustaining pitch deck demand (Partech)"
Word count: 17 words ✓
Source: Partech Africa Tech Funding Report 2024

RESEARCH REQUIREMENTS:
1. Search: "${industry} ${scopeContext} trends 2024"
2. Search: "${industry} growth drivers ${scopeContext} market"
3. Find: Specific trend with quantified impact
4. Verify: Recent data (2023-2024), credible source
5. Connect: How this trend creates demand for YOUR solution

EXAMPLES OF GOOD DRIVERS:
- Regulatory changes (e.g., "New CBN open banking rules")
- Technology adoption (e.g., "Smartphone penetration hit 65%")
- Demographic shifts (e.g., "Youth population under 35 grew to 70%")
- Economic factors (e.g., "Venture funding increased 32%")
- Crisis events (e.g., "Post-pandemic shift to digital payments")

CRITICAL: The driver should explain WHY NOW is the right time for your solution.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL VERIFICATION CHECKLIST (Must Pass ALL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before submitting bullets:
✓ Bullet 1 TAM has source citation in parentheses (e.g., "PwC 2024")
✓ Bullet 1 TAM number was found via web_search (not estimated)
✓ Bullet 1 CAGR was found via web_search (not guessed)
✓ Bullet 2 SAM is smaller than TAM (properly narrowed)
✓ Bullet 2 SAM calculation is based on real constraints (geography, segment, businessModel)
✓ Bullet 3 market driver is a specific, recent trend (2023-2024)
✓ Bullet 3 driver data was found via web_search (not assumed)
✓ All numbers are realistic and verifiable
✓ Each bullet is 20 words or fewer
✓ No hyperbole ("explosive", "massive", "revolutionary")

If ANY item fails → SEARCH MORE or REVISE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMEMBER: Market sizing is the MOST fact-checked slide in a pitch deck. Investors will verify every number. 

If you cannot find data, SAY SO. Don't make up numbers.`,
    
    `One sentence on the specific beachhead strategy - where you'll start and why that segment is winnable now based on the market data you found.`,
    
    "title-bullets",
    
    generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 market opportunity bullets you generated.
Focus on visualizing: market size, target segment, growth drivers.`),
    
    startupData
),

        // 7. BUSINESS MODEL SLIDE
        businessModel: baseSlidePrompt(
            "businessModel",
            "Business Model",
            `Analyze: How does this startup make money? What's the revenue model? What are the unit economics? How does it scale?
Look at: businessModel (PRIMARY SOURCE - should contain pricing model, revenue streams), features (what's monetized), moreInfo (may contain LTV, CAC, margin data, pricing tiers).
Critical: If pricing is dramatically different from competitors (e.g., $1 vs. $100), this is your differentiation story.`,
            `Generate 3 bullets (max 20 words each) showing the business model clarity:

BULLET 1: Revenue model with SPECIFIC pricing architecture
Example: "Pay-as-you-go: $1.35 average per deck vs. competitor subscriptions at $100+/month (98% cost reduction)"
Example: "Freemium SaaS: $10/month premium + $2 per export; targeting 20% conversion rate"
Example: "Transaction fee: 3% of delivery value + $0.50 flat fee per completed ride"
(Extract from businessModel - be SPECIFIC about pricing, tiers, transaction mechanics)

BULLET 2: Unit economics with clear path to profitability
Example: "Targeting $90 LTV / $20 CAC = 4.5:1 ratio; 80%+ gross margins from automated infrastructure"
Example: "Current: $45 LTV, $15 CAC = 3:1 ratio; improving to 5:1 at scale via network effects"
(Look in moreInfo for LTV/CAC data, or calculate realistic targets based on pricing and industry benchmarks)

BULLET 3: Scaling mechanism and margin expansion story
Example: "Near-zero marginal cost per user after AI training; 85%+ gross margins at 10K+ users"
Example: "Network effects: Each new rider increases driver earnings 8%, reducing churn and acquisition costs"
Example: "Watermarked free exports drive viral growth; paid conversion funds 18-month customer payback"
(Explain what creates economic leverage - automation, network effects, viral growth, decreasing CAC)

CRITICAL: If your pricing is 10x cheaper than competitors, LEAD WITH THAT. It's your moat.
Show investors the math works AND gets better over time.`,
            `One sentence explaining the primary driver of profitability and scalability (e.g., "Zero marginal cost structure enables 85%+ margins at scale" or "Network effects reduce CAC 40% for every 10% increase in supply-side density").`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 business model bullets you generated.
Focus on visualizing: pricing model, unit economics, scaling mechanisms.`),
            startupData
        ),

        // 8. GO-TO-MARKET SLIDE
        goMarket: baseSlidePrompt(
            "goMarket",
            "Go-to-Market Strategy",
            `Analyze: How will customers find this product? What channels make sense given the businessModel?
Look at: businessModel, features, industry, moreInfo (may contain GTM plans, partnerships, CAC targets).
Think: What's the most efficient path to first 100, 1000, 10000 customers?`,
            `Generate 3 bullets (max 20 words each) outlining customer acquisition:

BULLET 1: Primary acquisition channel with tactic
Example: "Content SEO targeting 'pitch deck Africa' searches, aiming for 50K monthly organic visits"
(Choose channels that fit businessModel and industry)

BULLET 2: Secondary channel with economics
Example: "Accelerator partnerships: Embedded in 50+ programs, $5 CAC via co-marketing"
(Look for partnership mentions in moreInfo)

BULLET 3: Viral/retention mechanism
Example: "Freemium model with watermarked exports creates 1.2 viral coefficient"
(Extract from features and businessModel)

Show you have a credible, capital-efficient path to customers.`,
            `One sentence explaining how these channels create compounding growth over time.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 go-to-market bullets you generated.
Focus on visualizing: acquisition channels, partnerships, viral mechanisms.`),
            startupData
        ),

        // 9. COMPETITIVE LANDSCAPE SLIDE
        competitions: baseSlidePrompt(
    "competition",
    "Competitive Landscape",
    `You are a professional pitch deck strategist analyzing the competitive landscape.

YOUR GOAL: Identify competitor strengths AND weaknesses, then show how ${startupName} exploits the gaps competitors leave open.

CRITICAL INSIGHT: Investors don't care about feature lists. They want to know:
1. What do competitors do well? (their moat)
2. What critical gaps do they leave? (market opportunity)
3. How does ${startupName} uniquely fill those gaps? (your wedge)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: IDENTIFY TOP 2 COMPETITORS (Industry Leaders)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. If competitions field has specific names → Validate them:
   web_search: "[Competitor] ${industry} ${scopeContext} market position"
   
   CHECK: Are they legitimate top players?
   - Significant funding (>$5M) or revenue
   - Market presence (industry reports mention them)
   - Real traction (>10K users or meaningful scale)
   - Active in past 12 months
   
   ✅ If YES → Use them
   ❌ If NO → Ignore and search for real leaders

B. If competitions is empty/vague OR competitors are minor players:
   web_search: "${industry} ${scopeContext} market leaders 2024"
   web_search: "top ${industry} companies ${scopeContext} competitors"
   
   SELECT: Top 2 competitors by market share/funding/user base

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: DEEP COMPETITIVE INTELLIGENCE (Per Competitor)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For EACH of the top 2 competitors, research:

A. STRENGTHS (What they do well):
   web_search: "[Competitor] features products strengths"
   web_search: "[Competitor] market share competitive advantage"
   
   LOOK FOR:
   - Scale advantages (network effects, user base)
   - Technology moats (proprietary algorithms, patents)
   - Distribution advantages (partnerships, brand recognition)
   - Capital advantages (well-funded, can subsidize pricing)

B. WEAKNESSES (Critical gaps they leave):
   web_search: "[Competitor] complaints problems issues"
   web_search: "[Competitor] limitations gaps weaknesses"
   web_search: "[Competitor] customer reviews negative feedback"
   
   LOOK FOR:
   - Underserved customer segments (geography, price point, use case)
   - Feature gaps (missing capabilities customers want)
   - Poor execution (slow, expensive, low quality)
   - Strategic blind spots (markets they ignore, trends they miss)

C. VERIFY WITH USER REVIEWS:
   web_search: "[Competitor] user reviews complaints reddit"
   web_search: "[Competitor] vs alternatives comparison"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: ANALYZE ${startupName}'S COMPETITIVE POSITION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now analyze YOUR startup data:
- features: What capabilities do you have?
- solutions: What problems do you solve?
- businessModel: Pricing, go-to-market strategy
- scope: Geographic focus, target segment
- moreInfo: Traction, differentiation, positioning

STRATEGIC QUESTIONS:
1. Which competitor weaknesses can you exploit?
2. What market segment are competitors ignoring?
3. What can you do 10x better (speed, cost, quality)?
4. What structural advantage do you have (technology, distribution, economics)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: SYNTHESIZE THE STRATEGIC NARRATIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a WEDGE STRATEGY narrative:
- Competitor A is strong at X, but weak at Y
- Competitor B is strong at Z, but weak at W
- ${startupName} specifically targets weaknesses Y and W

This is how you win in a competitive market.`,
    
    `Generate 3 bullets (max 20 words each) in STRATEGIC GAP ANALYSIS format:

PROFESSIONAL STRUCTURE:
Each bullet = Competitor strength + Critical weakness + How you exploit it

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET 1: COMPETITOR A - Strength + Weakness + Your Wedge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMULA: "[Competitor] leads in [strength], but [weakness]; ${startupName} targets [gap]"
STRICT LIMIT: Maximum 20 words per bullet. Count every word. No exceptions.

WRONG (feature list):
❌ "Gokada offers motorcycle ride-hailing in Lagos with 10,000+ riders and real-time tracking"
Problem: Just describing what they do, not analyzing gaps
Word count: 15 words

RIGHT (strategic gap analysis - all ≤20 words):
✅ "Gokada dominates Lagos (10K riders), but single-city only; ${startupName} offers pan-Nigerian coverage with verified ratings"
Word count: 16 words ✓

✅ "Uber Eats leads delivery (60% share), but 25% commission hurts restaurants; ${startupName}'s 8% fee targets merchants"
Word count: 17 words ✓

✅ "Stripe processes $640B with great UX, but 2.9% pricing excludes micro-merchants; ${startupName}'s 1% captures long-tail"
Word count: 17 words ✓

RESEARCH TEMPLATE:
1. Search: "[Competitor A] market position strengths"
   → Extract: What's their main competitive advantage?
   
2. Search: "[Competitor A] limitations problems gaps"
   → Extract: What's their Achilles heel?
   
3. Analyze: How does ${startupName} specifically target that weakness?
   → Use: features, solutions, businessModel, scope data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET 2: COMPETITOR B - Strength + Weakness + Your Wedge
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMULA: "[Competitor] excels at [strength], but [weakness]; ${startupName} fills [gap]"
STRICT LIMIT: Maximum 20 words. Count carefully before finalizing.

WRONG (vague comparison):
❌ "Kobo360 is a major freight player, but we offer better technology and customer experience"
Problem: Vague, unverifiable, unprofessional
Word count: 14 words

RIGHT (specific gap exploitation - all ≤20 words):
✅ "Kobo360 excels in B2B freight, but 2-hour booking excludes SMEs; ${startupName}'s instant matching captures small businesses"
Word count: 17 words ✓

✅ "Beautiful.ai has 2M users with stunning templates, but $40/month misses African founders; ${startupName}'s $1.35 captures them"
Word count: 17 words ✓

✅ "Flutterwave processes $16B, but 2-week integration blocks startups; ${startupName}'s 5-minute API targets pre-seed founders"
Word count: 15 words ✓

RESEARCH TEMPLATE:
1. Search: "[Competitor B] competitive advantages scale"
   → Extract: Where are they strong?
   
2. Search: "[Competitor B] weaknesses customer complaints"
   → Extract: What frustrates their customers?
   
3. Analyze: How does ${startupName} solve that specific pain point?
   → Cross-reference with solutions, businessModel, features

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BULLET 3: ${startupName}'S UNIQUE WEDGE - The Strategic Advantage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FORMULA: "${startupName} uniquely combines [capability 1] + [capability 2], capturing [underserved segment]"
STRICT LIMIT: Maximum 20 words. Be ruthlessly concise.

WRONG (generic differentiation):
❌ "${startupName} offers superior technology and customer experience at a competitive price"
Problem: Every startup claims this, means nothing
Word count: 13 words

RIGHT (specific strategic positioning - all ≤20 words):
✅ "${startupName} combines instant verification + escrow payments, capturing trust-sensitive C2C delivery market competitors ignore"
Word count: 15 words ✓

✅ "${startupName} uniquely offers AI-trained African content at $1.35/deck, capturing 15M underserved emerging market founders"
Word count: 15 words ✓

✅ "${startupName} combines route optimization + verified ratings + pay-per-delivery, addressing SME complaints while maintaining 80% margins"
Word count: 16 words ✓

STRATEGIC POSITIONING CHECKLIST:
✓ Identifies SPECIFIC competitor weaknesses (from research)
✓ Shows HOW ${startupName} addresses those gaps (from features/solutions)
✓ Explains WHY this creates defensible advantage (economics, network effects, switching costs)
✓ Specifies the UNDERSERVED SEGMENT you're targeting (from scope/businessModel)
✓ Includes measurable differentiation (speed, cost, quality metrics)

ANALYZE YOUR POSITIONING:
1. What do BOTH competitors struggle with? (common weakness)
2. What structural advantage enables you to solve it? (technology, economics, focus)
3. Why can't incumbents easily copy you? (your moat)
4. What market segment do you own? (your beachhead)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION CHECKLIST - Must Pass ALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For EACH bullet:
✓ Competitor name is accurate (verified via search)
✓ Competitor strength is real (found in search results, not assumed)
✓ Competitor weakness is documented (found via search: complaints, reviews, gaps)
✓ ${startupName}'s advantage directly addresses that weakness (cross-referenced with features/solutions/businessModel)
✓ Metrics are specific and verifiable (e.g., "2+ hours" not "slow", "$500 minimum" not "expensive")
✓ Market segment is clearly defined (e.g., "C2C delivery", "SMEs", "emerging market founders")
✓ No hyperbole ("revolutionary", "crushing", "dominating")
✓ **CRITICAL: Each bullet is EXACTLY 20 words or FEWER** (count every word including articles)

**WORD COUNT ENFORCEMENT:**
- Before finalizing ANY bullet, count: 1, 2, 3... up to 20
- If >20 words → REWRITE more concisely
- Remove unnecessary adjectives, combine phrases, use abbreviations where appropriate
- Test: Can you say it in fewer words without losing meaning?

If ANY item fails → REVISE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXAMPLE RESEARCH-TO-BULLET FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 1: Logistics Startup

Research Phase:
→ Search: "Gokada Nigeria logistics strengths"
  Finding: "Market leader in Lagos, 10K+ riders, strong brand"
  
→ Search: "Gokada limitations coverage problems"
  Finding: "Only operates in Lagos, expanding slowly, no C2C focus"
  
→ Analyze: ${startupName} features shows "Pan-Nigerian coverage, instant C2C matching"

Result Bullet (20 words):
"Gokada dominates Lagos (10K riders, strong brand), but single-city focus misses pan-Nigerian demand; ${startupName} offers nationwide coverage"
Word count: 18 words ✓

Example 2: Pitch Deck Tool

Research Phase:
→ Search: "Beautiful.ai pitch deck platform strengths"
  Finding: "2M users, stunning templates, $96M funding"
  
→ Search: "Beautiful.ai pricing complaints limitations"
  Finding: "$40/month subscription, generic templates, no localization"
  
→ Analyze: ${startupName} businessModel shows "$1.35 per deck, trained on African pitch data"

Result Bullet (20 words):
"Beautiful.ai has 2M users with stunning templates, but $40/month excludes African founders; ${startupName}'s $1.35 captures emerging markets"
Word count: 18 words ✓

Example 3: Fintech Payments

Research Phase:
→ Search: "Stripe Africa payment processing strengths"
  Finding: "Best-in-class infrastructure, $640B processed, loved by developers"
  
→ Search: "Stripe Africa limitations pricing complaints"
  Finding: "2.9% + $0.30 per transaction makes micropayments uneconomical"
  
→ Analyze: ${startupName} businessModel shows "1% flat fee, no minimums, targets micro-merchants"

Result Bullet (20 words):
"Stripe leads payments ($640B processed, great UX), but 2.9% fees exclude micro-merchants; ${startupName}'s 1% serves long-tail profitably"
Word count: 18 words ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REMEMBER: Investors fund startups that exploit SPECIFIC competitor weaknesses in UNDERSERVED segments, not startups that claim to be "better" at everything.

Show the wedge. Show the gap. Show why you win.`,
    
    `One sentence explaining the STRATEGIC INSIGHT from your competitive analysis:

FORMULA: "While competitors optimize for [what they prioritize], they systematically underserve [segment], creating a [size] opportunity for ${startupName} to capture [specific advantage]"

EXAMPLES (all ≤20 words):

✅ "Incumbents optimize for enterprises ($500+ minimums), missing 2M SMEs needing on-demand delivery; ${startupName} captures via pay-per-use"
Word count: 18 words ✓

✅ "Competitors prioritize global features, underserving African founders needing investor guidance; ${startupName} dominates via localized AI training"
Word count: 17 words ✓

✅ "Established players optimize for scale (2.9% fees), ignoring 50M micro-merchants; ${startupName} serves profitably via 1% flat-fee"
Word count: 17 words ✓

This should articulate WHY the competitive gap exists (strategic tradeoff) and HOW you exploit it (your wedge).`,
    
    "title-bullets",
    
    `1 competitive comparison matrix or chart showing ${startupName} vs. top 2 competitors across key feature dimensions (speed, cost, trust, coverage, etc.). Use real, defensible comparison points from research.`,
    
    startupData
),

        // 10. TRACTION & MILESTONES SLIDE
        milestones: baseSlidePrompt(
            "milestones",
            "Traction & Roadmap",
            `Analyze: What has been accomplished? What's the growth trajectory? What's next?
Look at: moreInfo (CRITICAL - should contain traction data, user numbers, revenue, milestones).
Extract: Best historical metrics, current momentum, future goals.`,
            `Generate 3 bullets (max 20 words each) showing momentum:

BULLET 1: Most impressive historical metric with timeframe
Example: "Grew from 0 to 500 beta users in 90 days, 30% month-over-month growth, zero paid marketing"
(Look in moreInfo for traction data)

BULLET 2: Specific near-term milestone (6-12 months)  
Example: "Target: 5,000 paying users, $50K MRR within 6 months of funding"
(Extract from moreInfo or calculate based on growth rate)

BULLET 3: Major milestone that triggers next funding round
Example: "Series A readiness: $500K ARR, 4:1 LTV/CAC, 20% month-over-month growth sustained"
(Look for funding strategy in moreInfo)

Show traction, momentum, and clear vision for what's next.`,
            `One sentence demonstrating you understand what metrics matter for your stage and category.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 milestone bullets you generated.
Focus on visualizing: past achievements, near-term goals, long-term vision.`),
            startupData
        ),

        // 11. TEAM SLIDE
        team: baseSlidePrompt(
            "team",
            "Team",
            `Analyze: Who is building this? What relevant experience do they bring?
Look at: team array (name, role, expertise for each member).
Focus: Domain expertise, technical skills, complementary backgrounds, past successes.`,
            `Generate one bullet per core team member (max ${teamImageCount} bullets, max 18 words each):

FORMAT: "[Name], [Role]: [Specific relevant achievement or expertise]"

Example: "Sarah Chen, CTO: Built fraud detection infrastructure at Stripe processing $2B+ annually"
NOT: "Sarah Chen, CTO: 10+ years of experience in fintech and payments"

Analyze each team member's expertise and highlight their MOST RELEVANT accomplishment for this specific startup.
Focus on what makes them credible for ${industry} specifically.`,
            `One sentence (max 20 words) explaining why THIS team is uniquely equipped to execute THIS plan. Emphasize founder-market fit and complementary skills.`,
            "image-text",
            `Generate ${teamImageCount} professional headshot placeholders for ${teamNamesList}. Style: Clean business portraits with neutral backgrounds.`,
            startupData
        ),

        // 12. FINANCIAL PROJECTIONS SLIDE
        financials: baseSlidePrompt(
            "financials",
            "Financial Projections",
            `Analyze: What's the financial trajectory? What are realistic projections?
Look at: moreInfo (should contain current revenue/MRR, burn rate, projections, assumptions).
Calculate: Conservative but ambitious 3-year forecast based on businessModel and traction.`,
            `Generate 3 bullets (max 20 words each) outlining financial path:

BULLET 1: Current financial state
Example: "Currently $15K MRR, $20K monthly burn, 18-month runway with existing capital"
(Extract from moreInfo)

BULLET 2: Conservative 3-year projection with key assumption
Example: "Projecting $2.5M ARR by Year 3, assuming 5% monthly user growth and 20% paid conversion"
(Build from current metrics in moreInfo)

BULLET 3: Path to profitability or next milestone
Example: "Break-even at 15K paying users (Month 24); Series A at $500K ARR with 4:1 LTV/CAC"
(Calculate based on unit economics from businessModel)

Projections must be conservative and defensible.`,
            `One sentence stating your primary growth assumption and acknowledging the key risk to that assumption.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 financial bullets you generated.
Focus on visualizing: current state, projected growth, profitability path.`),
            startupData
        ),

        // 13. VISION & EXIT SLIDE
        vision: baseSlidePrompt(
            "vision",
            "Vision & Exit Potential",
            `Analyze: What's the long-term opportunity? Who would acquire this? Why?
Look at: industry, solutions, scope, moreInfo (may contain vision or expansion plans).
Use web_search to identify credible strategic acquirers in ${industry} and recent acquisitions.`,
            `Generate 3 bullets (max 20 words each) outlining long-term potential:

BULLET 1: Market position goal in 5 years
Example: "Become the standard fundraising platform for African startups, 50% market penetration"
(Based on market opportunity and competitive positioning)

BULLET 2: 2-3 credible acquirers with strategic rationale
Example: "Stripe (wants African payment + startup data); Microsoft (expanding Azure in Africa)"
**Use web_search to identify real acquirers active in ${industry}**

BULLET 3: Acquisition readiness threshold
Example: "At $20M ARR, 100K active founders, company becomes strategic acquisition target"
(Calculate based on typical acquisition multiples in industry)

Make the exit path credible and attractive.`,
            `One sentence explaining how this becomes a $100M+ outcome for investors within 5-7 years.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 vision bullets you generated.
Focus on visualizing: market leadership, acquisition potential, exit timing.`),
            startupData
        ),

        // 14. INDUSTRY-SPECIFIC SLIDE
        industrySpecific: baseSlidePrompt(
            "industrySpecific",
            `${industry === "fintech" || industry === "healthtech" ? "Regulatory Status" : "Strategic Assets"}`,
            `Analyze: What derisks this investment? Partnerships? IP? Compliance?
Look at: moreInfo (CRITICAL - may contain regulatory status, partnerships, IP, compliance data).
For fintech/healthtech: Focus on regulatory pathway.
For other industries: Focus on strategic partnerships and assets.`,
`Generate 3 bullets (max 20 words each) showing derisking factors:

Analyze moreInfo for mentions of:
- Regulatory status, licenses, compliance certifications
- Strategic partnerships, pilot programs, LOIs
- Intellectual property, patents, proprietary data
- Key customer contracts or commitments

Present the 2 strongest derisking factors and 1 strategic advantage that creates barriers to entry.

Example for fintech: "CBN payment license application submitted Q1 2025; legal review complete"
Example for edtech: "Partnership with Lagos State Education Ministry provides access to 2,000+ schools"
Example for healthtech: "Patent pending on diagnostic algorithm; priority date March 2024"`,
            `One sentence explaining how these assets accelerate growth or create competitive barriers.`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 strategic asset bullets you generated.
Focus on visualizing: regulatory status, partnerships, intellectual property.`),
            startupData
        ),

        // 15. THE ASK SLIDE
        ask: baseSlidePrompt(
            "ask",
            "The Ask",
            `Analyze: How much capital is needed? What will it achieve? What's the timeline?
Look at: moreInfo (CRITICAL - should contain funding amount, round type, use of funds, milestones).
Calculate: Runway, key metrics for next round, clear milestones.`,
            `Generate 3 bullets (max 20 words each) detailing the funding request:

BULLET 1: Specific amount and round type
Example: "Seeking $250K pre-seed at $2M post-money valuation to fund 18-month runway"
(Extract from moreInfo)

BULLET 2: Precise capital allocation
Example: "60% product development (AI feedback engine), 40% market expansion (Lagos, Nairobi, Accra)"
(Look for fund allocation in moreInfo)

BULLET 3: Key milestone this funding enables
Example: "Achieves $100K ARR, 10K active users, 4:1 LTV/CAC - Series A ready"
(Extract funding goals from moreInfo)

Make the ask specific, justified, and milestone-driven.`,
            `One sentence on runway (months) and the key success metric for the next funding round.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 funding ask bullets you generated.
Focus on visualizing: funding amount, capital allocation, milestone achievement.`),
            startupData
        ),

        // 16. CONTACT SLIDE
        contact: baseSlidePrompt(
            "contact",
            "Next Steps",
            `Create a clear closing call-to-action.
Look at: Any contact preferences in moreInfo, or use standard closing.`,
            `Generate 2 bullets (max 15 words each):

BULLET 1: Clear call-to-action
Example: "Schedule 30-minute product demo and Q&A session"

BULLET 2: Contact information
Example: "Email: founder@startup.com | Website: startup.com"

Keep it simple and action-oriented.`,
            `One sentence thanking investors and expressing confidence in the opportunity.`,
            "full-image",
            generateDynamicIconPrompt(brandColor, `Create 2 icons that represent the 2 contact bullets you generated.
Focus on visualizing: call-to-action (calendar/meeting) and contact methods (email/website).

NOTE: Generate only 2 icons for this slide, not 3.`),
            startupData
        ),

        // 17. THANK YOU SLIDE
        thankYou: baseSlidePrompt(
            "thankYou",
            "Thank You",
            `This is a simple closing slide with just a thank you message.
No bullets, no notes, no images needed.`,
            `Return an empty array [] - this slide has NO bullets.`,
            `Return an empty string "" - this slide has NO notes.`,
            "full-image",
            `No images needed - return empty array []`,
            startupData
        ),

    };

    // Industry-specific slides
    const industryLower = (industry || "").toLowerCase();

    if (industryLower === "healthtech" || industryLower === "biotech") {
        slides.compliance = baseSlidePrompt(
            "compliance",
            "Regulatory Pathway",
            `Analyze: What's the regulatory status? Timeline? Risks?
Look at: moreInfo (should contain FDA/regulatory status, compliance certifications, timeline).
Use web_search if you need to understand specific regulatory requirements for ${industry} in ${scopeContext}.`,
            `Generate 3 bullets (max 20 words each):

BULLET 1: Current regulatory status with timeline
Example: "FDA 510(k) submission planned Q2 2026; pre-submission meeting completed December 2024"
(Extract from moreInfo)

BULLET 2: Compliance certifications achieved
Example: "HIPAA compliant infrastructure; SOC 2 Type II certification in progress"
(Look for compliance data in moreInfo)

BULLET 3: Mitigation plan for biggest regulatory risk
Example: "Working with FDA consultancy to derisk clearance timeline; budget includes 6-month buffer"
(Synthesize from moreInfo or typical industry practices)

Show regulatory awareness and derisking strategy.`,
            `One sentence explaining how the regulatory pathway creates competitive advantage or timing opportunity.`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 bullets you generated for this industry-specific slide.
Focus on visualizing the specific concepts mentioned in each bullet.`),
            startupData
        );

        slides.validation = baseSlidePrompt(
            "validation",
            "Clinical Evidence & IP",
            `Analyze: What proof exists that this works? What IP protection exists?
Look at: moreInfo (should contain clinical trial data, pilot results, efficacy data, patent status).`,
            `Generate 3 bullets (max 20 words each):

BULLET 1: Strongest clinical/scientific evidence
Example: "Pilot with 200 patients: 15% improvement in outcome vs. control group (p<0.05)"
(Extract from moreInfo)

BULLET 2: Intellectual property status
Example: "Patent pending on diagnostic algorithm; priority date March 2024, claims cover key methodology"
(Look for IP data in moreInfo)

BULLET 3: Source of credibility
Example: "Results validated by Johns Hopkins researchers; publication submitted to JAMA"
(Extract from moreInfo)

Prove scientific rigor and competitive protection.`,
            `One sentence on how clinical evidence and IP create defensible competitive position.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 bullets you generated for this industry-specific slide.
Focus on visualizing the specific concepts mentioned in each bullet.`),
            startupData
        );
    }

    if (industryLower === "fintech") {
        slides.security = baseSlidePrompt(
            "security",
            "Security & Risk Management",
            `Analyze: How is customer data protected? What security measures exist? Risk metrics?
Look at: moreInfo (should contain security protocols, certifications, fraud rates, risk management).`,
            `Generate 3 bullets (max 20 words each):

BULLET 1: Key security measures
Example: "AES-256 encryption at rest and in transit; SOC 2 Type II compliant infrastructure"
(Extract from moreInfo)

BULLET 2: Operational risk metrics
Example: "Fraud rate maintained at 0.03%, significantly below 0.1% industry benchmark"
(Look for risk data in moreInfo)

BULLET 3: Audit and certification status
Example: "Annual penetration testing by third-party firm; PCI DSS Level 1 certification in progress"
(Extract compliance status from moreInfo)

Show operational maturity and risk management.`,
            `One sentence on how security infrastructure builds customer trust and reduces investment risk.`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 bullets you generated for this industry-specific slide.
Focus on visualizing the specific concepts mentioned in each bullet.`),
            startupData
        );

        slides.regulation = baseSlidePrompt(
            "regulation",
            "Licensing & Compliance",
            `Analyze: What licenses are needed? Current status? Timeline?
Look at: moreInfo (should contain licensing status, compliance roadmap, regulatory relationships).
Use web_search to understand specific fintech regulatory requirements in ${scopeContext}.`,
            `Generate 3 bullets (max 20 words each):

BULLET 1: Current licensing status
Example: "Operating under Payment Service Provider license in Nigeria; full MFB license application Q3 2025"
(Extract from moreInfo)

BULLET 2: Next compliance milestone
Example: "Kenya regulatory approval targeted Q2 2025; local counsel engaged, documentation 80% complete"
(Look for expansion plans in moreInfo)

BULLET 3: Regulatory advantage
Example: "First-mover on new CBN open banking framework; direct relationship with regulatory team"
(Extract competitive advantages from moreInfo)

Demonstrate regulatory readiness and strategic positioning.`,
            `One sentence showing you understand compliance as competitive advantage, not just a checkbox.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 bullets you generated for this industry-specific slide.
Focus on visualizing the specific concepts mentioned in each bullet.`),
            startupData
        );
    }

    if (industryLower === "edtech") {
        slides.adoption = baseSlidePrompt(
            "adoption",
            "User Adoption & Partnerships",
            `Analyze: How many users? What engagement levels? Key partnerships?
Look at: moreInfo (should contain user numbers, retention rates, engagement metrics, institutional partnerships).`,
            `Generate 3 bullets (max 20 words each):

BULLET 1: Key adoption metric with engagement
Example: "5,000 active students across 50 schools; 85% weekly active usage, 4.7/5 satisfaction rating"
(Extract from moreInfo)

BULLET 2: Most strategic partnership
Example: "Partnership with Lagos State Ministry of Education provides access to 2,000+ public schools"
(Look for partnerships in moreInfo)

BULLET 3: Retention and growth metrics
Example: "90-day retention at 78%; schools renew at 95% rate after first year"
(Extract retention data from moreInfo)

Show product-market fit and distribution leverage.`,
            `One sentence on how partnerships and adoption metrics validate market need and accelerate growth.`,
            "image-text",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 bullets you generated for this industry-specific slide.
Focus on visualizing the specific concepts mentioned in each bullet.`),
            startupData
        );

        slides.outcomes = baseSlidePrompt(
            "outcomes",
            "Learning Impact & Pedagogy",
            `Analyze: Does this actually improve learning? What's the evidence? Curriculum alignment?
Look at: moreInfo (should contain learning outcome data, test scores, curriculum alignment, pedagogical approach).`,
            `Generate 3 bullets (max 20 words each):

BULLET 1: Quantified learning impact
Example: "Students using platform improved standardized test scores 18% vs. control group (n=200, 6 months)"
(Extract from moreInfo)

BULLET 2: Curriculum alignment and accreditation
Example: "Aligned with Nigerian National Curriculum; approved by West African Examinations Council"
(Look for curriculum data in moreInfo)

BULLET 3: Pedagogical differentiation
Example: "Adaptive learning algorithm personalizes content based on 50+ skill assessments per student"
(Extract methodology from moreInfo or features)

Prove educational efficacy and institutional credibility.`,
            `One sentence demonstrating measurable impact on learning outcomes validates educational value proposition.`,
            "title-bullets",
            generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 bullets you generated for this industry-specific slide.
Focus on visualizing the specific concepts mentioned in each bullet.`),
            startupData
        );
    }

// These are UNIQUE to Web3 and don't duplicate existing slides

if (industryLower === "web3" || industryLower === "crypto" || industryLower === "blockchain" || industryLower === "defi") {
    
    // 1. TOKENOMICS SLIDE (Web3-specific - doesn't exist in standard deck)
    slides.tokenomics = baseSlidePrompt(
        "tokenomics",
        "Token Economics & Utility",
        `Analyze: How does the token drive the ecosystem? What's the utility? Distribution? Incentive structure?
Look at: moreInfo (CRITICAL - should contain token utility, distribution, vesting, supply metrics, incentive mechanisms).
Use web_search if you need to understand tokenomics best practices or benchmark against similar projects.

CRITICAL: The token should enable the business model. Investors want to see token utility tied to business logic - if your token drives network incentives, governance, or liquidity, show that clearly.`,
        `Generate 3 bullets (max 20 words each) explaining tokenomics with clarity:

BULLET 1: Core token utility (WHY the token exists and HOW it creates value)
Example: "Governance token enables DAO voting on protocol upgrades; stakers earn 8-12% APY from transaction fees"
Example: "Utility token required for network access; burns 2% per transaction creating deflationary pressure"
Example: "Rewards token incentivizes liquidity provision; 60% of protocol revenue distributed to LP stakers"
(Extract from moreInfo - focus on UTILITY and VALUE CAPTURE, not just features)

BULLET 2: Token distribution with anti-dilution safeguards
Example: "Total supply: 100M tokens; 40% community, 25% team (4-year vest), 20% treasury, 15% investors (2-year cliff)"
Example: "Fair launch: 80% liquidity mining over 5 years; 10% team (linear unlock); 10% DAO treasury"
(Look for allocation and vesting in moreInfo - show distribution including allocations for team, investors, community)

BULLET 3: Economic sustainability mechanism (how tokenomics creates long-term value)
Example: "Revenue-sharing: 50% of platform fees buy-back and burn tokens, reducing supply while demand grows"
Example: "Network effects: Each new validator increases staking rewards 3%, creating compounding incentive alignment"
Example: "Token required for gas; as network usage 10x, token demand increases while supply remains capped"
(Explain the FLYWHEEL - how token economics reinforce growth and value accrual)

Show token utility is defensible and creates real economic value, not speculation.`,
        `One sentence explaining how tokenomics aligns user incentives with protocol growth and creates sustainable value capture.`,
        "image-text",
        generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 tokenomics bullets you generated.
Focus on visualizing: token utility mechanism, distribution/vesting model, value capture flywheel.`),
        startupData
    );

    // 2. BLOCKCHAIN ARCHITECTURE (Web3-specific technical deep-dive)
    slides.architecture = baseSlidePrompt(
        "architecture",
        "Technical Architecture & Security",
        `Analyze: What blockchain/layer is being used? Why that choice? What's the technical differentiation?
Look at: moreInfo (should contain chain choice, smart contract architecture, scalability approach, security measures).
Use web_search to understand technical tradeoffs of the chosen blockchain infrastructure.

CRITICAL: Show technical competence without overwhelming non-technical investors. Use simple explanations.`,
        `Generate 3 bullets (max 20 words each) explaining technical approach:

BULLET 1: Blockchain infrastructure choice with strategic rationale
Example: "Built on Ethereum L2 (Arbitrum) for 10x lower gas costs while maintaining Ethereum security guarantees"
Example: "Multi-chain deployment: Polygon for transactions, Ethereum mainnet for settlement, optimizing cost vs security"
Example: "Custom Cosmos SDK chain enables 10,000 TPS with 2-second finality for real-time trading"
(Extract from moreInfo - explain WHAT you're building on and WHY that choice is strategic)

BULLET 2: Core technical innovation or competitive moat
Example: "Zero-knowledge proofs enable private transactions with public verifiability; patent pending on novel ZK circuit"
Example: "Novel consensus mechanism reduces validator requirements 80%, enabling wider decentralization"
Example: "Cross-chain bridge architecture supports 15+ chains with <5 minute finality, 3x faster than competitors"
(Look for technical differentiation in moreInfo - explain the unique innovation)

BULLET 3: Security and audit status (builds trust)
Example: "Smart contracts audited by Trail of Bits and Consensys Diligence; $2M bug bounty program active"
Example: "Formal verification completed on core contracts; multi-sig treasury with 5/7 threshold"
Example: "Security-first design: time-locked upgrades, circuit breakers on withdrawals, insurance fund with $500K TVL"
(Extract security measures from moreInfo - critical for building investor confidence)

Keep explanations simple - avoid overwhelming technical jargon.`,
        `One sentence explaining how technical architecture enables scale while maintaining security and decentralization.`,
        "image-text",
        generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 architecture bullets you generated.
Focus on visualizing: blockchain infrastructure, technical innovation, security measures.`),
        startupData
    );

    // 3. ON-CHAIN METRICS (Web3-specific validation - different from standard traction)
    slides.onChainMetrics = baseSlidePrompt(
        "onChainMetrics",
        "On-Chain Validation & TVL",
        `Analyze: What on-chain metrics prove protocol-market fit? TVL? Active wallets? Transaction volume?
Look at: moreInfo (CRITICAL - should contain TVL, daily/monthly active users, transaction volumes, retention rates).

CRITICAL: Use VERIFIABLE on-chain data. These metrics can be checked on blockchain explorers.`,
        `Generate 3 bullets (max 20 words each) proving on-chain validation:

BULLET 1: Total Value Locked (TVL) and growth trajectory
Example: "$4.2M TVL reached in 90 days post-launch; 2,500+ unique wallet addresses, 35% month-over-month TVL growth"
Example: "$12M TVL across 3 liquidity pools; top 15 protocol by TVL in Arbitrum ecosystem"
(Extract from moreInfo - TVL is THE key metric for DeFi protocols)

BULLET 2: User activity and retention metrics (on-chain behavior)
Example: "150K transactions processed across 8,500 active wallets; average 18 transactions per user per month"
Example: "60-day wallet retention at 72%; power users (10+ transactions) represent 40% of volume"
(Look for on-chain engagement data in moreInfo - shows sticky product)

BULLET 3: Protocol integrations and ecosystem validation
Example: "Integration with Uniswap and Curve; $500K liquidity incentives from Arbitrum Foundation grant"
Example: "12,000 NFTs minted at 0.5 ETH floor; secondary market volume $2.1M in first 60 days"
Example: "Partnership with Circle (USDC issuer) for native stablecoin integration"
(Extract partnerships and strategic relationships from moreInfo)

All metrics should be verifiable on-chain - transparency builds trust.`,
        `One sentence explaining what these on-chain metrics reveal about protocol-market fit and network effects.`,
        "title-bullets",
        generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 on-chain metrics bullets you generated.
Focus on visualizing: TVL growth, user activity, protocol integrations.`),
        startupData
    );

    // 4. REGULATORY STRATEGY (Web3-specific - different from fintech regulation)
    slides.web3Regulation = baseSlidePrompt(
        "web3Regulation",
        "Regulatory Strategy & Compliance",
        `Analyze: How is the project navigating crypto regulation? Legal structure? Token classification?
Look at: moreInfo (should contain legal entity structure, jurisdiction, token classification, compliance measures).
Use web_search to understand current regulatory environment for crypto/Web3 in relevant jurisdictions.

CRITICAL: Regulatory risk is VCs' #1 concern in Web3. Address it proactively.`,
        `Generate 3 bullets (max 20 words each) addressing regulatory positioning:

BULLET 1: Legal entity structure and jurisdiction choice
Example: "Incorporated as Cayman Foundation Company; operates in Switzerland for regulatory clarity and innovation-friendly framework"
Example: "Delaware C-Corp holds IP; protocol governed by decentralized DAO to minimize regulatory surface area"
Example: "BVI entity structure recommended by Cooley LLP; compliant with local crypto asset service provider regulations"
(Extract from moreInfo - jurisdiction choice is critical for Web3 projects)

BULLET 2: Token classification and compliance approach
Example: "Utility token analysis by Perkins Coie: no security features, sufficient decentralization, limited team reliance"
Example: "Governance token with no profit-sharing rights; Howey test analysis supports non-security classification"
Example: "Security token registered under Reg D; qualified investors only, full SEC compliance framework implemented"
(Look for token classification in moreInfo - explain whether utility, governance, or security token)

BULLET 3: Compliance measures and risk mitigation strategy
Example: "Geo-blocking for restricted jurisdictions; KYC/AML via Chainalysis for fiat on-ramps; compliance officer hired"
Example: "Progressive decentralization roadmap: admin keys time-locked, multi-sig treasury, on-chain governance by Month 12"
Example: "No token pre-sale to US persons; fair launch with equal access; securities counsel on retainer"
(Extract compliance measures from moreInfo - show proactive compliance, not avoidance)

Show regulatory awareness and proactive risk management.`,
        `One sentence explaining how regulatory strategy balances compliance requirements with decentralization principles.`,
        "title-bullets",
        generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 regulatory strategy bullets you generated.
Focus on visualizing: legal structure, token compliance, risk mitigation.`),
        startupData
    );

    // 5. DECENTRALIZATION ROADMAP (Web3-specific - shows progressive path to autonomy)
    slides.decentralization = baseSlidePrompt(
        "decentralization",
        "Decentralization Roadmap",
        `Analyze: What's the path to progressive decentralization? Token launch timeline? Governance transition?
Look at: moreInfo (should contain decentralization plan, token launch timeline, governance transition milestones).

CRITICAL: Progressive decentralization shows regulatory sophistication and long-term vision.`,
        `Generate 3 bullets (max 20 words each) outlining decentralization path:

BULLET 1: Token generation event and distribution timeline
Example: "Token generation event Q2 2025; 40% fair launch via liquidity mining over 18 months; no pre-sale"
Example: "Airdrop to early users (15% supply) in Month 6; governance token unlocks begin Month 12 with 24-month linear vest"
Example: "Public sale Q3 2025 at $0.10/token; $3M raise target; listing on Uniswap with $500K initial liquidity"
(Extract from moreInfo - investors care deeply about launch mechanics and dilution schedule)

BULLET 2: Governance transition and community control
Example: "Month 12: Transfer admin keys to 5/7 multi-sig; Month 18: Launch DAO governance; Month 24: Full token holder control"
Example: "Year 1: Team maintains upgrade keys; Year 2: Time-locked governance; Year 3: Fully autonomous DAO"
Example: "Q3 2025: Governance forum launch; Q4 2025: First community votes; 2026: Protocol upgrades require token vote"
(Look for governance roadmap in moreInfo - shows commitment to decentralization)

BULLET 3: Protocol maturity and autonomy milestones
Example: "Smart contract immutability at Month 24; all protocol parameters controlled by token holders; team advisory role only"
Example: "Treasury management transitions to DAO; community-elected council manages $5M+ protocol-owned liquidity"
Example: "Protocol achieves full decentralization: no admin keys, immutable contracts, on-chain governance for all decisions"
(Extract long-term autonomy plan from moreInfo - ultimate goal is credible neutrality)

Show clear path from centralized launch to decentralized protocol.`,
        `One sentence explaining how progressive decentralization balances rapid iteration with community ownership and regulatory compliance.`,
        "image-text",
        generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 decentralization roadmap bullets you generated.
Focus on visualizing: token launch, governance transition, protocol autonomy.`),
        startupData
    );

    // 6. COMMUNITY & ECOSYSTEM (Web3-specific - community is the moat)
    slides.community = baseSlidePrompt(
        "community",
        "Community & Ecosystem Growth",
        `Analyze: How strong is the community? What ecosystem partnerships exist? Developer adoption?
Look at: moreInfo (should contain community size, engagement metrics, developer partnerships, ecosystem integrations).

CRITICAL: In Web3, community strength and ecosystem alignment ARE the competitive moat.`,
        `Generate 3 bullets (max 20 words each) demonstrating community traction:

BULLET 1: Community size and engagement metrics (not just vanity metrics)
Example: "35K Discord members with 78% weekly active rate; 120K Twitter followers; 2,500+ daily community messages"
Example: "15K GitHub stars; 80+ external contributors; 12 community-built integrations launched in past 90 days"
Example: "Community treasury: $2M; 15 governance proposals passed; average 45% voter participation in protocol decisions"
(Extract from moreInfo - show ACTIVE community, not passive followers)

BULLET 2: Strategic ecosystem partnerships and integrations
Example: "Integrated with Chainlink oracles, The Graph indexing, Gelato automation; featured in Ethereum Foundation newsletter"
Example: "Official partnership with Polygon for L2 deployment; $250K ecosystem grant; co-marketing to 2M+ developers"
Example: "DeFi integrations: Liquidity on Uniswap V3, Curve, Balancer; aggregator support from 1inch and Paraswap"
(Look for ecosystem relationships in moreInfo - show strategic positioning within Web3 stack)

BULLET 3: Developer adoption and network effects
Example: "40+ projects building on our protocol; SDK downloaded 25K+ times; 8 ecosystem projects raised $5M+ using our infra"
Example: "Open-source toolkit: 150+ developers contributed; 5 hackathon wins; developer grants program with $500K budget"
Example: "Network effects: Each new liquidity provider increases APY for all users; 3x TVL growth in 60 days"
(Extract developer metrics from moreInfo - show compounding ecosystem value)

Community ownership and ecosystem momentum create defensible competitive moat.`,
        `One sentence explaining how community ownership and ecosystem network effects drive sustainable protocol growth.`,
        "image-text",
        generateDynamicIconPrompt(brandColor, `Create icons that represent each of the 3 community/ecosystem bullets you generated.
Focus on visualizing: community engagement, strategic partnerships, network effects.`),
        startupData
    );
}

    return slides;
};

// Generate prompts for selected slides
const generatePromptsForSlides = (startupData, slides) => {
    if (!startupData || typeof startupData !== 'object') {
        throw new Error("Invalid startupData provided to prompt generator.");
    }
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

// Enhanced Correction Prompt with icon keyword / image prompt generation
const generateCorrectionPrompt = (slideData, correctionPrompt, startupData) => {
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

    // Provide full startup context for intelligent corrections
    const { startupName, industry, scope, problems, solutions, moreInfo, team, features, businessModel, brandColor } = startupData;

    const contextBlocks = {
        startup: `${startupName} operates in ${industry}${scope ? ` within ${scope}` : ''}`,
        problem: problems || "Market inefficiency requiring technology solution",
        solution: solutions || "Technology-enabled solution",
        features: features || "Core product capabilities",
        businessModel: businessModel || "Revenue generation approach",
        additionalInfo: moreInfo || "Additional startup details",
        team: team?.map(t => `${t.name} (${t.role}): ${t.expertise}`).join(" | ") || "Team"
    };

    const imageContextForAI = images
        ?.map((img, i) => ({
            index: i + 1,
            prompt: img.prompt || "",
            caption: img.caption || "",
            key: img.key || "N/A",
            url: img.url || "N/A",
            source: img.source || "ai-generated",
            status: img.status || "ready",
            isSelected: img.isSelected || false
        }))
        ?.map(img => `
    Image ${img.index}:
        - Prompt: "${img.prompt}"
        - Caption: "${img.caption}"
        - Key: "${img.key}"
        - URL: "${img.url}"
        - Source: "${img.source}"
        - Status: "${img.status}"
        - IsSelected: ${img.isSelected}
        `)
        ?.join("\n") || "No image data found.";

    // ✅ Determine if this is an icon-based slide or image-based slide
    const isIconBasedSlide = ['problem', 'solution', 'product', 'traction', 'market', 'businessModel', 
                               'goMarket', 'milestones', 'financials', 'vision', 'industrySpecific', 
                               'ask', 'security', 'regulation', 'adoption', 'outcomes', 'compliance', 
                               'validation', 'tokenomics', 'architecture', 'onChainMetrics', 
                               'web3Regulation', 'decentralization', 'community'].includes(slideType);
    
    const isImageBasedSlide = ['cover', 'team', 'competitions'].includes(slideType);
    
    const scopeContext = scope || "the target market";

    // ✅ Generate appropriate image generation instructions based on slide type
    let imageGenerationInstructions = '';
    
    if (isIconBasedSlide) {
        // ICON-BASED SLIDES: Generate icon keywords
        imageGenerationInstructions = `
ICON KEYWORD GENERATION (For Icon-Based Slides):

If generateImage is true (user wants new icons), you MUST generate icon keywords for EACH bullet point.

ICON KEYWORD REQUIREMENTS:
- Each icon needs EXACTLY 3 keywords separated by commas (no spaces)
- Order: Primary (specific compound), Secondary (simpler), Tertiary (guaranteed fallback)
- Format: "keyword1,keyword2,keyword3" (kebab-case, lowercase, no spaces)
- Keywords must be CONCRETE objects that exist in icon libraries (Lucide, Heroicons)

KEYWORD SELECTION STRATEGY:
1. Identify the CORE VISUAL ELEMENT of the bullet point
2. Choose the most LITERAL object that represents it
3. Provide 3 keywords as fallbacks (primary, secondary, tertiary)

GOOD KEYWORDS (Concrete Objects):
✓ clock-fast,timer,clock
✓ target-arrow,target,bullseye
✓ brain-circuit,cpu,brain
✓ rocket-launch,rocket,zap
✓ shield-check,shield,lock
✓ map-pin-check,radar,map-pin
✓ chart-line-up,trending-up,chart-line
✓ dollar-decrease,trending-down,dollar-sign
✓ users-check,users,team

BAD KEYWORDS (Abstract/Vague):
✗ innovation,efficiency,optimization
✗ improvement,enhancement,success
✗ quality,performance,excellence

CAPTION REQUIREMENTS:
- EXACTLY 4 words
- Title Case
- Represents bullet's key message (not icon description)

KEYWORD GUIDELINES BY CATEGORY:

Time/Speed: clock-fast,timer,clock | timer-reset,stopwatch,hourglass
Money/Cost: dollar-decrease,coins,dollar-sign | wallet-check,piggy-bank,wallet
Accuracy: target-arrow,bullseye,target | shield-check,check-circle,badge
Technology: brain-circuit,cpu,brain | chip-check,circuit-board,chip
Analytics: chart-line-up,trending-up,graph | bar-chart-big,activity,chart
Location: map-pin-check,route,map | radar-scan,navigation,compass
People: users-check,people,user | team-check,user-group,team
Communication: bell-ring,message-check,bell | mail-open,chat,envelope
Automation: settings-automation,workflow,cog | cog-play,gear,tool
Performance: rocket-launch,zap,rocket | gauge-max,speedometer,bolt

EXAMPLES:

Bullet: "Reduced booking time from 2 hours to 3 minutes"
→ Keywords: "clock-fast,timer,clock"
→ Caption: "Booking Time Reduced Drastically"

Bullet: "Algorithm learns from 10K+ daily transactions"
→ Keywords: "brain-circuit,cpu,brain"
→ Caption: "Machine Learning Algorithm Optimizes"

Bullet: "98% delivery success rate vs 75% industry average"
→ Keywords: "target-arrow,bullseye,target"
→ Caption: "Delivery Success Rate Improved"

Bullet: "Real-time driver tracking improves satisfaction"
→ Keywords: "map-pin-check,radar,map-pin"
→ Caption: "Real Time Driver Tracking"

OUTPUT FORMAT FOR ICONS:
{
  "generateImage": true,
  "images": [
    {
      "prompt": "clock-fast,timer,clock",
      "caption": "Booking Time Reduced Drastically"
    },
    {
      "prompt": "brain-circuit,cpu,brain",
      "caption": "Machine Learning Algorithm Optimizes"
    },
    {
      "prompt": "target-arrow,bullseye,target",
      "caption": "Delivery Success Rate Improved"
    }
  ]
}

CRITICAL RULES:
✅ CORRECT: "clock-fast,timer,clock" (3 keywords, no spaces, commas only)
❌ WRONG: "clock-fast, timer, clock" (has spaces)
❌ WRONG: "clock-fast" (only one keyword)
❌ WRONG: "clock fast timer clock" (spaces instead of commas)
`;
    } else if (isImageBasedSlide) {
        // IMAGE-BASED SLIDES: Generate full image prompts
        if (slideType === 'cover') {
            imageGenerationInstructions = `
IMAGE PROMPT GENERATION (For Cover Slide):

If generateImage is true, generate ONE professional hero image prompt.

REQUIREMENTS:
- Show the CUSTOMER using the product in a real scenario
- NOT abstract concepts or technology
- Style should match: ${brandColor}
- Professional and clean aesthetic

EXAMPLE PROMPTS:
- "African founder presenting pitch deck to investors in modern Lagos office, ${brandColor} accent lighting"
- "Nigerian logistics professional using mobile app to coordinate delivery, ${brandColor} branded interface"
- "Healthcare worker using tablet in clinic, ${brandColor} medical interface, Nigerian setting"

OUTPUT FORMAT:
{
  "generateImage": true,
  "images": [
    {
      "prompt": "Professional hero image representing ${industry} in ${scopeContext}. Style: ${brandColor}. Show customer using product in real scenario.",
      "caption": "Hero Image"
    }
  ]
}
`;
        } else if (slideType === 'team') {
            imageGenerationInstructions = `
IMAGE PROMPT GENERATION (For Team Slide):

Team slides use DEFAULT PROFILE IMAGES - DO NOT generate new images unless explicitly requested.

If user explicitly requests custom team photos:
{
  "generateImage": false,
  "images": [
    {
      "prompt": "Professional headshot placeholder",
      "caption": "[Team Member Name]",
      "key": "PRESERVE EXISTING KEY",
      "url": "PRESERVE EXISTING URL",
      "source": "default",
      "status": "completed",
      "isSelected": true
    }
  ]
}

NOTE: Team images are typically NOT regenerated during corrections.
`;
        } else if (slideType === 'competitions') {
            imageGenerationInstructions = `
IMAGE PROMPT GENERATION (For Competition Slide):

If generateImage is true, generate ONE competitive comparison chart/matrix prompt.

REQUIREMENTS:
- Visual comparison matrix showing ${startupName} vs competitors
- Display key differentiators: speed, cost, trust, coverage, etc.
- Professional chart design with ${brandColor} highlights

EXAMPLE PROMPT:
"Competitive comparison matrix chart showing ${startupName} vs top 3 competitors across key feature dimensions (speed, cost, trust, coverage). Professional business chart design with ${brandColor} highlights for ${startupName}. Clean, modern, data-driven visualization."

OUTPUT FORMAT:
{
  "generateImage": true,
  "images": [
    {
      "prompt": "Competitive comparison matrix or chart showing ${startupName} vs. top 2-3 competitors across key feature dimensions (speed, cost, trust, coverage, etc.). Use real, defensible comparison points. Professional ${brandColor} design.",
      "caption": "Competitive Comparison Matrix"
    }
  ]
}
`;
        }
    } else {
        // CONTACT SLIDE: Only 2 icons
        imageGenerationInstructions = `
ICON KEYWORD GENERATION (For Contact Slide - 2 Icons Only):

If generateImage is true, generate EXACTLY 2 icon keyword sets (not 3).

Icon 1: Call-to-action (calendar, meeting, appointment)
Keywords: "calendar-check,calendar,schedule"
Caption: "[Four Word CTA]"

Icon 2: Contact method (email, website, phone)
Keywords: "mail-check,mail,envelope"
Caption: "[Four Word Contact]"

OUTPUT FORMAT:
{
  "generateImage": true,
  "images": [
    {
      "prompt": "calendar-check,calendar,schedule",
      "caption": "Schedule Meeting With Us"
    },
    {
      "prompt": "mail-check,mail,envelope",
      "caption": "Email Us For Details"
    }
  ]
}
`;
    }

    return `
CRITICAL OUTPUT REQUIREMENTS:
- Return ONLY valid RFC 8259 JSON
- No markdown, no comments, no extra text

YOUR ROLE:
You are an expert pitch deck consultant making TARGETED corrections based on user feedback.
Make SURGICAL EDITS - only change what the user explicitly requests.

CORE PRINCIPLE:
If the user asks to change bullet 2, ONLY modify bullet 2. Keep everything else EXACTLY as-is (word-for-word).
DO NOT "improve" or "enhance" content the user didn't mention.

WORD LIMITS (STRICT):
- Title: Maximum 12 words
- Bullets: Maximum 20 words each
- Notes: Maximum 25 words

CURRENT SLIDE DATA:
${JSON.stringify({ slideType, title, bullets, notes, layout, images }, null, 2)}

SLIDE TYPE CLASSIFICATION:
- Current slide type: "${slideType}"
- Is icon-based slide: ${isIconBasedSlide}
- Is image-based slide: ${isImageBasedSlide}

IMAGE METADATA (PRESERVE ALL FIELDS UNLESS EXPLICITLY CHANGING):
${imageContextForAI}

STARTUP CONTEXT (USE ONLY IF NEEDED FOR THE SPECIFIC CORRECTION):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPANY: ${contextBlocks.startup}
PROBLEM: ${contextBlocks.problem}
SOLUTION: ${contextBlocks.solution}
FEATURES: ${contextBlocks.features}
BUSINESS MODEL: ${contextBlocks.businessModel}
TEAM: ${contextBlocks.team}
ADDITIONAL INFO: ${contextBlocks.additionalInfo}
BRAND COLOR: ${brandColor}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER CORRECTION REQUEST:
"${correctionPrompt}"

INSTRUCTIONS:

1. IDENTIFY WHAT TO CHANGE:
   Parse the correction request to determine EXACTLY which element(s) need modification.
   - Is it the title, a specific bullet, notes, layout, or image?
   - Are they asking to add, remove, rephrase, shorten, expand, or replace content?

2. MAKE SURGICAL EDIT:
   - Change ONLY the requested element(s)
   - Copy all other content EXACTLY as-is (preserve exact wording)
   - If user says "change bullet 2", bullets[0] and bullets[2] must remain identical to input

3. IMAGE/ICON INTENT DETECTION:
   Set "generateImage": true ONLY if the user's request indicates they want visual/graphical changes:
   
   **Indicates NEW/CHANGED image/icon needed:**
   - Mentions image-related words: "image", "picture", "photo", "visual", "graphic", "chart", "diagram", "icon"
   - Requests visual action: "show", "display", "visualize", "depict", "create", "generate", "add", "replace" + visual element
   - Wants to see something: "I want to see X", "display the Y", "show me Z"
   - Asks to "regenerate icons", "change icons", "update icons"
   
   **Does NOT need new image/icon (text-only changes):**
   - Only mentions text elements: "bullet", "title", "wording", "text", "phrasing"
   - Requests text modifications: "make shorter", "add detail", "rephrase", "fix grammar"
   - Caption-only changes: "fix the caption", "update caption text" (change caption field only, preserve image)

4. GENERATE APPROPRIATE IMAGE/ICON CONTENT:
   ${imageGenerationInstructions}

5. PRESERVE IMAGE METADATA:
   - If generateImage: false → Keep ALL image fields unchanged (prompt, caption, key, url, status, source, isSelected)
   - If caption-only change → Modify caption field only, preserve all other image fields
   - If new image/icon needed → Create new image/icon objects with updated prompts, set key/url to null

6. MAINTAIN QUALITY:
   - Keep professional tone, avoid hyperbole
   - Ensure metrics are realistic and grounded
   - Stay within word limits
   - Use web_search if you need external data for the correction

STRICT JSON OUTPUT SCHEMA:
{
  "generateImage": boolean,
  "slideType": "string",
  "title": "string (max 12 words) - PRESERVE exactly unless user requested title change",
  "bullets": [
    "string (max 20 words) - PRESERVE exactly unless user requested this bullet change",
    "string (max 20 words) - PRESERVE exactly unless user requested this bullet change",
    "string (max 20 words) - PRESERVE exactly unless user requested this bullet change"
  ],
  "notes": "string (max 25 words) - PRESERVE exactly unless user requested notes change",
  "layout": "default|title-bullets|image-text|full-image - PRESERVE exactly unless user requested layout change",
  "images": [
    {
      "prompt": "string - ICON KEYWORDS (keyword1,keyword2,keyword3) for icon slides OR IMAGE PROMPT for image slides",
      "caption": "string - EXACTLY 4 words for icons, descriptive for images",
      "key": "string (PRESERVE if not generating new)",
      "url": "string (PRESERVE if not generating new)",
      "source": "string (PRESERVE if not generating new)",
      "status": "string (PRESERVE if not generating new)",
      "isSelected": "boolean (PRESERVE if not generating new)"
    }
  ]
}

CRITICAL REMINDERS:
✅ For icon slides: Generate "keyword1,keyword2,keyword3" format (3 keywords, no spaces)
✅ For image slides: Generate full descriptive image prompts
✅ SURGICAL EDITS ONLY: Change what was requested, preserve everything else exactly
✅ If generateImage: false, preserve ALL image metadata fields
✅ Caption must be EXACTLY 4 words for icon slides

Remember: SURGICAL EDITS ONLY. Change what was requested. Preserve everything else exactly.
`;
};

// Professional Pitch Deck Color Kit Generator - Concise & Effective
const createTailwindPrompt = (brandColor = 'orange') => {
    const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(brandColor);
    const colorInput = isHex ? brandColor : `Interpret "${brandColor}" as a professional hex color`;

    return `You are a pitch deck color expert. Analyze ${colorInput} and create TWO optimized palettes.

BRAND COLOR ANALYSIS:
1. Identify: Hue (red/orange/yellow/green/blue/purple), saturation (vibrant/muted), lightness (dark/light), temperature (warm/cool)
2. Apply psychology: Red=energy, Orange=innovation, Yellow=optimism, Green=growth, Blue=trust, Purple=luxury

PALETTE 1 - DEFAULT (text-heavy slides):
Choose ONE approach based on brand color:
• APPROACH A (vibrant colors): Brand color background (70-85% sat) + white text
• APPROACH B (dark brand/tech): Dark neutral bg (#1a1a1a-#1a2332) + vibrant brand title
• APPROACH C (light brand/health): Off-white bg (#FAFAFA) + bold brand title

PALETTE 2 - ICON SLIDE (icon-based slides):
CRITICAL: Background is NEVER brand color. Select strategic neutral:

Background Rules:
• Warm brand → Cool neutral (slate #334155, navy #1E293B, charcoal #2E3440)
• Cool brand → Warm neutral (beige #FAF8F3, sand #F5F1E8, warm gray #E8E6E3)
• Dark brand (L<35%) → Light neutral (#F5F5F7 to #FAFAFA)
• Light brand (L>70%) → Dark neutral (#1A1A1A to #374151)
• Vibrant brand (S>70%) → Desaturated neutral (5-15% saturation)

Text Hierarchy (all use brand color with varying intensity):
• Title: Brand color 95-100% saturation (most dominant)
• Bullets: Brand color 85-95% saturation (slightly softer)
• Notes: Brand color 65-75% saturation (subtle hierarchy)

Accessibility: All colors must pass WCAG AA (4.5:1 for body, 3:1 for large text ≥18pt)

OUTPUT (JSON only, no markdown):
{
  "default": {
    "background": "#HEX",
    "title": "#HEX",
    "bullets": "#HEX",
    "notes": "#HEX"
  },
  "iconSlide": {
    "background": "#HEX",
    "title": "#HEX",
    "bullets": "#HEX",
    "notes": "#HEX"
  }
}`;
};


// Allowed slide types by industry
const getAllowedSlides = (industry) => {
    const baseSlides = [
        'cover', 'problem', 'solution', 'product', 'traction', 'market',
        'businessModel', 'goMarket', 'competitions', 'milestones',
        'team', 'financials', 'vision', 'industrySpecific', 'ask', 'contact', 'thankYou'
    ];

    const industrySlides = {
        healthtech: ["compliance", "validation"],
        biotech: ["compliance", "validation"],
        fintech: ["security", "regulation"],
        edtech: ["adoption", "outcomes"],
        web3: ["tokenomics", "architecture", "onChainMetrics", "web3Regulation", "decentralization", "community"],
        defi: ["tokenomics", "architecture", "onChainMetrics", "web3Regulation", "decentralization", "community"],
    };

    const extra = industrySlides[(industry || "").toLowerCase()] || [];
    return [...baseSlides, ...extra];
};

module.exports = { 
    generatePromptsForSlides, 
    getAllowedSlides, 
    generateCorrectionPrompt, 
    createTailwindPrompt 
};
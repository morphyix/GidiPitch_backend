const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');
const PPTXGenJS = require("pptxgenjs");
const PitchDeck = require('../models/pitchDeck');
const { title } = require('process');

exports.exportPitchDeckToPDF = async (req, res) => {
    try {
        const { deckId } = req.params;
        const deck = await PitchDeck.findById(deckId);

        if (!deck) 
            return
         res.status(404).json({ message: 'Deck not found' });

         // Format deck content into slides
         const slides = [
                { title: 'Cover', content: deck.cover },
                {title: 'Vision', content: deck.vision_statement },
                { title: 'Problem', content: deck.problem_statement },
                { title: 'Solution', content: deck.solution },
                {title: 'project_overview', content: deck.project_overview },
                { title: 'Market Opportunity', content: deck.market_opportunity },
                {title: 'target_audience', content: deck.target_audience },
                { title: 'Business Model', content: deck.business_model },
                { title: 'Traction', content: deck.traction },
                {title: 'comprtition', content: deck.competition },
                {title: 'Go-to-Market Strategy', content: deck.go_to_market_strategy },
                {title: 'financial_projections', content: deck.financial_projections },
                { title: 'Team', content: deck.team },
                {title: 'fund-raising', content: deck.fund_raising },
                {title: 'contact', content: deck.contact },
                {title: 'Call to Action', content: deck.call_to_action },
                {title: 'testimonials', content: deck.testimonials },
                {title: 'Case Studies', content: deck.case_studies },
                {title: 'closing summary', content: deck.closing_summary },
                {title: 'final call to action', content: deck.final_call_to_action },
         ];

         const htmlPath = path.join(__dirname, '../templates/pitchDeckTemplate.ejs');
         const html = await ejs.renderFile(htmlPath, { 
            company_name: deck.company_name,
            tagline: deck.tagline,
            slides,
          });

          pdf.create(html).toStream((err, stream) => {
            if (err) return
            res.status(500).json({ message: 'Error generating PDF' });
            res.setHeader('Content-Type', 'application/pdf');
            stream.pipe(res);
          });
        } catch (err) {
            console.error('Error exporting pitch deck to PDF:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
};




const getSlideData = (body) => ({
  cover: {
    company_name: body.company_name,
    tagline: body.tagline,
    logo_url: body.logo_url,
  },
  vision: {
    vision_statement: body.vision_statement,
  },
  problem: {
    problem_statement: body.problem_statement,
    why_it_matters: body.why_it_matters,
  },
  // all other slides follow similarly but I will complete them later


})
exports.exportToPPTX = async (req, res) => {
  try {
    const data =agetSlideData(req.body);
    const pptx = new PPTXGenJS();

    // Slide 1: Cover
    const slide1 = pptx.addSlide();
    slide1.addText(data.cover.company_name, { x: 1, y: 1, fontSize: 24, bold: true });
    slide1.addText(data.cover.tagline || '', { x: 1, y: 1.5, fontSize: 18 });

    if (data.cover.logo_url) {
      slide1.addImage({ path: data.cover.logo_url, x: 0.5, y: 0.5, w: 2, h: 2 });
    }

    // Slide 2: Vision
    const slide2 = pptx.addSlide();
    slide2.addText('Vision', { x: 1, y: 0.5, fontSize: 20, bold: true, color: "003366", });
    slide2.addText(data.vision.vision_statement || '', { x: 1, y: 1.2, w: "90%", h:"70%", fontSize: 16, color: "000000", lineSpacingMultiple: 1.5, });


    // the output file
    const fileName = `PitchDeck-${data.cover.company_name}-${Date.now()}.pptx`;
    const filePath = path.join(__dirname, '../exports', fileName);
    await pptx.writeFile({ fileName});
    res.download(fileName);
  } catch (error) {
    console.error('Error exporting to PPTX:', error);
    res.status(500).json({ message: 'Error exporting to PPTX' });
  }
};
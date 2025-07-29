const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');
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
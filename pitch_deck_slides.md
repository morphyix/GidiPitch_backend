## Slide 1: Cover Slide
- Description: It should show a company logo, name and tagline.
- Data To Collect:
 - Company_name(string)
 - tagline(string)
 - logo_url(string, optional)

## Slide 2: Vision Statement
- Description: your bold vision __ The "why" behind your startup
- Data To Collect:
 - vision statement (string)

## Slide 3: Problem
- Description: What problem the startup is solving
- Data To Collect
  - problem_statement(string)
  - why is matters (string)

## Slide 4: Solution
- Description: Description of the product
- Data To Collect
 - solution description(string)
 - key features (array of strings)

## Slide 5: Product Demo / How it works
- Description: Simple step-by-step or link showing how it works
- Data To Collect:
 - how it works (string)
 - demo link (string, optional)

## Slide 6: Market Opportunity
- Description: Size of the market
- Data To Collect:
 - total addressable market (string)
 - serviceable market (string)
 - target market segment (string)

## Slide 7: Target Customer
- Description: Your ideal customer profile
- Data To Collect: 
 - customer description (string)
 - customer pain points (array of strings)

## Slide 8: Buisness Models
- Description: How the startup makes money
- Data To Collect: 
 - revenue streams (array of strings)
 - pricing strategy (string)

## Slide 9: Traction/Progress
- Description: Achievements and metrics
- Data To Collect: 
 - traction milestones (array of strings)
 - key metrics (array of objects: {label: string, value: string||number})

## Slide 10: Competition
- Description: Your Competitors and how you're diffrent 
- Data To Collect: 
 - main competitors (array of string) 
 - your advantages (array of strings)

## Slide 11: Go-To-Market Strategy
- Description: Marketing and description strategy
- Data To Collect: 
 - marketing channels (arrays of strings)
 - growth strategy (string)

## Slide 12: Financial Projections
- Description: Forecast of revenue, costs, and profit
- Data To Collect:
 - financial forecast (array of objects: {year: string|number, revenue:number, cost:number, profit:number })
 - assumptions (string)

## Slide 13: Team
- Description: Founders and team bios
- Data To Collect:
 - team members (array of objects: {name:string, role:string, background:string})

## Slide 14: Fundraising Ask
- Description: How much you are raising and what for 
- Data To Collect:
 - amount raising (number | string)
 - funding stage (string)
 - what funds will be used for (arrays of strings)

## Slide 15: Contact and CTA
- Description: How investors can reach you
- Data To Collect: 
 - contact email (string)
 - phone number (string | number)
 - website URL (string, optional)

## Slide 16: Testimonials
- Description: Real user or partner quotes
- Data To Collect:
 - testimonials (array of objects: name:string, title or company?:string, quote:string, photo_URL?: string)

## Slide 17: Case Studies
- Description: Short success stories with results
- Data To Collect:
  - case studies (array of objects: {title: string, summary: string, problem: string, solution: string, results:string|array, link?:string})

## Slide 18: Closing Summary / Final CTA
- Description: Wrap-up and final investor call-to-action
- Data To Collect
 - closing Statement (string)
 - final cta (string)
 - optional links (array of strings)
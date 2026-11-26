import { SampleContract } from "./types";

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: "rental-blr",
    label: "Bengaluru Rental (11-Mo)",
    badge: "4 Traps Found",
    category: "Rental Agreement",
    description: "11-month residential lease with hidden deposit forfeiture, unilateral rent hike & 48-hour eviction.",
    text: `RESIDENTIAL LEAVE AND LICENSE AGREEMENT (11 MONTHS)

This Agreement is made at Bengaluru on this 26th day of November, 2026 between Mr. Ramesh Gowda (Licensor/Owner) and the Tenant (Licensee) for the residential flat at Indiranagar, Bengaluru.

1. RENT & DEPOSIT: The monthly rent shall be ₹32,000/- payable on or before the 5th of every month. The Licensee shall pay an interest-free refundable security deposit of ₹1,92,000/- (6 months' rent) prior to possession.

2. LOCK-IN & EXIT: There shall be a mandatory 11-month lock-in period for the Licensee. If the Licensee vacates before 11 months for any reason whatsoever, the entire security deposit of ₹1,92,000/- shall stand forfeited automatically.

3. DEDUCTIONS & PAINTING: At the time of vacating, the Licensor shall deduct a mandatory non-negotiable amount equal to two months' rent (₹64,000/-) towards painting, deep cleaning, and general wear-and-tear, regardless of the actual condition of the premises.

4. UNILATERAL TERMINATION & RENT REVISION: The Licensor reserves the sole right to revise the monthly rent by up to 15% at any time with 15 days' SMS notice, and may terminate this license and require vacant possession within 48 hours if the Licensor deems any visitor or noise to be a nuisance.

5. JURISDICTION: All disputes shall be subject exclusively to arbitration by a sole arbitrator appointed solely by the Licensor.`,
    demoAnalysis: {
      contractTitle: "Indiranagar 11-Month Leave & License Agreement",
      category: "Rental Agreement",
      safetyScore: 22,
      verdict: "DO NOT SIGN AS-IS",
      executiveSummary:
        "This lease shifts massive financial risk onto the tenant: a 6-month deposit (₹1.92L), automatic 100% deposit forfeiture on early exit, a flat ₹64,000 mandatory deduction even for normal wear-and-tear, and a 48-hour eviction clause.",
      riskVectors: {
        financialTrap: 94,
        ipRightsGrab: 10,
        lockInPenalty: 90,
        unilateralPower: 88,
      },
      findings: [
        {
          id: "r1",
          title: "100% Deposit Forfeiture on Early Exit",
          severity: "CRITICAL",
          category: "Lock-in & Exit",
          exactQuote:
            "If the Licensee vacates before 11 months for any reason whatsoever, the entire security deposit of ₹1,92,000/- shall stand forfeited automatically.",
          plainEnglishTrap:
            "If you have a medical emergency, job transfer, or severe water/maintenance issue and leave in month 8, you lose your entire ₹1,92,000 deposit—not just the remaining rent.",
          legalContext:
            "Under Section 74 of the Indian Contract Act, 1872, penalty/forfeiture clauses must reflect reasonable actual loss, not an arbitrary windfall. Symmetric 1–2 month notice is standard.",
          counterClause:
            "Either party may terminate this agreement after an initial 3-month lock-in by giving 1 (one) month's prior written notice. Security deposit shall be refunded in full within 15 days of handover, less only unpaid rent/utilities.",
          potentialLossEstimate: "₹1,92,000 total deposit risk",
        },
        {
          id: "r2",
          title: "Mandatory ₹64,000 Painting Deduction",
          severity: "CRITICAL",
          category: "Financial Trap",
          exactQuote:
            "the Licensor shall deduct a mandatory non-negotiable amount equal to two months' rent (₹64,000/-) towards painting, deep cleaning, and general wear-and-tear, regardless of the actual condition of the premises.",
          plainEnglishTrap:
            "Even if you keep the flat spotless for 11 months, the landlord automatically pockets ₹64,000 (2 months' rent) for 'normal wear-and-tear'.",
          legalContext:
            "Normal wear-and-tear is the landlord's responsibility under the Model Tenancy Act. Actual painting costs for a 2BHK in Bengaluru are typically ₹15,000–₹22,000—or waived if returned in original condition.",
          counterClause:
            "Normal wear and tear is excluded from deductions. Only actual, itemized repair or painting costs supported by GST invoices (capped at ₹18,000) may be deducted if damage exceeds normal use.",
          potentialLossEstimate: "₹46,000–₹64,000 guaranteed loss",
        },
        {
          id: "r3",
          title: "48-Hour Eviction & 15% Mid-Term Rent Hike",
          severity: "HIGH",
          category: "Unilateral Power",
          exactQuote:
            "The Licensor reserves the sole right to revise the monthly rent by up to 15% at any time with 15 days' SMS notice, and may terminate this license and require vacant possession within 48 hours",
          plainEnglishTrap:
            "Your rent isn't actually fixed for 11 months, and the landlord can order you out in 48 hours over a subjective 'nuisance' claim.",
          legalContext:
            "Fixed-term licenses cannot have arbitrary mid-term rent hikes, and 48-hour eviction violates standard 30-day natural justice notice norms.",
          counterClause:
            "Monthly rent shall remain fixed for the entire 11-month term, with a maximum 5–7% escalation only upon mutual renewal. Termination by Licensor requires 30 days' written notice.",
          potentialLossEstimate: "₹4,800/mo hike + sudden eviction risk",
        },
        {
          id: "r4",
          title: "One-Sided Landlord-Appointed Arbitrator",
          severity: "MEDIUM",
          category: "Unilateral Power",
          exactQuote:
            "All disputes shall be subject exclusively to arbitration by a sole arbitrator appointed solely by the Licensor.",
          plainEnglishTrap:
            "If the landlord refuses to return your ₹1.92L deposit, the person judging your case is hand-picked by the landlord.",
          legalContext:
            "The Supreme Court of India (Perkins Eastman Architects v. HSCC) bars unilateral appointment of a sole arbitrator by an interested party.",
          counterClause:
            "Any dispute shall be resolved by a mutually appointed sole arbitrator in Bengaluru, or before the jurisdictional Rent Authority / Small Causes Court.",
          potentialLossEstimate: "Biased dispute resolution",
        },
      ],
      negotiation: {
        subject: "Requested Fair Edits to Indiranagar Rental Agreement",
        tone: "Polite & Collaborative",
        emailBody: `Hi Mr. Gowda,

Thank you for sharing the draft Leave & License agreement for the Indiranagar flat. I am excited to move in and take great care of the property.

Before we finalize on stamp paper, could we align 3 standard clauses so the agreement is fair to both of us?
1. Deposit & Lock-in: Replace full ₹1.92L forfeiture with a 3-month lock-in + 1-month notice period (and 15-day refund timeline on handover).
2. Painting/Wear & Tear: Cap deductions to actual itemized invoices (excluding normal wear-and-tear) rather than a flat 2-month deduction.
3. Rent & Notice: Keep rent fixed for the 11-month term and make termination notice 30 days on both sides, with mutual dispute resolution.

Let me know if this works—happy to sign and transfer the deposit right away once updated!

Best regards,
[Your Name]`,
        whatsappShort:
          "Hi Mr. Gowda! Reviewed the flat agreement—excited to move in. Just 3 quick standard tweaks before signing: (1) 1-month notice after 3-mo lock-in instead of full deposit forfeiture, (2) actuals-only painting deduction instead of flat 2-month cut, (3) fixed rent for 11 months + 30-day mutual notice. Can we update these so I can transfer the deposit today?",
      },
      analysisMode: "demo-engine",
      pipelineMs: 840,
      analyzedAt: new Date().toISOString(),
    },
  },
  {
    id: "startup-offer",
    label: "Startup Offer & Bond",
    badge: "3 Critical Traps",
    category: "Employment & Bond",
    description: "Software Engineer offer with ₹2.5L 24-month training bond, 2-year non-compete & side-project IP grab.",
    text: `OFFER OF EMPLOYMENT & SERVICE BOND

Dear Candidate,
We are pleased to offer you the role of Junior Software Engineer at NovaStack Labs Pvt. Ltd. at a CTC of ₹6,00,000 per annum.

1. MANDATORY SERVICE BOND: Upon joining, you shall execute a 24-month Service Bond. If you resign or are terminated for any reason before completing 24 months, you shall immediately pay NovaStack Labs liquidated damages of ₹2,50,000/-, and the Company may withhold your relieving letter and experience certificate until full payment.

2. NON-COMPETE & NON-SOLICIT: During employment and for a period of 24 months after leaving the Company, you shall not join, consult for, or build any software product in the SaaS, AI, FinTech, or Enterprise sectors anywhere in India.

3. INTELLECTUAL PROPERTY ASSIGNMENT: All code, designs, open-source contributions, hackathon projects, or inventions created by you—whether during office hours or on your personal time, weekends, or personal laptop—shall belong exclusively and perpetually to NovaStack Labs.

4. NOTICE PERIOD ASYMMETRY: The Company may terminate your employment with 7 days' notice without assigning any reason. However, you must serve a mandatory 90-day notice period with no buyout option.`,
    demoAnalysis: {
      contractTitle: "NovaStack Labs Offer Letter & 24-Month Bond",
      category: "Employment & Bond",
      safetyScore: 18,
      verdict: "DO NOT SIGN AS-IS",
      executiveSummary:
        "This offer contains severe career and IP traps: an unenforceable 2-year broad non-compete, a ₹2.5L bond that applies even if they fire you, and a blanket IP grab covering your personal weekend/hackathon projects.",
      riskVectors: {
        financialTrap: 85,
        ipRightsGrab: 96,
        lockInPenalty: 92,
        unilateralPower: 84,
      },
      findings: [
        {
          id: "e1",
          title: "Blanket IP Grab on Personal & Hackathon Projects",
          severity: "CRITICAL",
          category: "IP & Rights Grab",
          exactQuote:
            "All code, designs, open-source contributions, hackathon projects, or inventions created by you—whether during office hours or on your personal time, weekends, or personal laptop—shall belong exclusively and perpetually to NovaStack Labs.",
          plainEnglishTrap:
            "Anything you build on weekends, in hackathons, or on your personal laptop legally belongs to the company forever—even if it has zero overlap with your job.",
          legalContext:
            "Standard fair employment agreements limit IP assignment strictly to work created within the scope of employment or using company resources/confidential data.",
          counterClause:
            "IP assignment applies solely to inventions created during employment hours, using Company resources/confidential information, or directly relating to the Company's active business. Personal open-source and hackathon projects on personal time/devices remain yours.",
          potentialLossEstimate: "Loss of 100% personal & hackathon IP",
        },
        {
          id: "e2",
          title: "₹2.5L Bond Triggered Even If Company Fires You",
          severity: "CRITICAL",
          category: "Financial Trap",
          exactQuote:
            "If you resign or are terminated for any reason before completing 24 months, you shall immediately pay NovaStack Labs liquidated damages of ₹2,50,000/-, and the Company may withhold your relieving letter",
          plainEnglishTrap:
            "On a ₹50k/month salary, if they lay you off in month 6, you owe them ₹2,50,000 (5 months of gross pay) and they can hold your relieving letter hostage.",
          legalContext:
            "Indian courts only enforce employment bonds to the extent of proven actual training expenditure, and never when termination is initiated by the employer without gross misconduct.",
          counterClause:
            "Any training cost recovery shall be capped at documented third-party training expenses, prorated monthly over 12 months, and waived entirely if terminated by the Company without cause. Relieving letters shall never be withheld.",
          potentialLossEstimate: "₹2,50,000 penalty + career hold",
        },
        {
          id: "e3",
          title: "Overbroad 24-Month Post-Exit Non-Compete",
          severity: "HIGH",
          category: "Lock-in & Exit",
          exactQuote:
            "for a period of 24 months after leaving the Company, you shall not join, consult for, or build any software product in the SaaS, AI, FinTech, or Enterprise sectors anywhere in India.",
          plainEnglishTrap:
            "Bars you from working in almost the entire Indian tech industry for 2 years after leaving.",
          legalContext:
            "Void under Section 27 of the Indian Contract Act, 1872 (Percept D'Mark v. Zaheer Khan): post-employment restraints on trade/profession are unenforceable in India.",
          counterClause:
            "Remove post-employment non-compete entirely; retain standard 12-month confidentiality and non-solicitation of direct clients.",
          potentialLossEstimate: "24-month employment restriction",
        },
        {
          id: "e4",
          title: "7-Day vs 90-Day Notice Asymmetry",
          severity: "HIGH",
          category: "Lock-in & Exit",
          exactQuote:
            "The Company may terminate your employment with 7 days' notice without assigning any reason. However, you must serve a mandatory 90-day notice period with no buyout option.",
          plainEnglishTrap:
            "They can drop you in 1 week, but you are trapped for 3 months if you get a better offer.",
          legalContext:
            "Standard industry practice is symmetric notice (30 days during probation, 60 days post-confirmation) with a pro-rata salary buyout option.",
          counterClause:
            "Notice period shall be mutual: 30 days during probation and 60 days post-confirmation, with a mutual option for pro-rata basic salary buyout.",
          potentialLossEstimate: "Job-switch friction (90 days)",
        },
      ],
      negotiation: {
        subject: "NovaStack Labs Offer — Quick Clarifications on IP & Bond Clauses",
        tone: "Polite & Collaborative",
        emailBody: `Dear HR / Hiring Team,

Thank you so much for extending the offer for Junior Software Engineer at NovaStack Labs—I'm really excited about the team and role!

While reviewing the agreement, I noticed a few boilerplate clauses that I'd love to align with standard industry practice before signing:
1. Personal IP: Limit IP assignment to work done using company resources or related to NovaStack's business, so my weekend open-source/hackathon projects remain independent.
2. Service Bond: Clarify that any bond is prorated over 12 months based on actual documented training costs, and does not apply in case of company-initiated layoffs.
3. Non-Compete & Notice: Remove the post-exit non-compete (keeping full NDA/non-solicit) and make the notice period symmetric (30/60 days with buyout).

Happy to jump on a quick 5-minute call to close this today!

Warm regards,
[Your Name]`,
        whatsappShort:
          "Hi! Super excited about the NovaStack offer. Before signing, can we align 3 standard clauses: (1) exclude personal weekend/hackathon projects from IP assignment, (2) remove post-exit non-compete (keep NDA), and (3) make notice period symmetric (30/60 days) & bond waived on company layoffs? Happy to sign as soon as updated!",
      },
      analysisMode: "demo-engine",
      pipelineMs: 910,
      analyzedAt: new Date().toISOString(),
    },
  },
  {
    id: "freelance-msa",
    label: "Freelance Dev MSA",
    badge: "4 Agency Traps",
    category: "Freelance & MSA",
    description: "Client MSA with Net-90 payment, IP transfer before payment, unlimited revisions & 100% indemnity.",
    text: `FREELANCE MASTER SERVICES AGREEMENT

This Agreement is between Apex Digital Pvt. Ltd. ("Client") and Independent Contractor ("Developer") for full-stack web application development (Total Fee: ₹1,50,000).

1. PAYMENT TERMS: Client shall pay invoices within 90 days ("Net-90") of Final Acceptance. Client may withhold or set off any payment if Client subjectively deems deliverables unsatisfactory.

2. SCOPE & REVISIONS: Developer agrees to provide unlimited revisions and bug fixes for 12 months post-launch at no additional cost until Client signs Final Acceptance.

3. INTELLECTUAL PROPERTY: All source code, prototypes, and pre-existing libraries used by Developer shall vest in Client immediately upon creation, irrespective of whether payment has been made.

4. INDEMNITY & LIABILITY: Developer shall indemnify Client for unlimited damages, lost profits, and third-party claims arising from any bug or delay, without any cap on liability.`,
    demoAnalysis: {
      contractTitle: "Apex Digital Freelance Master Services Agreement",
      category: "Freelance & MSA",
      safetyScore: 20,
      verdict: "DO NOT SIGN AS-IS",
      executiveSummary:
        "Classic freelance agency trap: you hand over 100% IP (including your own pre-existing libraries) before getting paid, wait 90+ days after 'subjective acceptance', owe unlimited free work, and carry uncapped liability.",
      riskVectors: {
        financialTrap: 91,
        ipRightsGrab: 95,
        lockInPenalty: 78,
        unilateralPower: 86,
      },
      findings: [
        {
          id: "f1",
          title: "IP Transfers Before You Are Paid (+ Your Own Libraries)",
          severity: "CRITICAL",
          category: "IP & Rights Grab",
          exactQuote:
            "All source code, prototypes, and pre-existing libraries used by Developer shall vest in Client immediately upon creation, irrespective of whether payment has been made.",
          plainEnglishTrap:
            "If the client ghosts you and never pays ₹1.5L, they still legally own all your code—AND they now own your personal reusable starter kits/libraries too.",
          legalContext:
            "Under standard IP law and Indian freelance norms, IP assignment must be strictly conditional upon receipt of full payment, and Background IP must remain licensed, not assigned.",
          counterClause:
            "Project-specific IP shall transfer to Client solely upon receipt of 100% of applicable milestone fees. Developer retains all ownership of pre-existing tools/libraries, granting Client a non-exclusive license for this project.",
          potentialLossEstimate: "₹1,50,000 unpaid work + personal codebase",
        },
        {
          id: "f2",
          title: "Net-90 + Subjective Acceptance Payment Hold",
          severity: "CRITICAL",
          category: "Financial Trap",
          exactQuote:
            "Client shall pay invoices within 90 days (\"Net-90\") of Final Acceptance. Client may withhold or set off any payment if Client subjectively deems deliverables unsatisfactory.",
          plainEnglishTrap:
            "You work for free for months, and the client can delay paying you indefinitely just by saying they aren't 'subjectively satisfied'.",
          legalContext:
            "MSME / Freelance best practice is 40% upfront, 30% mid-milestone, 30% on delivery with Net-15 payment and objective acceptance criteria (auto-accepted if no written defects in 7 days).",
          counterClause:
            "Payment schedule: 40% upfront, 30% on beta delivery, 30% within 15 days (Net-15) of final delivery. Deliverables are deemed accepted if no material spec defects are reported within 7 business days.",
          potentialLossEstimate: "3+ months cashflow freeze",
        },
        {
          id: "f3",
          title: "Unlimited Free Revisions & 12-Month Warranty",
          severity: "HIGH",
          category: "Lock-in & Exit",
          exactQuote:
            "Developer agrees to provide unlimited revisions and bug fixes for 12 months post-launch at no additional cost",
          plainEnglishTrap:
            "Turns a ₹1.5L fixed project into a full-time unpaid maintenance job for a whole year.",
          legalContext:
            "Standard freelance MSAs cap revisions to 2–3 rounds per milestone and limit free bug-fix warranty to 30 days post-launch.",
          counterClause:
            "Fee includes up to 2 rounds of revisions per milestone and a 30-day post-launch warranty for reproducible bugs against the agreed spec. Additional features or changes are billed at ₹2,000/hr.",
          potentialLossEstimate: "200+ hours of unpaid labor",
        },
        {
          id: "f4",
          title: "Uncapped Liability & Lost-Profits Indemnity",
          severity: "HIGH",
          category: "Financial Trap",
          exactQuote:
            "Developer shall indemnify Client for unlimited damages, lost profits, and third-party claims arising from any bug or delay, without any cap on liability.",
          plainEnglishTrap:
            "A minor bug on a ₹1.5L website could expose you to a ₹50L+ lawsuit for 'lost profits'.",
          legalContext:
            "Commercial MSAs cap total contractor liability at the total fees actually paid under the agreement and exclude consequential/lost-profit damages.",
          counterClause:
            "Developer's aggregate liability under this Agreement shall not exceed the total fees actually paid by Client in the preceding 6 months, excluding indirect or lost-profit damages.",
          potentialLossEstimate: "Uncapped personal bankruptcy risk",
        },
      ],
      negotiation: {
        subject: "Re: Apex Digital MSA — Standard Freelance Redlines",
        tone: "Firm & Protective",
        emailBody: `Hi [Client Name],

Thanks for sending over the MSA—looking forward to building this project with Apex Digital!

Before we kick off, I've marked 4 standard commercial adjustments so we both have clear milestones:
1. Payment & Milestones: 40% kickoff / 30% beta / 30% Net-15 on delivery, with a 7-day objective acceptance window.
2. IP Protection: Project IP transfers upon full payment, and my pre-existing code libraries remain licensed rather than assigned.
3. Scope & Warranty: 2 revision rounds per milestone + 30-day bug warranty (new features billed separately).
4. Liability Cap: Cap aggregate liability at total project fees paid (₹1,50,000).

Once updated, I'm ready to sign and start sprint 1 immediately!

Best,
[Your Name]`,
        whatsappShort:
          "Hi! Reviewed the Apex MSA—ready to start! Just need 4 standard freelance updates: (1) 40/30/30 milestones + Net-15, (2) IP transfers after full payment (excluding my starter libraries), (3) 2 revision rounds + 30-day bug warranty, (4) liability capped at project fee. Let me know once updated!",
      },
      analysisMode: "demo-engine",
      pipelineMs: 780,
      analyzedAt: new Date().toISOString(),
    },
  },
];

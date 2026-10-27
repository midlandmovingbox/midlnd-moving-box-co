import { POLICY, usd } from '../lib/policy';

export const FAQ_ITEMS = [
  {
    q: 'Why rent moving boxes?',
    a: "Reusable totes are sturdier than cardboard, stack cleanly, hold up to Texas wind and weather, and don't collapse when they get heavy. We deliver them, you pack and move on your schedule, and we pick them up. There's no tape, no flattening, no trips to buy boxes, and no pile of cardboard to get rid of afterward.",
  },
  {
    q: 'When am I charged?',
    a: `When you submit a request we securely save your card with Square. It is not charged. After we review and approve your request, we charge the rental total. Any later charges (like an approved extension or the fees in our Terms) are charged to the same card, within ${POLICY.chargeWindowDays} days of pickup, and we email you an itemized receipt.`,
  },
  {
    q: 'What if I need more time?',
    a: `Just ask before your pickup date. Extra time is ${usd(POLICY.extensionPerToteWeek)} per tote, per week plus sales tax, and we confirm with you before charging it.`,
  },
  {
    q: 'Do I need to be home for delivery or pickup?',
    a: "No, as long as we can reach the spot you tell us to leave or collect the totes. For pickup, have your totes emptied and ready on the pickup date. We count what we pick up.",
  },
  {
    q: 'What if something is damaged or lost?',
    a: `Missing or damaged/unusable totes are ${usd(POLICY.toteMissing)} each, missing or damaged dollies are ${usd(POLICY.dollyMissing)} each, and very dirty totes are ${usd(POLICY.toteDirty)} each, plus sales tax. We photograph equipment before loading it, count at pickup, and email you an itemized receipt for any charges.`,
  },
  {
    q: 'Can I cancel or reschedule?',
    a: `Yes. With ${POLICY.cancelFreeHours}+ hours' notice before delivery, cancelling or rescheduling is free. After that, cancelling is ${usd(POLICY.cancelFee)} and rescheduling is ${usd(POLICY.rescheduleFee)}, plus sales tax.`,
  },
  {
    q: 'How many totes do I need?',
    a: "Small Move (20 totes) fits a studio or one-bedroom. Home Move (40 totes) is the most popular for 2–3 bedrooms. Big Move (60 totes) is for 4+ bedrooms or a house that's been collecting for years. You can add extra totes on the reservation form.",
  },
  {
    q: 'What areas do you serve?',
    a: "We deliver free across Midland and Odessa, with a small fee for nearby and outlying ZIP codes. Check the service area section above, or enter your addresses on the reservation form and the fee shows up before you submit. If your ZIP isn't on our list, we'll email you a quote to approve first.",
  },
  {
    q: 'Is sales tax included?',
    a: 'No. Texas sales tax (8.25%) is added to your rental total and to any fee or charge, and you see the exact rental amount before you submit.',
  },
];

export default function Faq() {
  return (
    <section className="faq-section" id="faq">
      <div className="wrap">
        <div className="section-eyebrow">Questions</div>
        <h2 className="section-title">Good to know before you reserve.</h2>
        <div style={{ maxWidth: 780 }}>
          {FAQ_ITEMS.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

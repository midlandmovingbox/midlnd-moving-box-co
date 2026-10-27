import { POLICY, usd } from '../../lib/policy';

export const metadata = {
  title: 'Terms & Conditions — Midland Moving Box Co.',
  description: 'Rental terms, fees and policies for Midland Moving Box Co.',
};

import SiteLogo from '../../components/SiteLogo';

export default function Terms() {
  const p = POLICY;
  return (
    <main className="legal-page">
      <div style={{ background: 'var(--ink)', display: 'inline-block', padding: '10px 14px', borderRadius: 6 }}>
        <SiteLogo height={44} />
      </div>
      <div style={{ marginTop: 14 }}>
        <a href="/" style={{ fontSize: 14, textDecoration: 'underline' }}>← Back to home</a>
      </div>
      <h1 style={{ marginTop: 16 }}>Terms &amp; Conditions</h1>
      <div className="updated">Last updated: October 27, 2026</div>

      <p>
        These terms apply to every reservation and rental with Midland Moving Box Co. ("we," "us"), a sole
        proprietorship based in Midland, Texas. By submitting a reservation request and checking the
        authorization box, you ("you," "the customer") agree to them.
      </p>

      <h2>1. The rental</h2>
      <p>
        We rent reusable moving totes, dollies and related moving supplies ("equipment"). The equipment remains
        our property at all times. You are renting it for the dates in your reservation, for moving and
        storing household goods only.
      </p>

      <h2>2. Reservations, approval and payment</h2>
      <ul>
        <li>Submitting a request is not a confirmed reservation. We review every request and may approve or decline it.</li>
        <li>When you submit, your card is securely saved with Square. <strong>It is not charged at that time.</strong> We never see or store your full card number.</li>
        <li>When we approve your request, we charge the rental total, including sales tax and any delivery area fee, to your saved card and email you a confirmation.</li>
        <li>If we decline your request, your card is not charged.</li>
        <li>By checking the authorization box you authorize us to charge your saved card for the rental, and for the other charges described in these terms.</li>
        <li>Texas sales tax (8.25%) applies to rentals and to every fee and charge described in these terms. The fee amounts listed below are before tax.</li>
      </ul>

      <h2>3. Delivery area and fees</h2>
      <p>
        Delivery and pickup are free within our standard service area. Certain nearby and outlying ZIP codes
        carry a delivery fee of $20 or $30 each way (delivery and pickup are priced separately). If an address
        is in a ZIP code we have not listed, we will email you a fee to approve before anything is charged.
      </p>

      <h2>4. Delivery and counting</h2>
      <ul>
        <li>We deliver to the address you give us on your delivery date. You do not need to be home as long as we can access the drop-off spot.</li>
        <li>After delivery we email you the count of totes and dollies delivered. If the count is wrong, tell us within {p.countWindowHours} hours of delivery. After that, the count in the email is treated as correct.</li>
      </ul>

      <h2>5. Pickup</h2>
      <ul>
        <li>Have all equipment emptied, accessible and ready on your pickup date at the pickup address you gave us.</li>
        <li>We photograph equipment before loading it. <strong>The equipment we actually pick up is what we count.</strong> If the count is lower than what we delivered, the missing items are charged under section 8, automatically, at the time of pickup.</li>
        <li>We do not return to look for missing equipment. If you find missing items afterward and contact us, we may, at our sole discretion, review the charge, but we are not required to.</li>
      </ul>

      <h2>6. Extra time</h2>
      <p>
        You may ask us to extend your rental before your pickup date. Extra time is {usd(p.extensionPerToteWeek)} per
        tote, per week, plus sales tax. We confirm the extension and amount with you before charging it.
      </p>

      <h2>7. Equipment not ready at pickup</h2>
      <p>
        If your equipment is not emptied and ready when we arrive, you will be charged one additional full
        week at the extension rate ({usd(p.extensionPerToteWeek)} per tote, plus sales tax). If we have to make a return trip,
        you will also be charged a return-trip fee: {usd(p.tripFeeFree)} in our free delivery area,
        {' '}{usd(p.tripFeeExtended)} in our extended ($20/$30) area, or {usd(p.tripFeeOutside)} for addresses beyond that.
      </p>

      <h2>8. Missing, damaged and dirty equipment</h2>
      <ul>
        <li>Missing or damaged/unusable tote: {usd(p.toteMissing)} each.</li>
        <li>Missing or damaged dolly: {usd(p.dollyMissing)} each.</li>
        <li>Very dirty tote (beyond normal use, needing special cleaning): {usd(p.toteDirty)} each.</li>
        <li>Normal wear is expected and is not charged.</li>
      </ul>

      <h2>9. When and how we charge</h2>
      <ul>
        <li>Missing items found at pickup are charged automatically at pickup.</li>
        <li>Damage, cleaning and other fees are charged within {p.chargeWindowDays} days after pickup.</li>
        <li>Every charge after the original rental is emailed to you with an itemized explanation.</li>
        <li>If you believe a charge is a mistake, reply to that email within {p.chargeWindowDays} days and we will review it.</li>
      </ul>

      <h2>10. Cancellations and rescheduling</h2>
      <ul>
        <li>Cancel with {p.cancelFreeHours} or more hours' notice before your delivery: no fee, and we refund your payment in full to the card used.</li>
        <li>Cancel with less than {p.cancelFreeHours} hours' notice: {usd(p.cancelFee)} cancellation fee, and we refund the rest.</li>
        <li>Reschedule with {p.cancelFreeHours} or more hours' notice: no fee. With less notice: {usd(p.rescheduleFee)}, charged at the time of rescheduling.</li>
        <li>Tell us by replying to your confirmation email or by contacting us at midlandmovingbox@gmail.com.</li>
      </ul>

      <h2>11. How to use the equipment</h2>
      <ul>
        <li>Use the totes for household goods. Do not store hazardous materials, food waste, animals, or anything illegal in them.</li>
        <li>Do not overload totes or dollies beyond their rated capacity, and keep equipment out of standing water and away from open flame.</li>
        <li>Do not sublet, sell or lend the equipment to others.</li>
      </ul>

      <h2>12. Risk and liability</h2>
      <p>
        You use the equipment at your own risk. To the fullest extent allowed by Texas law, we are not
        responsible for damage to or loss of your belongings, injuries from the use or misuse of equipment, or
        indirect or consequential losses. Our total liability for any claim is limited to the amount you paid us
        for the rental. Nothing in these terms limits liability that cannot be limited by law.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        We may update these terms. The version in effect when you submit your reservation is the one that
        applies to that rental. We record the version you agreed to.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of the State of Texas. Any dispute will be handled in the courts
        located in Midland County, Texas.
      </p>

      <h2>15. Contact</h2>
      <p>
        Midland Moving Box Co., Midland, Texas<br />
        Email: <a href="mailto:midlandmovingbox@gmail.com" style={{ textDecoration: 'underline' }}>midlandmovingbox@gmail.com</a>
      </p>
    </main>
  );
}

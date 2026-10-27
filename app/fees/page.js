import { POLICY, usd } from '../../lib/policy';
import SiteLogo from '../../components/SiteLogo';

export const metadata = {
  title: 'Fees & Charges — Midland Moving Box Co.',
  description: 'Every fee and charge that can apply to a Midland Moving Box Co. rental.',
};

export default function Fees() {
  const p = POLICY;
  return (
    <main className="legal-page">
      <div style={{ background: 'var(--ink)', display: 'inline-block', padding: '10px 14px', borderRadius: 6 }}>
        <SiteLogo height={44} />
      </div>
      <div style={{ marginTop: 14 }}>
        <a href="/" style={{ fontSize: 14, textDecoration: 'underline' }}>← Back to home</a>
      </div>
      <h1 style={{ marginTop: 16 }}>Fees &amp; Charges</h1>
      <div className="updated">Last updated: October 27, 2026</div>

      <p>
        Most rentals never see a fee beyond the package price. This page lists everything that <em>can</em> be
        charged, so there are no surprises. The full rules are in our <a href="/terms" style={{ textDecoration: 'underline' }}>Terms &amp; Conditions</a>.
      </p>

      <h2>Texas sales tax</h2>
      <p>Texas sales tax (8.25%) is added to your rental and to every fee and charge on this page. Amounts below are before tax.</p>

      <h2>Extra time</h2>
      <table className="fee-table"><tbody>
        <tr><td>Rental extension, approved by you in advance (per tote, per week)</td><td>{usd(p.extensionPerToteWeek)}</td></tr>
        <tr><td>Equipment not ready at pickup (per tote, one full week)</td><td>{usd(p.extensionPerToteWeek)}</td></tr>
      </tbody></table>

      <h2>Return trip</h2>
      <p>If your equipment isn't ready when we arrive and we have to make a return trip:</p>
      <table className="fee-table"><tbody>
        <tr><td>Free delivery area</td><td>{usd(p.tripFeeFree)}</td></tr>
        <tr><td>Extended service area</td><td>{usd(p.tripFeeExtended)}</td></tr>
        <tr><td>Beyond our extended service area</td><td>{usd(p.tripFeeOutside)}</td></tr>
      </tbody></table>

      <h2>Missing, damaged and dirty equipment</h2>
      <table className="fee-table"><tbody>
        <tr><td>Missing or damaged/unusable tote (each)</td><td>{usd(p.toteMissing)}</td></tr>
        <tr><td>Missing or damaged dolly (each)</td><td>{usd(p.dollyMissing)}</td></tr>
        <tr><td>Very dirty tote, beyond normal use (each)</td><td>{usd(p.toteDirty)}</td></tr>
      </tbody></table>
      <p>Normal wear is expected and is never charged. We photograph equipment before loading it, and we count what we pick up. Missing items found at pickup are charged automatically.</p>

      <h2>Cancelling and rescheduling</h2>
      <table className="fee-table"><tbody>
        <tr><td>Cancel or reschedule with {p.cancelFreeHours}+ hours' notice before delivery</td><td>Free</td></tr>
        <tr><td>Cancel with less than {p.cancelFreeHours} hours' notice</td><td>{usd(p.cancelFee)}</td></tr>
        <tr><td>Reschedule with less than {p.cancelFreeHours} hours' notice (charged when you reschedule)</td><td>{usd(p.rescheduleFee)}</td></tr>
      </tbody></table>

      <h2>Delivery area fees</h2>
      <p>
        Delivery and pickup are free in select Midland and Odessa ZIP codes. Nearby and outlying ZIP codes carry a
        fee each way (delivery and pickup are priced separately), and anywhere else is quoted to you and approved
        before anything is charged. The booking form shows your exact fee as soon as you enter your addresses.
      </p>

      <h2>When we charge</h2>
      <ul>
        <li>Missing items found at pickup are charged automatically at pickup.</li>
        <li>Other fees are charged within {p.chargeWindowDays} days after pickup.</li>
        <li>Every charge is emailed to you with an itemized receipt. If you think one is a mistake, reply within {p.chargeWindowDays} days and we'll review it.</li>
        <li>Tell us within {p.countWindowHours} hours of delivery if the count is off.</li>
      </ul>
    </main>
  );
}

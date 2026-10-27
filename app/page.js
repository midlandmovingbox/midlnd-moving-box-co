import Faq from '../components/Faq';
import SiteLogo from '../components/SiteLogo';
import ToteStack from '../components/ToteStack';
// ONE-STEP PHONE SWAP: once you pick a number, fill in both lines below.
// Example: PHONE_DISPLAY = '(432) 555-1234'  and  PHONE_DIGITS = '4325551234'
// While PHONE_DISPLAY is empty, no phone number shows on the site.
const PHONE_DISPLAY = '';
const PHONE_DIGITS = '';

export default function Home() {
  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <SiteLogo height={50} />
          <nav className="nav">
            <a href="#packages">Packages</a>
            <a href="#how">How it works</a>
            <a href="#area">Service area</a>
          </nav>
          <a className="topbar-cta" href="/book">Reserve</a>
        </div>
      </div>

      <section className="hero">
        <div className="wrap" style={{ paddingBottom: 0 }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow-mono">Delivered · Midland &amp; Odessa, TX</div>
              <h1>Skip the cardboard.<span className="thin">Heavy-duty moving totes, delivered to your door.</span></h1>
              <p className="sub">Reusable moving totes delivered to your door. We deliver. You pack. You move. We pick up.</p>
              <div className="hero-actions">
                <a className="btn-primary" href="/book">Reserve in 2 Minutes →</a>
                <a className="btn-ghost" href="#packages">See packages</a>
              </div>
              <div className="hero-note" style={{ marginTop: 18 }}>Free delivery &amp; pickup in select Midland &amp; Odessa areas · Packages start at $109</div>
            </div>
            <div className="hero-visual">
              <ToteStack />
            <div className="ticket">
              <div className="ticket-head">
                <div className="to">Deliver To<br /><strong style={{ color: 'var(--ink)', fontFamily: "'Figtree'", fontSize: 14 }}>Your Address, Midland TX</strong></div>
                <div className="no">Ticket No.<br />MMB-0472</div>
              </div>
              <div className="ticket-body">
                <div className="ticket-row"><span className="k">Package</span><span className="v">Home Move</span></div>
                <div className="ticket-row"><span className="k">Contents</span><span className="v">40 totes · 2 dollies</span></div>
                <div className="ticket-row"><span className="k">Delivery</span><span className="v">Mon, 8:00–10:00a</span></div>
              </div>
              <div className="ticket-price">
                <div><div className="label">Total due</div><div className="amt">$179</div></div>
                <div className="label">Card on file<br />via Square</div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="wrap">
          <div className="section-eyebrow">The route</div>
          <h2 className="section-title">Three steps. Simple, easy, &amp; clean.</h2>
          <div className="how-row">
            <div className="how-step">
              <div className="idx">STEP 01 — WE DELIVER</div>
              <h3>Totes show up at your door</h3>
              <p>We bring your totes and dolly straight to your door on the morning you pick.</p>
            </div>
            <div className="how-step">
              <div className="idx">STEP 02 — YOU PACK &amp; MOVE</div>
              <h3>Pack, load, move</h3>
              <p>Two full weeks with your totes. They stack clean and won't blow out like a wet box.</p>
            </div>
            <div className="how-step">
              <div className="idx">STEP 03 — WE PICK UP</div>
              <h3>We haul the empties away</h3>
              <p>Leave the empty totes at the curb or inside the door. We swing by and load them up.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="packages" id="packages">
        <div className="wrap">
          <div className="section-eyebrow">Cargo manifest</div>
          <h2 className="section-title">Priced by move size, not by guesswork.</h2>
          <div className="pkg-grid">
            <div className="pkg-card">
              <div className="pkg-tab">1 Bedroom / Apartment</div>
              <div className="pkg-name">Small Move</div>
              <div className="pkg-price">$109<sup>/ 2 wks</sup></div>
              <div className="pkg-desc">Enough for a studio or one-bedroom, easy.</div>
              <ul className="pkg-list"><li>20 heavy-duty 27-gallon totes</li><li>1 tote dolly</li><li>Free delivery in select areas</li></ul>
              <a className="pkg-cta" href="/book?pkg=small">Reserve Small Move</a>
            </div>
            <div className="pkg-card featured">
              <div className="pkg-badge">Most popular</div>
              <div className="pkg-tab">2–3 Bedrooms</div>
              <div className="pkg-name">Home Move</div>
              <div className="pkg-price">$179<sup>/ 2 wks</sup></div>
              <div className="pkg-desc">The one most Midland households book.</div>
              <ul className="pkg-list"><li>40 heavy-duty 27-gallon totes</li><li>2 tote dollies</li><li>Free delivery in select areas</li></ul>
              <a className="pkg-cta" href="/book?pkg=home">Reserve Home Move</a>
            </div>
            <div className="pkg-card">
              <div className="pkg-tab">4+ Bedrooms</div>
              <div className="pkg-name">Big Move</div>
              <div className="pkg-price">$239<sup>/ 2 wks</sup></div>
              <div className="pkg-desc">For the house that's been collecting years of stuff.</div>
              <ul className="pkg-list"><li>60 heavy-duty 27-gallon totes</li><li>3 tote dollies</li><li>Free delivery in select areas</li></ul>
              <a className="pkg-cta" href="/book?pkg=big">Reserve Big Move</a>
            </div>
          </div>
        </div>
      </section>

      <section className="area-faq" id="area">
        <div className="wrap af-grid">
          <div>
            <div className="section-eyebrow">Service area</div>
            <h2 className="section-title">Where we deliver.</h2>
            <div className="area-box">
              <div className="zone-row"><span>Midland &amp; Odessa<br /><span className="mono" style={{ fontSize: 11, color: '#8a8676' }}>79701–79705, 79707, 79712</span></span><span className="fee">Free delivery</span></div>
              <div className="zone-row"><span>Nearby<br /><span className="mono" style={{ fontSize: 11, color: '#8a8676' }}>79706, 79758, 79765, 79782</span></span><span className="fee">+$20 each way</span></div>
              <div className="zone-row"><span>Outlying<br /><span className="mono" style={{ fontSize: 11, color: '#8a8676' }}>79749, 79761–79764, 79766, 79783</span></span><span className="fee">+$30 each way</span></div>
              <div className="zone-row"><span>Anywhere else</span><span className="fee">We'll quote you</span></div>
            </div>
          </div>
          <div>
            <div className="section-eyebrow">How payment works</div>
            <h2 className="section-title">You won't be charged to submit a request.</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.6, color: '#4c4a42' }}>
              When you reserve, we securely save your card with Square — you're not charged yet.
              We review your request, and once we confirm we can fulfill it, we charge the card on
              file for the rental. That same card stays on file for the length of your rental, so
              extending a week or handling a damage charge doesn't mean chasing down payment later.
            </p>
          </div>
        </div>
      </section>

      <Faq />

      <section className="final-cta">
        <div className="wrap">
          <h2>Your move already has enough moving parts.</h2>
          <p>RESERVE YOUR TOTES · TAKES ABOUT 2 MINUTES</p>
          <a className="btn-primary" href="/book">Reserve Now →</a>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="foot-logo"><SiteLogo height={92} /></div>
              <div style={{ marginTop: 4, color: '#c9c5b8', fontSize: 15 }}>Reusable moving totes, delivered and picked up.<br />Serving Midland &amp; Odessa, TX.</div>
            </div>
            <div>
              <div className="mono" style={{ color: 'var(--tote)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.06em', marginBottom: 8 }}>Contact</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: '#c9c5b8' }}>
                {PHONE_DISPLAY && <a href={`tel:${PHONE_DIGITS}`}>{PHONE_DISPLAY}</a>}
                <a href="mailto:midlandmovingbox@gmail.com">midlandmovingbox@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="foot-legal">
            <span>© 2026 Midland Moving Box Co. All rights reserved.</span>
            <span>Texas sales tax (8.25%) applies to all rentals.</span>
            <span>Payments processed by Square.</span>
            <span>
              <a href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a>
              {' · '}
              <a href="/terms" style={{ textDecoration: 'underline' }}>Terms &amp; Conditions</a>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}

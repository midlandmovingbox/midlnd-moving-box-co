import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { PACKAGES, computeTotals } from '../../../lib/constants';
import { createCustomer, createCardOnFile } from '../../../lib/square';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      sourceId, // card nonce from Square Web Payments SDK
      pkg,
      addons,
      deliveryDate,
      pickupDate,
      deliveryWindow,
      location,
      name,
      phone,
      email,
      address,
      notes,
      agreedToTerms,
    } = body;

    if (!sourceId || !pkg || !PACKAGES[pkg] || !deliveryDate || !pickupDate) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }
    if (!name || !phone || !address) {
      return NextResponse.json({ error: 'Name, phone, and address are required' }, { status: 400 });
    }
    if (!agreedToTerms) {
      return NextResponse.json({ error: 'You must authorize storing your card to submit a request' }, { status: 400 });
    }

    const { subtotal, tax, total, cleanAddons, totes } = computeTotals(pkg, addons);

    // 1. Create a Square customer
    const customer = await createCustomer({ name, email, phone });

    // 2. Vault the card against that customer WITHOUT charging it
    const card = await createCardOnFile({
      nonce: sourceId,
      customerId: customer.id,
      idempotencyKey: randomUUID(),
    });

    // 3. Save the reservation as "requested" - nothing has been charged yet
    const { data: reservation, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        package: pkg,
        totes,
        addons: cleanAddons,
        delivery_date: deliveryDate,
        pickup_date: pickupDate,
        delivery_window: deliveryWindow || null,
        location: location || null,
        name,
        phone,
        email: email || null,
        address,
        notes: notes || null,
        subtotal,
        tax,
        total,
        square_customer_id: customer.id,
        square_card_id: card.id,
        square_card_brand: card.card_brand || null,
        square_card_last4: card.last_4 || null,
        status: 'requested',
      })
      .select()
      .single();

    if (error) {
      console.error('reservation insert failed after card was vaulted:', error);
      return NextResponse.json(
        { error: 'Your card was saved but we could not save the reservation. We will follow up by phone.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reservationId: reservation.id });
  } catch (err) {
    console.error('create reservation error:', err);
    return NextResponse.json({ error: err.message || 'Could not submit reservation' }, { status: 500 });
  }
}

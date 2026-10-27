// Server-side only. Talks to Square's REST API directly with fetch - no SDK
// dependency needed for these three calls.
//
// Docs:
//   Create customer: https://developer.squareup.com/reference/square/customers-api/create-customer
//   Store a card:     https://developer.squareup.com/reference/square/cards-api/create-card
//   Charge a card:    https://developer.squareup.com/reference/square/payments-api/create-payment

const SQUARE_BASE_URL =
  process.env.SQUARE_ENV === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

function squareHeaders() {
  return {
    'Content-Type': 'application/json',
    'Square-Version': '2024-08-21',
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
  };
}

async function squareFetch(path, body) {
  const res = await fetch(`${SQUARE_BASE_URL}${path}`, {
    method: 'POST',
    headers: squareHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.errors?.[0]?.detail || 'Square API request failed';
    const err = new Error(message);
    err.squareErrors = data.errors;
    throw err;
  }
  return data;
}

export async function createCustomer({ name, email, phone }) {
  const [givenName, ...rest] = (name || '').split(' ');
  const data = await squareFetch('/v2/customers', {
    given_name: givenName || name,
    family_name: rest.join(' ') || undefined,
    email_address: email || undefined,
    phone_number: phone || undefined,
  });
  return data.customer;
}

// Vaults a card WITHOUT charging it. `nonce` is the token from the Web
// Payments SDK's card.tokenize() call on the client.
export async function createCardOnFile({ nonce, customerId, idempotencyKey }) {
  const data = await squareFetch('/v2/cards', {
    idempotency_key: idempotencyKey,
    source_id: nonce,
    card: { customer_id: customerId },
  });
  return data.card; // { id, card_brand, last_4, exp_month, exp_year, ... }
}

// Charges a card that's already on file, referenced by its card ID (NOT a
// fresh nonce). This is what "Approve & Charge" and "Add charge" both call.
export async function chargeStoredCard({ cardId, customerId, amountCents, idempotencyKey, note }) {
  const data = await squareFetch('/v2/payments', {
    source_id: cardId,
    customer_id: customerId,
    idempotency_key: idempotencyKey,
    location_id: process.env.SQUARE_LOCATION_ID,
    amount_money: { amount: amountCents, currency: 'USD' },
    note,
  });
  return data.payment;
}

// Refunds all or part of a payment. amountCents must not exceed what's left on that payment.
export async function refundPayment({ paymentId, amountCents, idempotencyKey, reason }) {
  const data = await squareFetch('/v2/refunds', {
    idempotency_key: idempotencyKey,
    payment_id: paymentId,
    amount_money: { amount: amountCents, currency: 'USD' },
    reason: reason || 'Refund',
  });
  return data.refund;
}

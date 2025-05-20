// app/test-runserverupdate/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CheckoutProvider, useCheckout } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_live_51PQlcqRsYE4iOwmAYRRGhtl24Vnvc9mkZ37LB5PlJl8XcHVbTf0B0T3h7Ey7y28URqdIITb48aM9jjZ7wjuCPKKb00utiqhUVv', {
  betas: ['custom_checkout_server_updates_1'],
});

// Wrap your test secret in a function:
const fetchClientSecret = async () => {
  // In real life you’d `return fetch('/my-endpoint').then(res => res.json()).then(j => j.clientSecret)`
  return 'cs_live_a1pkMim4f1AdWC31QKVXi62BkOz7qDf75FVD63lH22nsFEddGlYBaooncO_secret_fidwbEhqYWAnPydmcHZxamgneCUl';
};

function Checker() {
  const checkout = useCheckout();
  const [hasFn, setHasFn] = useState<boolean|null>(null);

  useEffect(() => {
    if (!checkout) return setHasFn(false);
    setHasFn(typeof checkout.runServerUpdate === 'function');
  }, [checkout]);

  if (hasFn === null)    return <p>Checking for runServerUpdate…</p>;
  if (!checkout)         return <p style={{ color: 'red' }}>❌ No Checkout context found.</p>;
  if (hasFn)             return <p style={{ color: 'green' }}>✅ runServerUpdate is available!</p>;

  return <p style={{ color: 'red' }}>❌ runServerUpdate is <strong>not</strong> available.</p>;
}

export default function TestRunServerUpdatePage() {
  return (
    <CheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        <h1>Stripe runServerUpdate Checker</h1>
        <Checker />
      </div>
    </CheckoutProvider>
  );
}

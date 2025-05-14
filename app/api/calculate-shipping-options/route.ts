// app/api/calculate-shipping-options/route.js

import { NextResponse } from 'next/server'
import stripe from '@/app/lib/stripe'
import { XMLParser } from 'fast-xml-parser'

const CANADA_POST_RATE_URL = 'https://soa-gw.canadapost.ca/rs/ship/price'

/**
 * Calculate shipping options by calling Canada Post’s Rates API.
 * @param {object} shippingDetails
 * @param {Stripe.Checkout.Session} session
 * @returns {Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]|null>}
 */
async function calculateShippingOptions(shippingDetails, session) {
  // 1) fetch line items so we can sum weights
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
  let totalWeightKg = 0
  for (const item of lineItems.data) {
    // assume each product has metadata.weight_kg
    totalWeightKg += 1.5 * item.quantity
  }

  let postalCode = shippingDetails.address.postal_code
  postalCode = postalCode.replace(/\s+/g, '').toUpperCase()

  // 2) build Canada Post XML payload
  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<mailing-scenario xmlns="http://www.canadapost.ca/ws/ship/rate-v4">
  <quote-type>counter</quote-type>
  <parcel-characteristics>
    <weight>${totalWeightKg.toFixed(2)}</weight>
  </parcel-characteristics>
  <origin-postal-code>${"L6A4Z9"}</origin-postal-code>
  <destination>
    <domestic>
      <postal-code>${postalCode}</postal-code>
    </domestic>
  </destination>
</mailing-scenario>`


  // 3) call Canada Post Rates API
  const auth = Buffer.from(
    `${"838a045b43195e77"}:${"124e3bb634d212925fb5a5"}`
  ).toString('base64')

  const resp = await fetch(CANADA_POST_RATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.cpc.ship.rate-v4+xml',
      Accept: 'application/vnd.cpc.ship.rate-v4+xml',
      Authorization: `Basic ${auth}`,
    },
    body: xmlBody,
  })

  if (!resp.ok) {
    console.error('Canada Post error:', resp.status, await resp.text())
    return null
  }

  const xml = await resp.text()
  // 4) parse XML → JSON
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
  const json = parser.parse(xml)

  // 5) normalize to array
  let quotes = json['price-quotes']?.['price-quote'] || []
  if (!Array.isArray(quotes)) quotes = [quotes]

  // 6) map each quote into Stripe shipping_options
  return quotes.map((q, i) => {
    const due = parseFloat(q['price-details']?.due || 0)
    return {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: Math.round(due * 100), currency: 'CAD' },
        display_name: q['service-name'] || `Canada Post Option ${i + 1}`,
        // you can add delivery_estimate if CP returns transit times
      },
    }
  })
}

export async function POST(request) {
  const { checkout_session_id, shipping_details } = await request.json()

  // retrieve session
  const session = await stripe.checkout.sessions.retrieve(checkout_session_id)

  // calculate options
  const options = await calculateShippingOptions(shipping_details, session)
  console.log(options)
  if (options?.length) {
    await stripe.checkout.sessions.update(checkout_session_id, {
      collected_information: { shipping_details },
      shipping_options: options,
    })

    return NextResponse.json({ type: 'object', value: { succeeded: true } })
  }

  return NextResponse.json({
    type: 'error',
    message: "We can't find shipping options. Please try again.",
  })
}

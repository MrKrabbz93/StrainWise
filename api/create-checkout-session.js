import Stripe from 'stripe';
import { supabase } from '../src/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { priceId, successUrl, cancelUrl, userId, email } = req.body;

        if (!priceId || !userId) {
            return res.status(400).json({ error: 'Missing priceId or userId' });
        }

        // 1. Get or Create Stripe Customer
        let customerId;

        // Check if user already has a customer ID in our DB
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', userId)
            .single();

        if (profile?.stripe_customer_id) {
            customerId = profile.stripe_customer_id;
        } else {
            // Create new customer in Stripe
            const customer = await stripe.customers.create({
                email: email,
                metadata: {
                    supabaseUUID: userId
                }
            });
            customerId = customer.id;

            // Save to DB
            await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);
        }

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl || `${req.headers.origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${req.headers.origin}/profile`,
            metadata: {
                userId: userId
            }
        });

        res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Stripe Checkout Error:', err);
        res.status(500).json({ error: err.message });
    }
}

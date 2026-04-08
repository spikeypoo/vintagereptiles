import Stripe from "stripe";
import { stripeSecretKey } from "@/app/lib/stripe-server";

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia; checkout_server_update_beta=v1;" as any,
},);

export default stripe

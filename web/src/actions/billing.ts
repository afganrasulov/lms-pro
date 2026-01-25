'use server';

import { polar } from '@/lib/polar';
import { createClient } from '@/lib/supabase/server';

export interface Subscription {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete';
    current_period_end: string | null;
    product: {
        name: string;
        description: string | null;
    };
    price: {
        amount: number;
        currency: string;
        interval: string;
    };
}

export interface Invoice {
    id: string;
    created_at: string;
    amount: number;
    currency: string;
    status: string;
    pdf_url: string | null;
}

async function getPolarCustomer(userId: string, email: string) {
    // 1. Try to find customer by metadata (if we stored userId)
    // For now, simpler to find by email as that's how Polar links usually work if valid
    const list = await polar.customers.list({
        email: email,
        limit: 1,
    });

    if (list.result.items.length > 0) {
        return list.result.items[0];
    }

    // Optional: Create customer if not found? 
    // Usually better to let them subscribe first, but for portal access we might need one.
    // For now, return null if no customer record found.
    return null;
}

export async function getUserSubscription(): Promise<Subscription | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return null;

    try {
        const customer = await getPolarCustomer(user.id, user.email);

        if (!customer) {
            console.log("No Polar customer found for email:", user.email);
            return null;
        }

        const subs = await polar.subscriptions.list({
            customerId: customer.id,
            active: true,
            limit: 1,
        });

        const sub = subs.result.items[0];
        if (!sub) return null;

        return {
            id: sub.id,
            status: sub.status as any,
            current_period_end: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
            product: {
                name: sub.product.name,
                description: sub.product.description || '',
            },
            price: {
                amount: sub.amount || 0,
                currency: sub.currency || 'usd',
                interval: sub.recurringInterval || 'month',
            }
        };

    } catch (error) {
        console.error("Error fetching subscription:", error);
        return null;
    }
}

export async function getUserInvoices(): Promise<Invoice[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return [];

    try {
        const customer = await getPolarCustomer(user.id, user.email);
        if (!customer) return [];

        const orders = await polar.orders.list({
            customerId: customer.id,
            limit: 10,
            sorting: ['-created_at'],
        });

        return orders.result.items.map((order: any) => ({
            id: order.id,
            created_at: order.createdAt.toISOString(),
            amount: order.amount,
            currency: order.currency,
            status: 'paid', // Orders in list are generally successful
            pdf_url: null, // Polar API might not expose direct PDF URL in list yet
        }));

    } catch (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }
}

export async function getCustomerPortalUrl(): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) return "https://polar.sh"; // Fallback

    try {
        const customer = await getPolarCustomer(user.id, user.email);

        if (customer) {
            const session = await polar.customerSessions.create({
                customerId: customer.id,
            });
            return session.customerPortalUrl; // This is the magic link
        }
    } catch (error) {
        console.error("Error creating portal session:", error);
    }

    return "https://polar.sh";
}

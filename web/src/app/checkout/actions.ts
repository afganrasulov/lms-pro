'use server'


import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentService } from '@/services/payment-service'

export async function createCheckout(courseId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?next=/checkout')
    }

    try {
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`

        const result = await PaymentService.createCheckoutSession(
            user.id,
            user.email!,
            courseId,
            returnUrl
        )

        if (result) {
            redirect(result.url)
        }
    } catch (error: any) {
        console.error('Checkout creation failed:', error)
        // Check for common validation errors
        if (error?.message?.includes('valid email')) {
            throw new Error('Invalid email address for payment provider')
        }
        throw new Error('Failed to create checkout session')
    }
}

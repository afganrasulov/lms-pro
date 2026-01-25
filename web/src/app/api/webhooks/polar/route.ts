import { NextRequest, NextResponse } from 'next/server'
import { polar } from '@/lib/polar'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
    const requestBody = await request.text()
    const webhookHeaders = request.headers
    const signature = webhookHeaders.get('polar-webhook-signature')
    const secret = process.env.POLAR_WEBHOOK_SECRET

    // If no secret is set, we can't verify. For dev, you might want to bypass,
    // but strictly we should fail. 
    // We'll log a warning if missing and fail validation.
    if (!secret || !signature) {
        console.error('Polar Webhook: Missing secret or signature')
        return NextResponse.json({ error: 'Missing secret or signature' }, { status: 400 })
    }

    let event: any;

    try {
        const result = await polar.validateWebhook({
            request: {
                body: requestBody,
                headers: webhookHeaders,
                url: request.url,
                method: request.method,
            }
        })

        // SDK returns the payload directly and throws on error
        event = result as any
    } catch (err) {
        console.error('Polar Webhook: Verification failed', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    console.log('Polar Webhook received:', event.type)

    if (event.type === 'order.created') {
        const order = event.data
        // Metadata is often in order.metadata or order.product.metadata depending on where it was set.
        // In our checkout action, we set it on checkout creation.
        // It should propagate to the order.
        // If not, we might need to rely on customerEmail -> user lookup.

        // Type definition for order might be loose here, casting to any for safety or checking relevant fields.
        const metadata = (order as any).metadata || {}
        const { userId, courseId } = metadata

        if (userId && courseId) {
            try {
                // Enrol the user
                const { error } = await supabaseAdmin
                    .from('enrollments')
                    .upsert({
                        user_id: userId,
                        course_id: courseId,
                        polar_order_id: (order as any).id,
                        status: 'active',
                        source: 'polar',
                        enrolled_at: new Date().toISOString()
                    })

                if (error) {
                    console.error('Polar Webhook: Failed to enroll user', error)
                    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 })
                }
                console.log(`Polar Webhook: Enrolled user ${userId} in course ${courseId}`)

                // Send Welcome/Confirmation Email
                // We'd ideally fetch user email and course title here.
                // Assuming we can get user email from metadata or subsequent query.
                // For MVP, if we don't have email in metadata, we query auth.users? 
                // We can't query auth.users easily without admin wrapper for listUsers (requires extra permissions/deps).
                // But we have `polar_order_id`, and `order` object.
                // The order object from Polar usually contains `customer_email`.
                const customerEmail = (order as any).customer_email || (order as any).customer?.email
                if (customerEmail) {
                    await import('@/services/acumbamail-service').then(({ acumbamailService }) => {
                        acumbamailService.sendEmail({
                            to: customerEmail,
                            subject: 'Welcome to your new course!',
                            html: `
                                <h1>Thanks for your purchase!</h1>
                                <p>You have been successfully enrolled.</p>
                                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard</a></p>
                            `
                        }).catch(err => console.error('Failed to send welcome email', err))
                    })
                }
            } catch (dbError) {
                console.error('Polar Webhook: Database error', dbError)
                return NextResponse.json({ error: 'Database error' }, { status: 500 })
            }
        } else {
            console.warn('Polar Webhook: Missing metadata in order', order)
            // Attempt fallback? Not for now.
        }
    }

    return NextResponse.json({ received: true })
}

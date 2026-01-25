
import { Polar } from '@polar-sh/sdk'
import dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: '.env.local' })

const token = process.env.POLAR_SANDBOX_TOKEN
if (!token) {
    console.error('No POLAR_SANDBOX_TOKEN found')
    process.exit(1)
}

const polar = new Polar({
    accessToken: token,
    server: 'sandbox',
})

async function main() {
    const productId = 'b9d946dd-2135-4ee0-b2f1-1af02da53785'
    const returnUrl = 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}'
    const userEmail = 'afganrasulov@gmail.com' // The email user reported failing
    const userId = 'e80749a2-9343-4c9f-a0a2-234234234234' // Mock ID
    const courseId = 'b3a21cd4-e49e-45b0-8607-19bd9b126335' // Mock ID

    console.log('Testing Checkout with:')
    console.log('- Product:', productId)
    console.log('- Email:', userEmail)
    console.log('- Return URL:', returnUrl)

    try {
        const result = await polar.checkouts.create({
            products: [productId],
            successUrl: returnUrl,
            customerEmail: userEmail,
            metadata: {
                userId: userId,
                courseId: courseId,
            },
        })
        console.log('✅ Checkout created successfully!', result.url)
    } catch (error: any) {
        console.error('❌ Failed to create checkout')
        if (error.body) {
            console.error('Full Error Body:', JSON.stringify(error.body, null, 2))
        } else {
            console.error('Error:', error)
        }
    }
}

main()

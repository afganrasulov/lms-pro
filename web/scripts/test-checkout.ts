import { Polar } from '@polar-sh/sdk'

const token = process.env.POLAR_SANDBOX_TOKEN
// The ID we just created
const PRODUCT_ID = 'b9d946dd-2135-4ee0-b2f1-1af02da53785'

if (!token) {
    console.error('No POLAR_SANDBOX_TOKEN provided')
    process.exit(1)
}

const polar = new Polar({
    accessToken: token,
    server: 'sandbox',
})

async function main() {
    try {
        console.log('Creating checkout...')

        // Correct SDK usage requires 'products' array
        const result = await polar.checkouts.create({
            products: [PRODUCT_ID],
            successUrl: 'http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}',
            customerEmail: 'test@gmail.com',
            metadata: {
                userId: 'user_123',
                courseId: 'course_ABC'
            }
        })

        console.log('Checkout created successfully!')
        console.log('URL:', result.url)

    } catch (error) {
        console.error('Error creating checkout:', JSON.stringify(error, null, 2))
        if (error instanceof Error) {
            console.error('Msg:', error.message)
        }
    }
}

main()

import { Polar } from '@polar-sh/sdk'

const token = process.env.POLAR_SANDBOX_TOKEN
const ORG_ID = '3be40a8a-232e-4041-ba8d-d683f459bc9a'

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
        console.log('Creating product...')
        // Create a product
        const product = await polar.products.create({
            name: 'LMS Pro Course Bundle (Sandbox)',
            description: 'Full access to all courses.',
            prices: [
                {
                    amountType: 'fixed',
                    priceAmount: 4900, // $49.00
                    priceCurrency: 'usd',
                }
            ]
        })

        console.log('Product created successfully!')
        console.log('Product ID:', product.id)
        console.log('Product Name:', product.name)
        console.log('Price ID:', product.prices[0].id)

    } catch (error) {
        console.error('Error creating product:', error)
    }
}

main()

import { Polar } from '@polar-sh/sdk'

const token = process.env.POLAR_SANDBOX_TOKEN

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
        console.log('Listing products...')
        const products = await polar.products.list({})
        console.log('Products found:', products.result.items.length)
        products.result.items.forEach((p: any) => {
            console.log(`- ${p.name} (ID: ${p.id})`)
        })

        if (products.result.items.length === 0) {
            console.log('No products found. Listing organizations to verify token scope...')
            const orgs = await polar.organizations.list({})
            orgs.result.items.forEach((o: any) => {
                console.log(`- Org: ${o.name} (ID: ${o.id})`)
            })
        }

    } catch (error) {
        console.error('Error:', error)
    }
}

main()

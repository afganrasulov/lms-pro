import { polar, createPolarClient } from '@/lib/polar'

export const PaymentService = {
    async createCheckoutSession(userId: string, userEmail: string, courseId: string, returnUrl: string, options?: { accessToken?: string, productId?: string }) {
        try {
            // Use dynamic client if accessToken is provided (BYOK), otherwise use platform client
            const client = options?.accessToken ? createPolarClient(options.accessToken) : polar

            // Use provided product ID or fallback (though fallback might fail on different accounts if product doesn't exist)
            const productId = options?.productId || 'b9d946dd-2135-4ee0-b2f1-1af02da53785'

            const result = await client.checkouts.create({
                products: [productId],
                successUrl: returnUrl,

                customerEmail: userEmail,
                metadata: {
                    userId: userId,
                    courseId: courseId,
                },
            })

            return result
        } catch (error: any) {
            console.error('PaymentService: Checkout creation failed:', error)
            if (error.body) {
                console.error('Polar Error Detail:', error.body)
            }
            throw error
        }
    }
}

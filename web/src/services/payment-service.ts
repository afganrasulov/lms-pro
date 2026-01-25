import { polar } from '@/lib/polar'

export const PaymentService = {
    async createCheckoutSession(userId: string, userEmail: string, courseId: string, returnUrl: string) {
        try {
            // For Sandbox, we are using a fixed product/offering for now.
            // In a real app, we would look up the Polar Product ID for the specific courseId.
            const productId = 'b9d946dd-2135-4ee0-b2f1-1af02da53785'

            const result = await polar.checkouts.create({
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

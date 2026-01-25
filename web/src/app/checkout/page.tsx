import { createCheckout } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckoutPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Complete Your Purchase</CardTitle>
                    <CardDescription>
                        You are about to purchase the Full Access Course Bundle.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between py-2">
                        <span>Product</span>
                        <span className="font-semibold">LMS Pro Course</span>
                    </div>
                    <div className="flex justify-between py-2 text-lg font-bold">
                        <span>Total</span>
                        <span>$49.00</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <form action={async () => {
                        'use server'
                        await createCheckout('course_123')
                    }} className="w-full">
                        <Button className="w-full" type="submit">
                            Proceed to Payment (Sandbox)
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}

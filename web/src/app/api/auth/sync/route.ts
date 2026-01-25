import { NextRequest, NextResponse } from 'next/server'
import { acumbamailService } from '@/services/acumbamail-service'

// You should define this in your env or constant file
// For now I'll use a placeholder or check env
const GENERAL_LIST_ID = process.env.ACUMBAMAIL_GENERAL_LIST_ID || ''

export async function POST(request: NextRequest) {
    if (!GENERAL_LIST_ID) {
        return NextResponse.json({ error: 'General List ID not configured' }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { email, firstName, lastName } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        // Add to Acumbamail
        const result = await acumbamailService.addSubscriber(GENERAL_LIST_ID, {
            email,
            name: firstName || '',
            last_name: lastName || ''
        })

        if (result.error) {
            return NextResponse.json({ error: result.error, details: result.details }, { status: 500 })
        }

        return NextResponse.json({ success: true, data: result.data })
    } catch (error) {
        console.error('Acumbamail Sync Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

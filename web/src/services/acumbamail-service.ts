import 'server-only'
import { supabaseAdmin } from '@/lib/supabase-admin'
import nodemailer from 'nodemailer'

const ACUMBAMAIL_API_URL = process.env.NEXT_PUBLIC_ACUMBAMAIL_API_URL || 'https://acumbamail.com/api/1'
const AUTH_TOKEN = process.env.ACUMBAMAIL_AUTH_TOKEN

// SMTP Configuration for Transactional Emails
const SMTP_HOST = 'smtp.acumbamail.com'
const SMTP_PORT = 587
const SMTP_USER = process.env.ACUMBAMAIL_SMTP_USER // Email used to login to Acumbamail
const SMTP_PASS = process.env.ACUMBAMAIL_SMTP_PASS || AUTH_TOKEN // API Token or Password

interface AcumbamailSubscriber {
    email: string
    name?: string
    last_name?: string
    [key: string]: any
}

interface EmailOptions {
    to: string
    subject: string
    html: string
    from?: string
}

export const acumbamailService = {
    /**
     * Add a subscriber to a specific list in Acumbamail
     */
    async addSubscriber(listId: string, subscriber: AcumbamailSubscriber) {
        if (!AUTH_TOKEN) {
            console.warn('Acumbamail Auth Token not configured')
            return { error: 'Configuration missing' }
        }

        try {
            const params = new URLSearchParams()
            params.append('auth_token', AUTH_TOKEN)
            params.append('list_id', listId)
            params.append('merge_fields[email]', subscriber.email)

            if (subscriber.name) params.append('merge_fields[name]', subscriber.name)
            if (subscriber.last_name) params.append('merge_fields[surname]', subscriber.last_name)

            // Add any other custom fields
            Object.keys(subscriber).forEach(key => {
                if (!['email', 'name', 'last_name'].includes(key)) {
                    params.append(`merge_fields[${key}]`, subscriber[key])
                }
            })

            const response = await fetch(`${ACUMBAMAIL_API_URL}/addSubscriber/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Acumbamail API Error:', errorText)
                return { error: `API Error: ${response.status}`, details: errorText }
            }

            const data = await response.json()
            return { success: true, data }
        } catch (error) {
            console.error('Acumbamail Service Error:', error)
            return { error: 'Internal Service Error' }
        }
    },

    /**
     * Remove a subscriber from a list
     */
    async removeSubscriber(listId: string, email: string) {
        if (!AUTH_TOKEN) return

        try {
            const params = new URLSearchParams()
            params.append('auth_token', AUTH_TOKEN)
            params.append('list_id', listId)
            params.append('email', email)

            const response = await fetch(`${ACUMBAMAIL_API_URL}/deleteSubscriber/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            })

            return await response.json()
        } catch (error) {
            console.error('Error removing subscriber:', error)
            return { error }
        }
    },

    /**
     * Send a transactional email via Acumbamail SMTP
     */
    async sendEmail({ to, subject, html, from }: EmailOptions) {
        if (!SMTP_USER || !SMTP_PASS) {
            console.warn('Acumbamail SMTP Configuration missing (SMTP_USER or SMTP_PASS)')
            return { error: 'SMTP Configuration missing' }
        }

        try {
            const transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT,
                secure: true, // true for 465
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            })

            const info = await transporter.sendMail({
                from: from || `"${process.env.NEXT_PUBLIC_APP_NAME || 'LMS Pro'}" <${SMTP_USER}>`, // default to SMTP user
                to,
                subject,
                html,
            })

            console.log('Email sent:', info.messageId)
            return { success: true, messageId: info.messageId }
        } catch (error) {
            console.error('Error sending email:', error)
            return { error }
        }
    }
}

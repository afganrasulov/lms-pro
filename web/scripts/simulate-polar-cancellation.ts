
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SECRET = process.env.POLAR_WEBHOOK_SECRET;

if (!SECRET) {
    console.error('Error: POLAR_WEBHOOK_SECRET is not set in .env.local');
    process.exit(1);
}

const payload = {
    type: "subscription.canceled",
    data: {
        id: "sub_12345",
        status: "canceled",
        user: {
            email: "serkhanrasullu@gmail.com" // Active user found in DB
        },
        customer: {
            email: "serkhanrasullu@gmail.com"
        }
    }
};

const body = JSON.stringify(payload);
const timestamp = Math.floor(Date.now() / 1000).toString();
const msgId = "msg_" + Math.random().toString(36).substring(7);

// Polar/Standard Webhooks uses Base64 signature of "msgId.timestamp.payload"
// Secret must be treated as Base64 bytes (after stripping prefix)

function generateSignature(payload: string, secret: string) {
    const secretKey = secret.startsWith('polar_whs_') ? secret.slice('polar_whs_'.length) : secret;
    const secretBytes = Buffer.from(secretKey, 'base64');

    // Standard Webhooks signature input
    const toSign = `${msgId}.${timestamp}.${payload}`;

    const hmac = crypto.createHmac('sha256', secretBytes);
    hmac.update(toSign);
    return `v1,${hmac.digest('base64')}`;
}

const signature = generateSignature(body, SECRET);

async function sendWebhook() {
    console.log('Sending webhook with payload:', JSON.stringify(payload, null, 2));
    console.log('Signature:', signature);

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/polar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'polar-webhook-signature': signature,
                'polar-webhook-id': msgId,
                'polar-webhook-timestamp': timestamp,
                // Add standard headers too just in case
                'webhook-id': msgId,
                'webhook-timestamp': timestamp,
                'webhook-signature': signature
            },
            body: body
        });

        const text = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', text);
    } catch (error) {
        console.error('Failed to send webhook:', error);
    }
}

sendWebhook();

import { Polar } from '@polar-sh/sdk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.local from', envPath);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const secret = process.env.POLAR_WEBHOOK_SECRET;

if (!secret) {
    console.error('ERROR: POLAR_WEBHOOK_SECRET not found in environment');
    process.exit(1);
}

console.log('Secret loaded:', secret.substring(0, 10) + '...', 'Length:', secret.length);

// 1. Construct Payload (must match schema to pass schema validation first)
const payload = JSON.stringify({
    type: "subscription.canceled",
    data: {
        id: "sub_123",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date().toISOString(),
        customer: {
            email: "test@example.com",
            id: "cust_123"
        },
        product: {
            name: "Pro",
            id: "prod_123"
        }
    }
});

// 2. Generate Signature (Standard Webhooks / Polar Style)
// header: webhook-signature: t=<timestamp>,v1=<signature>
// signature = base64(hmac_sha256(msgId + "." + timestamp + "." + payload, base64_decode(secret_part)))

function generateSignature(payload: string, secret: string) {
    // Strip prefix if present (Polar uses polar_whs_)
    const secretKey = secret.startsWith('polar_whs_') ? secret.slice('polar_whs_'.length) : secret;
    const secretBytes = Buffer.from(secretKey, 'base64');

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const msgId = "msg_" + Math.random().toString(36).substring(7);

    const toSign = `${msgId}.${timestamp}.${payload}`;

    const signature = crypto
        .createHmac('sha256', secretBytes)
        .update(toSign)
        .digest('base64');

    return {
        timestamp,
        msgId,
        signature,
        header: `v1,${signature}`
    };
}

const { timestamp, msgId, signature, header } = generateSignature(payload, secret);

console.log('Generated Signature Details:');
console.log('Timestamp:', timestamp);
console.log('MsgID:', msgId);
console.log('Signature:', signature);

// 3. Test Validation using SDK
const polar = new Polar({ accessToken: "dummy", server: "sandbox" }); // Token doesn't matter for webhook validation

// Construct headers as incoming request would have
// Note: Polar SDK expects 'webhook-signature' and 'webhook-id', 'webhook-timestamp' headers usually?
// Check SDK expectation. If generic validateWebhook, it might parse 'polar-webhook-...' headers or standard ones.
// We will try standard headers first as per docs.

const headersStr = {
    'polar-webhook-signature': header, // v1,...
    'polar-webhook-id': msgId,
    'polar-webhook-timestamp': timestamp,
    'content-type': 'application/json'
};

// Also try standard headers just in case
const headersStd = {
    'webhook-signature': `t=${timestamp},v1=${signature}`, // Standard Webhooks full header? 
    // Wait, Standard Webhooks spec is: webhook-signature: t=...,v1=...
    // Polar might use split headers.
    'webhook-id': msgId,
    'webhook-timestamp': timestamp,
    'content-type': 'application/json'
};

console.log('Testing Validation with Payload:', payload);

async function testValidation() {
    console.log('\n--- Attempt 1: polar-webhook-* headers ---');
    try {
        await polar.validateWebhook({
            request: {
                body: payload,
                headers: new Headers(headersStr) as any,
                url: 'http://localhost/api/webhooks/polar',
                method: 'POST'
            }
        });
        console.log("✅ Validation SUCCEEDED with polar headers!");
    } catch (e: any) {
        console.error("❌ Validation FAILED with polar headers:", e.message);
    }

    console.log('\n--- Attempt 2: Standard Webhooks headers (webhook-*) ---');
    try {
        await polar.validateWebhook({
            request: {
                body: payload,
                headers: new Headers(headersStd) as any,
                url: 'http://localhost/api/webhooks/polar',
                method: 'POST'
            }
        });
        console.log("✅ Validation SUCCEEDED with standard headers!");
    } catch (e: any) {
        console.error("❌ Validation FAILED with standard headers:", e.message);
    }

    console.log('\n--- Attempt 3: Manual Verification Logic ---');
    // Verify our own generated signature using the same logic we expect the server to use
    // header: v1,signature
    // secret: raw string (base64 encoded part?)

    function manualVerify(payload: string, header: string, secret: string) {
        const secretKey = secret.startsWith('polar_whs_') ? secret.slice('polar_whs_'.length) : secret;
        // Check if we should use Buffer.from(secretKey, 'base64') or just secretKey string
        // Standard Webhooks RFC says secret is base64url encoded.

        // Lets try both to see what works with our Generated Signature
        const signatureFromHeader = header.replace('v1,', '');

        // Method A: Secret as Base64 Bytes (Standard Webhooks)
        const secretBytesA = Buffer.from(secretKey, 'base64');
        const toSignA = `${msgId}.${timestamp}.${payload}`;
        const computedA = crypto.createHmac('sha256', secretBytesA).update(toSignA).digest('base64');

        // Method B: Secret as String
        const toSignB = `${msgId}.${timestamp}.${payload}`;
        const computedB = crypto.createHmac('sha256', secretKey).update(toSignB).digest('base64');

        console.log(`Manual Verify A (Base64 Secret): Expect ${signatureFromHeader}, Got ${computedA} -> ${signatureFromHeader === computedA ? 'MATCH' : 'FAIL'}`);
        console.log(`Manual Verify B (String Secret): Expect ${signatureFromHeader}, Got ${computedB} -> ${signatureFromHeader === computedB ? 'MATCH' : 'FAIL'}`);
    }

    manualVerify(payload, header, secret!);
}

testValidation();

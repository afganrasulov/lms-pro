import { Polar } from '@polar-sh/sdk'

const token = process.env.POLAR_SANDBOX_TOKEN ?? ''
console.log('[Polar] Initializing with token:', token ? `${token.substring(0, 10)}...` : 'MISSING')

export const polar = new Polar({
    accessToken: token,
    server: 'sandbox',
})

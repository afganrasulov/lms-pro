import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

// Define type for the cached client on the global object
// This prevents TypeScript errors when accessing globalThis.supabase
declare global {
    var supabase: ReturnType<typeof createBrowserClient<Database>> | undefined
}

export function createClient() {
    if (typeof window === 'undefined') {
        return createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }

    // Use global variable to persist client across HMR in development
    if (process.env.NODE_ENV === 'development') {
        if (!globalThis.supabase) {
            globalThis.supabase = createBrowserClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
        }
        return globalThis.supabase
    }

    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

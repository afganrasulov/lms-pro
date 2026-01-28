"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const OrganizationSchema = z.object({
    polar_access_token: z.string().min(1, "API Key gereklidir"),
    polar_organization_id: z.string().optional(),
})

export async function updateOrganizationPolarKeys(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    // 1. Get User Profile to find Organization
    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id, role")
        .eq("id", user.id)
        .single()

    if (!(profile as any)?.organization_id) {
        return { error: "Bir organizasyona bağlı değilsiniz." }
    }

    /* 
    // TODO: Add Role Check (Only admins/instructors can update)
    if (profile.role !== 'admin' && profile.role !== 'instructor') {
        return { error: "Yetkisiz erişim" }
    }
    */

    const polar_access_token = formData.get("polar_access_token") as string
    const polar_organization_id = formData.get("polar_organization_id") as string

    // Validate
    const result = OrganizationSchema.safeParse({ polar_access_token, polar_organization_id })
    if (!result.success) {
        return { error: (result.error as any).errors[0].message }
    }

    // 2. Update Organization
    const { data: updatedOrg, error } = await (supabase as any)
        .from("organizations")
        .update({
            polar_access_token: result.data.polar_access_token,
            polar_organization_id: result.data.polar_organization_id
        })
        .eq("id", (profile as any).organization_id)
        .select() // Return updated rows
        .single() // Expect one row

    if (error || !updatedOrg) {
        console.error("Org update error:", error)
        return { error: "Organizasyon güncellenemedi veya bulunamadı" }
    }

    revalidatePath("/settings")
    return { success: "Polar entegrasyonu güncellendi" }
}

export async function disconnectOrganizationPolar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Oturum açmanız gerekiyor" }
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

    if (!(profile as any)?.organization_id) {
        return { error: "Bir organizasyona bağlı değilsiniz." }
    }

    const { error } = await (supabase as any)
        .from("organizations")
        .update({
            polar_access_token: null,
            polar_organization_id: null
        })
        .eq("id", (profile as any).organization_id)

    if (error) {
        console.error("Org disconnect error:", error)
        return { error: "Bağlantı kesilemedi" }
    }

    revalidatePath("/settings")
    return { success: "Polar bağlantısı kesildi" }
}

export async function getOrganizationSettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single()

    if (!(profile as any)?.organization_id) return null

    const { data: org } = await (supabase as any)
        .from("organizations")
        .select("polar_access_token, polar_organization_id")
        .eq("id", (profile as any).organization_id)
        .single()

    return org
}

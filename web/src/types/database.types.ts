export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            certificates: {
                Row: {
                    certificate_url: string | null
                    course_id: string
                    credential_id: string
                    id: string
                    issued_at: string
                    user_id: string
                }
                Insert: {
                    certificate_url?: string | null
                    course_id: string
                    credential_id: string
                    id?: string
                    issued_at?: string
                    user_id: string
                }
                Update: {
                    certificate_url?: string | null
                    course_id?: string
                    credential_id?: string
                    id?: string
                    issued_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "certificates_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            course_instructors: {
                Row: {
                    course_id: string
                    created_at: string
                    role: string
                    user_id: string
                }
                Insert: {
                    course_id: string
                    created_at?: string
                    role?: string
                    user_id: string
                }
                Update: {
                    course_id?: string
                    created_at?: string
                    role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_instructors_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_instructors_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_instructors_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            course_progress: {
                Row: {
                    completed_at: string | null
                    completed_lessons: string[] | null
                    course_id: string
                    created_at: string
                    id: string
                    last_accessed_at: string
                    user_id: string
                }
                Insert: {
                    completed_at?: string | null
                    completed_lessons?: string[] | null
                    course_id: string
                    created_at?: string
                    id?: string
                    last_accessed_at?: string
                    user_id: string
                }
                Update: {
                    completed_at?: string | null
                    completed_lessons?: string[] | null
                    course_id?: string
                    created_at?: string
                    id?: string
                    last_accessed_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "course_progress_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_progress_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_progress_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            courses: {
                Row: {
                    category_id: string | null
                    created_at: string
                    description: string | null
                    id: string
                    image_url: string | null
                    instructor_id: string
                    status: Database["public"]["Enums"]["content_status"]
                    price: number | null
                    title: string
                    updated_at: string
                    visibility: Database["public"]["Enums"]["course_visibility"] | null
                    slug: string
                    subtitle: string | null
                    level: string | null
                    category: string | null
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    status?: Database["public"]["Enums"]["content_status"]
                    level?: string | null
                    meta_description?: string | null
                    meta_title?: string | null
                    position?: number
                    price?: number | null
                    requirements?: Json | null
                    title: string
                    updated_at?: string
                    visibility?: Database["public"]["Enums"]["course_visibility"] | null
                    slug: string
                    subtitle?: string | null

                    category?: string | null
                }
                Update: {
                    category_id?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    slug?: string
                    instructor_id?: string
                    status?: Database["public"]["Enums"]["content_status"]
                    price?: number | null
                    requirements?: Json | null
                    title?: string
                    updated_at?: string
                    visibility?: Database["public"]["Enums"]["course_visibility"] | null
                    subtitle?: string | null
                    level?: string | null
                    category?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "courses_instructor_id_fkey"
                        columns: ["instructor_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "courses_instructor_id_fkey"
                        columns: ["instructor_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            lesson_contents: {
                Row: {
                    id: string
                    lesson_id: string
                    content_markdown: string | null
                    content_json: Json | null
                    version: number
                    is_current_version: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    lesson_id: string
                    content_markdown?: string | null
                    content_json?: Json | null
                    version?: number
                    is_current_version?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    lesson_id?: string
                    content_markdown?: string | null
                    content_json?: Json | null
                    version?: number
                    is_current_version?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "lesson_contents_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    }
                ]
            }
            lesson_progress: {
                Row: {
                    completed_at: string | null
                    created_at: string
                    id: string
                    is_completed: boolean | null
                    last_watched_position: number | null
                    lesson_id: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    completed_at?: string | null
                    created_at?: string
                    id?: string
                    is_completed?: boolean | null
                    last_watched_position?: number | null
                    lesson_id: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    completed_at?: string | null
                    created_at?: string
                    id?: string
                    is_completed?: boolean | null
                    last_watched_position?: number | null
                    lesson_id?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "lesson_progress_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lesson_progress_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lesson_progress_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            lessons: {
                Row: {
                    chapter_id: string
                    content: string | null
                    created_at: string
                    description: string | null
                    duration: number | null
                    id: string
                    is_free: boolean | null
                    is_preview: boolean | null
                    is_published: boolean | null
                    position: number
                    title: string
                    type: Database["public"]["Enums"]["lesson_type"]
                    updated_at: string
                    video_url: string | null
                }
                Insert: {
                    chapter_id: string
                    content?: string | null
                    created_at?: string
                    description?: string | null
                    duration?: number | null
                    id?: string
                    is_free?: boolean | null
                    is_preview?: boolean | null
                    is_published?: boolean | null
                    position: number
                    title: string
                    type?: Database["public"]["Enums"]["lesson_type"]
                    updated_at?: string
                    video_url?: string | null
                }
                Update: {
                    chapter_id?: string
                    content?: string | null
                    created_at?: string
                    description?: string | null
                    duration?: number | null
                    id?: string
                    is_free?: boolean | null
                    is_preview?: boolean | null
                    is_published?: boolean | null
                    position?: number
                    title?: string
                    type?: Database["public"]["Enums"]["lesson_type"]
                    updated_at?: string
                    video_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "lessons_chapter_id_fkey"
                        columns: ["chapter_id"]
                        isOneToOne: false
                        referencedRelation: "modules"
                        referencedColumns: ["id"]
                    },
                ]
            }
            modules: {
                Row: {
                    course_id: string
                    created_at: string
                    description: string | null
                    id: string
                    is_published: boolean | null
                    position: number
                    title: string
                    updated_at: string
                }
                Insert: {
                    course_id: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_published?: boolean | null
                    position: number
                    title: string
                    updated_at?: string
                }
                Update: {
                    course_id?: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    is_published?: boolean | null
                    position?: number
                    title?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "modules_course_id_fkey"
                        columns: ["course_id"]
                        isOneToOne: false
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string
                    id: string
                    is_read: boolean | null
                    message: string
                    title: string
                    type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_read?: boolean | null
                    message: string
                    title: string
                    type: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_read?: boolean | null
                    message?: string
                    title?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    email: string
                    full_name: string | null
                    id: string
                    role: Database["public"]["Enums"]["user_role"] | null
                    updated_at: string
                    license_key?: string | null
                    license_status?: string | null
                    level?: number
                    xp_points?: number
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    marketing_emails?: boolean | null
                    language?: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    email: string
                    full_name?: string | null
                    id: string
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string
                    license_key?: string | null
                    license_status?: string | null
                    level?: number
                    xp_points?: number
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    marketing_emails?: boolean | null
                    language?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    email?: string
                    full_name?: string | null
                    id?: string
                    role?: Database["public"]["Enums"]["user_role"] | null
                    updated_at?: string
                    license_key?: string | null
                    license_status?: string | null
                    level?: number
                    xp_points?: number
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    marketing_emails?: boolean | null
                    language?: string | null
                }
                Relationships: []
            }
            quiz_attempts: {
                Row: {
                    completed_at: string | null
                    id: string
                    lesson_id: string
                    score: number | null
                    started_at: string
                    user_id: string
                }
                Insert: {
                    completed_at?: string | null
                    id?: string
                    lesson_id: string
                    score?: number | null
                    started_at?: string
                    user_id: string
                }
                Update: {
                    completed_at?: string | null
                    id?: string
                    lesson_id?: string
                    score?: number | null
                    started_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "quiz_attempts_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quiz_attempts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "quiz_attempts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            quiz_questions: {
                Row: {
                    correct_option_id: number
                    id: string
                    lesson_id: string
                    options: Json
                    question_text: string
                }
                Insert: {
                    correct_option_id: number
                    id?: string
                    lesson_id: string
                    options: Json
                    question_text: string
                }
                Update: {
                    correct_option_id?: number
                    id?: string
                    lesson_id?: string
                    options?: Json
                    question_text?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "quiz_questions_lesson_id_fkey"
                        columns: ["lesson_id"]
                        isOneToOne: false
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    },
                ]
            }
            system_settings: {
                Row: {
                    created_at: string
                    description: string | null
                    id: string
                    key: string
                    updated_at: string
                    updated_by: string | null
                    value: Json
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    key: string
                    updated_at?: string
                    updated_by?: string | null
                    value: Json
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    key?: string
                    updated_at?: string
                    updated_by?: string | null
                    value?: Json
                }
                Relationships: [
                    {
                        foreignKeyName: "system_settings_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "system_settings_updated_by_fkey"
                        columns: ["updated_by"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            user_achievements: {
                Row: {
                    achievement_id: string
                    earned_at: string
                    id: string
                    user_id: string
                }
                Insert: {
                    achievement_id: string
                    earned_at?: string
                    id?: string
                    user_id: string
                }
                Update: {
                    achievement_id?: string
                    earned_at?: string
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_achievements_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_achievements_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
            user_settings: {
                Row: {
                    user_id: string
                    email_notifications: boolean | null
                    push_notifications: boolean | null
                    marketing_emails: boolean | null
                    language: string | null
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    marketing_emails?: boolean | null
                    language?: string | null
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    email_notifications?: boolean | null
                    push_notifications?: boolean | null
                    marketing_emails?: boolean | null
                    language?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_settings_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            xp_ledger: {
                Row: {
                    amount: number
                    created_at: string
                    description: string | null
                    id: string
                    source: string
                    user_id: string
                }
                Insert: {
                    amount: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    source: string
                    user_id: string
                }
                Update: {
                    amount?: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    source?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "xp_ledger_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "xp_ledger_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    },
                ]
            }
        }
        Views: {
            weekly_leaderboard: {
                Row: {
                    avatar_url: string | null
                    full_name: string | null
                    rank: number | null
                    user_id: string | null
                    weekly_xp: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "xp_ledger_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            asset_provider: "mux" | "vimeo" | "youtube" | "supabase_storage"
            content_status: "draft" | "published" | "archived"
            course_visibility: "public" | "private" | "unlisted"
            lesson_type: "video" | "text" | "quiz" | "assignment" | "live_class"
            user_role: "admin" | "instructor" | "student"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: Exclude<keyof Database, "__InternalSupabase">
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: Exclude<keyof Database, "__InternalSupabase"> },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: Exclude<keyof Database, "__InternalSupabase">
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: Exclude<keyof Database, "__InternalSupabase"> }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            asset_provider: ["mux", "vimeo", "youtube", "supabase_storage"],
            content_status: ["draft", "published", "archived"],
            course_visibility: ["public", "private", "unlisted"],
            lesson_type: ["video", "text", "quiz", "assignment", "live_class"],
            user_role: ["admin", "instructor", "student"],
        },
    },
} as const
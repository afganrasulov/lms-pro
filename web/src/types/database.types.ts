export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
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
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "certificates_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    }
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
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_instructors_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "course_instructors_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "weekly_leaderboard"
                        referencedColumns: ["user_id"]
                    }
                ]
            }
            courses: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    title: string
                    slug: string
                    description: string | null
                    subtitle: string | null
                    level: string | null
                    category: string | null
                    position: number
                    status: string
                    visibility: string
                    created_by: string | null
                    updated_by: string | null
                    cover_image_path: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    title: string
                    slug: string
                    description?: string | null
                    subtitle?: string | null
                    level?: string | null
                    category?: string | null
                    position?: number
                    status?: string
                    visibility?: string
                    created_by?: string | null
                    updated_by?: string | null
                    cover_image_path?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    title?: string
                    slug?: string
                    description?: string | null
                    subtitle?: string | null
                    level?: string | null
                    category?: string | null
                    position?: number
                    status?: string
                    visibility?: string
                    created_by?: string | null
                    updated_by?: string | null
                    cover_image_path?: string | null
                }
                Relationships: []
            }
            modules: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    course_id: string
                    title: string
                    description: string | null
                    position: number
                    status: string
                    created_by: string | null
                    updated_by: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    course_id: string
                    title: string
                    description?: string | null
                    position?: number
                    status?: string
                    created_by?: string | null
                    updated_by?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    course_id?: string
                    title?: string
                    description?: string | null
                    position?: number
                    status?: string
                    created_by?: string | null
                    updated_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "modules_course_id_fkey"
                        columns: ["course_id"]
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    }
                ]
            }
            lessons: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    module_id: string
                    title: string
                    slug: string
                    description: string | null
                    type: string
                    position: number
                    is_free_preview: boolean
                    duration_seconds: number | null
                    status: string
                    created_by: string | null
                    updated_by: string | null
                    content: string | null
                    video_url: string | null
                    video_provider: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    module_id: string
                    title: string
                    slug: string
                    description?: string | null
                    type?: string
                    position?: number
                    is_free_preview?: boolean
                    duration_seconds?: number | null
                    status?: string
                    created_by?: string | null
                    updated_by?: string | null
                    content?: string | null
                    video_url?: string | null
                    video_provider?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    module_id?: string
                    title?: string
                    slug?: string
                    description?: string | null
                    type?: string
                    position?: number
                    is_free_preview?: boolean
                    duration_seconds?: number | null
                    status?: string
                    created_by?: string | null
                    updated_by?: string | null
                    content?: string | null
                    video_url?: string | null
                    video_provider?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "lessons_module_id_fkey"
                        columns: ["module_id"]
                        referencedRelation: "modules"
                        referencedColumns: ["id"]
                    }
                ]
            }
            lesson_progress: {
                Row: {
                    id: string
                    user_id: string
                    lesson_id: string
                    course_id: string
                    updated_at: string
                    last_position_seconds: number
                    is_completed: boolean
                    completed_at: string | null
                    status: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    lesson_id: string
                    course_id: string
                    updated_at?: string
                    last_position_seconds?: number
                    is_completed?: boolean
                    completed_at?: string | null
                    status?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    lesson_id?: string
                    course_id?: string
                    updated_at?: string
                    last_position_seconds?: number
                    is_completed?: boolean
                    completed_at?: string | null
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "lesson_progress_lesson_id_fkey"
                        columns: ["lesson_id"]
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "lesson_progress_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            enrollments: {
                Row: {
                    id: string
                    user_id: string
                    course_id: string
                    status: string
                    enrolled_at: string
                    expires_at: string | null
                    source: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    course_id: string
                    status?: string
                    enrolled_at?: string
                    expires_at?: string | null
                    source?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    course_id?: string
                    status?: string
                    enrolled_at?: string
                    expires_at?: string | null
                    source?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "enrollments_course_id_fkey"
                        columns: ["course_id"]
                        referencedRelation: "courses"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "enrollments_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            lesson_contents: {
                Row: {
                    id: string
                    lesson_id: string
                    version: number
                    content_markdown: string | null
                    content_json: Json | null
                    is_current_version: boolean
                    created_at: string
                    updated_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    lesson_id: string
                    version?: number
                    content_markdown?: string | null
                    content_json?: Json | null
                    is_current_version?: boolean
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    lesson_id?: string
                    version?: number
                    content_markdown?: string | null
                    content_json?: Json | null
                    is_current_version?: boolean
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "lesson_contents_lesson_id_fkey"
                        columns: ["lesson_id"]
                        referencedRelation: "lessons"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    full_name: string | null
                    avatar_url: string | null
                    role: string
                    xp_points: number
                    gems: number
                    level: number
                    license_key: string | null
                    license_status: string | null
                }
                Insert: {
                    id: string
                    created_at?: string
                    updated_at?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: string
                    xp_points?: number
                    gems?: number
                    level?: number
                    license_key?: string | null
                    license_status?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: string
                    xp_points?: number
                    gems?: number
                    level?: number
                    license_key?: string | null
                    license_status?: string | null
                }
                Relationships: []
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    is_read?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            user_settings: {
                Row: {
                    id: string
                    user_id: string
                    theme: string
                    language: string
                    email_notifications: boolean
                    marketing_emails: boolean
                    push_notifications: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    theme?: string
                    language?: string
                    email_notifications?: boolean
                    marketing_emails?: boolean
                    push_notifications?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    theme?: string
                    language?: string
                    email_notifications?: boolean
                    marketing_emails?: boolean
                    push_notifications?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            user_streaks: {
                Row: {
                    current_streak: number | null
                    id: string
                    last_activity_date: string | null
                    longest_streak: number | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    current_streak?: number | null
                    id?: string
                    last_activity_date?: string | null
                    longest_streak?: number | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    current_streak?: number | null
                    id?: string
                    last_activity_date?: string | null
                    longest_streak?: number | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_streaks_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            xp_logs: {
                Row: {
                    action_type: string
                    amount: number
                    created_at: string
                    description: string | null
                    id: string
                    reference_id: string | null
                    user_id: string
                }
                Insert: {
                    action_type: string
                    amount: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    reference_id?: string | null
                    user_id: string
                }
                Update: {
                    action_type?: string
                    amount?: number
                    created_at?: string
                    description?: string | null
                    id?: string
                    reference_id?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "xp_logs_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }

        }
        Views: {
            course_progress_summary: {
                Row: {
                    user_id: string
                    course_id: string
                    total_lessons: number | null
                    completed_lessons: number | null
                    progress_percent: number | null
                    updated_at: string
                }
                Relationships: []
            }
            weekly_leaderboard: {
                Row: {
                    avatar_url: string | null
                    full_name: string | null
                    user_id: string | null
                    weekly_xp: number | null
                }
                Relationships: []
            }
        }
        Functions: {
            get_admin_stats: {
                Args: Record<PropertyKey, never>
                Returns: {
                    total_users: number
                    total_courses: number
                    active_enrollments: number
                }[]
            }
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

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
}
    ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
}
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

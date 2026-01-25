import { Database } from './database.types';

// --- Convenience Types ---

export type DbTables = Database['public']['Tables'];
export type DbEnums = Database['public']['Enums'];
export type DbViews = Database['public']['Views'];

// Entity Row Types
export type Course = DbTables['courses']['Row'];
export type Profile = DbTables['profiles']['Row'];
export type Module = DbTables['modules']['Row'];
export type Lesson = DbTables['lessons']['Row'];
export type Enrollment = DbTables['enrollments']['Row'];
export type Notification = DbTables['notifications']['Row'];
// export type Order = DbTables['orders']['Row'];
export type Certificate = DbTables['certificates']['Row'];
export type UserSetting = DbTables['user_settings']['Row'];
export type UserStreak = DbTables['user_streaks']['Row'];
export type XpLog = DbTables['xp_logs']['Row'];
// export type XpTransaction = DbTables['xp_transactions']['Row'];
// export type LessonAsset = DbTables['lesson_assets']['Row'];
export type LessonContent = DbTables['lesson_contents']['Row'];
export type CourseProgressSummary = DbViews['course_progress_summary']['Row'];
export type CourseInstructor = DbTables['course_instructors']['Row'];
export type LessonProgress = DbTables['lesson_progress']['Row'];

// Views
export type WeeklyLeaderboard = DbViews['weekly_leaderboard']['Row'];

// Entity Insert Types
export type CourseInsert = DbTables['courses']['Insert'];
export type ProfileInsert = DbTables['profiles']['Insert'];
export type ModuleInsert = DbTables['modules']['Insert'];
export type LessonInsert = DbTables['lessons']['Insert'];
export type EnrollmentInsert = DbTables['enrollments']['Insert'];
export type NotificationInsert = DbTables['notifications']['Insert'];
// export type OrderInsert = DbTables['orders']['Insert'];
export type CertificateInsert = DbTables['certificates']['Insert'];
export type UserSettingInsert = DbTables['user_settings']['Insert'];
export type UserStreakInsert = DbTables['user_streaks']['Insert'];
export type XpLogInsert = DbTables['xp_logs']['Insert'];
// export type XpTransactionInsert = DbTables['xp_transactions']['Insert'];

// Entity Update Types
export type CourseUpdate = DbTables['courses']['Update'];
export type ProfileUpdate = DbTables['profiles']['Update'];
export type ModuleUpdate = DbTables['modules']['Update'];
export type LessonUpdate = DbTables['lessons']['Update'];
export type EnrollmentUpdate = DbTables['enrollments']['Update'];
export type NotificationUpdate = DbTables['notifications']['Update'];
// export type OrderUpdate = DbTables['orders']['Update'];
export type CertificateUpdate = DbTables['certificates']['Update'];
export type UserSettingUpdate = DbTables['user_settings']['Update'];
export type UserStreakUpdate = DbTables['user_streaks']['Update'];
export type XpLogUpdate = DbTables['xp_logs']['Update'];
// export type XpTransactionUpdate = DbTables['xp_transactions']['Update'];

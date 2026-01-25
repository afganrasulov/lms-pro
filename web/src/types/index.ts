import { Database } from './database.types';
import { Course, Profile } from './schema';

export * from './database.types';
export * from './schema';

// Complex Joined Types
export type CourseWithInstructors = Course & {
    instructors: {
        user: Profile;
        role: string;
    }[];
};

export type CourseWithMeta = Course & {
    total_lessons: number;
    total_duration: number; // in seconds
    user_progress: number | null; // percentage 0-100, null if not enrolled
    is_enrolled: boolean;
    is_locked: boolean;
};

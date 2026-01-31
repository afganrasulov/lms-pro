# Database Optimization Report (Jan 2026)

## Overview

This document details the security hardening and performance optimizations applied to the Supabase database in January 2026. The goal was to resolve linter warnings regarding row-level security (RLS) drawbacks, unindexed foreign keys, and insecure view definitions.

## 1. RLS Performance (InitPlans)

**Issue**: Using `auth.uid()` directly in RLS policies can cause Postgres to re-evaluate the function for *every row* (Volatile), leading to massive performance degradation on large tables.
**Fix**: Wrapped all authentication calls in a subquery `(select auth.uid())`. This forces Postgres to treat the value as an **InitPlan** (calculated once per query).

**Affected Tables**:

- `profiles`
- `courses`, `lessons`, `enrollments`
- `lesson_progress`, `lesson_assets`
- `course_progress_summary`
- And 10+ others.

## 2. Policy Consolidation (Unified Policies)

**Issue**: The "Multiple Permissive Policies" warning indicated that multiple policies were being evaluated for the same operation (e.g., one policy for "Public Read" and another for "Admin Read"). This adds redundant overhead.
**Fix**: Consolidated overlapping policies into **Unified Policies** using `OR` logic.

**Example (`courses` SELECT)**:
- **Before**: `Published courses are viewable` + `Instructors can view own` + `Admins can view all`.
- **After**: `Unified view courses`

    ```sql
    (status = 'published' AND visibility = 'public')
    OR
    (EXISTS (SELECT 1 FROM course_instructors ...))
    OR
    (auth.role() = 'admin')
    ```

## 3. Foreign Key Indexing

**Issue**: 17 foreign keys lacked covering indexes, which degrades performance for `JOIN` operations and cascading deletes.
**Fix**: Created B-Tree indexes for all identified keys.

**New Indexes**:
- `certificates(course_id)`
- `course_instructors(user_id)`
- `course_progress_summary(course_id)`
- `courses(created_by, updated_by, organization_id)`
- `enrollments(course_id, organization_id)`
- `lesson_assets(lesson_id)`
- `lesson_progress(course_id, lesson_id)`
- `lessons(created_by, updated_by)`
- `modules(created_by, updated_by)`
- `profiles(organization_id)`
- `system_settings(updated_by)`

## 4. Security Hardening

**Views**:
- **Issue**: `weekly_leaderboard` was a standard View, which often defaults to `SECURITY DEFINER` semantics (running as owner), bypassing RLS.
- **Fix**: Explicitly set `security_invoker = true` to ensure the view respects the querying user's RLS policies.

**Functions**:
- **Issue**: Functions executing with `security_definer` are vulnerable to search_path hijacking.
- **Fix**: Explicitly set `search_path = public` for all elevated functions.

## 5. Known Linter Warnings

The following warnings in the Supabase Dashboard are **expected** and safe to ignore:
- **Unused Index**: Newly created indexes (from Section 3) will be flagged as "unused" until sufficient traffic patterns accumulate. **Do not delete them.**

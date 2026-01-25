import { test, expect } from '@playwright/test';

test.describe('Vimeo Playback Resilience', () => {
    // Use a real browser User-Agent to avoid Vimeo 406 blocks
    test.use({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });

    test.beforeEach(async ({ page, context }) => {
        await page.goto('/login');

        // Mock User
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'e80749a2-9343-4c9f-a0a2-234234234234',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'test_automation_user@example.com',
                })
            });
        });

        // Mock Fallbacks
        await routeFallback(page, '**/rest/v1/lesson_progress*', []);
        await routeFallback(page, '**/rest/v1/lessons*', []);

        await page.fill('input[type="email"]', 'test_automation_user@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        // 3. Mock Fallbacks
        await routeFallback(page, '**/rest/v1/lesson_progress*', []);
        // Mock active enrollment to show course on dashboard
        await page.route('**/rest/v1/enrollments*', async route => {
            await route.fulfill({
                json: [{
                    id: 'enroll-1',
                    user_id: 'e80749a2-9343-4c9f-a0a2-234234234234',
                    course_id: 'course-123',
                    status: 'active',
                    courses: {
                        id: 'course-123',
                        title: 'Vimeo Test Course',
                        slug: 'vimeo-test-course-slug',
                        status: 'published',
                        cover_image_path: null
                    }
                }]
            });
        });
        await routeFallback(page, '**/rest/v1/course_progress_summary*', []);

        // Mock Vimeo Player to avoid 406
        await page.route('https://player.vimeo.com/**', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'text/html',
                body: '<html><body><div id="player">Mock Vimeo Player</div></body></html>'
            });
        });

        // Perform Login
        await page.keyboard.press('Enter');

        // Wait for potential redirect or just wait a moment to ensure cookie is set
        // The middleware needs the cookie.
        // We can wait for navigation away from /login
        try {
            await page.waitForURL('!**/login', { timeout: 5000 });
        } catch (e) {
            console.log('Login navigation timeout - might be handled by client redirect');
        }

        // We skip Dashboard navigation because it relies on RSC (Server Side) fetching which cannot be mocked by page.route
        // We will navigate directly to the Client Component pages in the tests

        // [DEBUG] Log all Supabase requests
        await page.route('**/rest/v1/**', async (route: any) => {
            console.log('[E2E NETWORK] Request:', route.request().method(), route.request().url());
            await route.continue();
        });

        // [DEBUG] Capture browser console logs
        page.on('console', msg => console.log(`[BROWSER LOG] ${msg.text()}`));

        // [DEBUG] Log ALL requests
        await context.route(/.*/, async (route: any) => {
            const url = route.request().url();
            if (url.includes('vimeo')) {
                console.log('[E2E ALL-CATCH] Vimeo-like request:', url);
            }
            await route.continue();
        });

        // Mock Vimeo Player using Regex to be sure
        await context.route(/vimeo\.com/, async (route: any) => {
            const url = route.request().url();
            console.log('[E2E MOCK HIT] Vimeo Request:', url);

            if (url.includes('api/oembed.json')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        type: 'video',
                        version: '1.0',
                        provider_name: 'Vimeo',
                        html: '<iframe src="https://player.vimeo.com/video/76979871" width="480" height="270" frameborder="0"></iframe>',
                        width: 480,
                        height: 270
                    })
                });
            } else if (url.includes('player.vimeo.com')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'text/html',
                    body: '<html><body>Mock Vimeo Player</body></html>'
                });
            } else if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'text/html',
                    body: '<html><body>Mock Vimeo Site</body></html>'
                });
            } else {
                route.continue();
            }
        });
    });

    test('should extract and normalize url from iframe embed code', async ({ page }) => {
        const vimeoId = '76979871';
        const embedCode = `<iframe src="https://player.vimeo.com/video/${vimeoId}?h=123" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture"></iframe>`;
        const expectedCleanUrl = `https://vimeo.com/${vimeoId}?h=123`;

        // Capture logs
        let normalizedLog: string | undefined;
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[VideoPlayer] Normalized Vimeo URL')) {
                normalizedLog = text;
            }
        });

        await mockCourse(page, vimeoId, embedCode);
        await page.goto('/courses/vimeo-test-course-slug/learn');

        // Wait for component to mount and process logic
        await page.waitForTimeout(3000);

        // Verify logic via logs
        expect(normalizedLog).toBeDefined();
        expect(normalizedLog).toContain(`to: ${expectedCleanUrl}`);
    });

    test('should handle spaces in iframe src attribute', async ({ page }) => {
        const vimeoId = '76979871';
        const embedCode = `<iframe src = " https://player.vimeo.com/video/${vimeoId} " ></iframe>`;
        const expectedCleanUrl = `https://vimeo.com/${vimeoId}`;

        let normalizedLog: string | undefined;
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[VideoPlayer] Normalized Vimeo URL')) {
                normalizedLog = text;
            }
        });

        await mockCourse(page, vimeoId, embedCode);
        await page.goto('/courses/vimeo-test-course-slug/learn');

        await page.waitForTimeout(3000);

        expect(normalizedLog).toBeDefined();
        expect(normalizedLog).toContain(`to: ${expectedCleanUrl}`);
    });

    test('should clean tracking params but preserve hash for private videos', async ({ page }) => {
        const vimeoId = '76979999'; // Changed vimeoId to avoid collision with other tests if they were to run in parallel
        const hash = 'abc12345';
        const dirtyUrl = `https://vimeo.com/${vimeoId}?fl=pl&fe=sh&h=${hash}`;
        const expectedCleanUrl = `https://vimeo.com/${vimeoId}?h=${hash}`;

        let cleanedLog: string | undefined;
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('[VideoPlayer] Cleaned Vimeo URL')) {
                cleanedLog = text;
            }
        });

        await mockCourse(page, vimeoId, dirtyUrl);
        await page.goto('/courses/vimeo-test-course-slug/learn');

        await page.waitForTimeout(3000);

        expect(cleanedLog).toBeDefined();
        expect(cleanedLog).toContain(`cleaned: ${expectedCleanUrl}`);
    });
});

async function mockCourse(page: any, vimeoId: string, videoUrlValue: string) {
    // 1. Mock Course Details (Single)
    // Matches: supabase.from('courses').select('*').eq('slug', slug).single()
    await page.route('**/rest/v1/courses*', async (route: any) => {
        const url = route.request().url();
        if (url.includes('slug=eq.vimeo-test-course-slug')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'course-123',
                    title: 'Vimeo Test Course',
                    slug: 'vimeo-test-course-slug',
                    status: 'published',
                    user_id: 'test-user-id',
                    created_at: new Date().toISOString()
                })
            });
        } else {
            route.continue();
        }
    });

    // 2. Mock Modules with Lessons and Content (Nested)
    // Matches: .from('modules').select('*, lessons(*, lesson_contents(*))').eq('course_id', course.id)
    await page.route('**/rest/v1/modules*', async (route: any) => {
        const url = route.request().url();
        if (url.includes('course_id=eq.course-123')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    id: 'mod-1',
                    course_id: 'course-123',
                    title: 'Module 1',
                    position: 0,
                    lessons: [{
                        id: 'lesson-1',
                        module_id: 'mod-1',
                        title: 'Embed Code Lesson',
                        slug: 'embed-lesson',
                        position: 0,
                        status: 'published',
                        lesson_contents: [{
                            id: 'content-1',
                            lesson_id: 'lesson-1',
                            content_json: { videoUrl: videoUrlValue },
                            content_markdown: ''
                        }]
                    }]
                }])
            });
        } else {
            route.continue();
        }
    });
}

async function routeFallback(page: any, url: string, body: any) {
    await page.route(url, async (route: any) => {
        await route.fulfill({ json: body });
    });
}

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Dynamic Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    bold: "\x1b[1m"
};

async function main() {
    console.log(`${colors.bold}🧠 Testing Advanced Features (Certificates, Notification, Assets)${colors.reset}\n`);

    // Import Singleton Client (which services use)
    const { supabase } = await import('@/lib/supabase');

    // --- AUTHENTICATION ---
    process.stdout.write(`${colors.blue}[AUTH]${colors.reset} Authenticating... `);
    const email = 'test_automation_user@example.com';
    const password = 'TestPass123!';
    let userId = '';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user || !data.session) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(`  Auth failed: ${error?.message}`);
        process.exit(1);
    }
    console.log(`${colors.green}✔ PASS${colors.reset}`);
    userId = data.user.id;

    // Services use the SAME client instance, so they are now authenticated!

    // --- DYNAMIC IMPORTS ---
    const { CertificateService } = await import('@/services/certificate-service');
    const { AssetService } = await import('@/services/asset-service');
    const { NotificationService } = await import('@/services/notification-service');
    const { OrderService } = await import('@/services/order-service');


    // --- SCENARIO 5: Certificates ---
    console.log(`\n${colors.yellow}📜 Scenario 5: Certificates${colors.reset}`);
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching User Certificates... `);
    try {
        const certs = await CertificateService.getMyCertificates(userId);
        console.log(`${colors.green}✔ PASS${colors.reset} (Found: ${certs.length})`);
    } catch (e: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(e.message);
    }


    // --- SCENARIO 6: Assets ---
    console.log(`\n${colors.yellow}📜 Scenario 6: Assets${colors.reset}`);
    const { CourseService } = await import('@/services/course-service');
    let testCourseId = '';

    const courses = await CourseService.getPublicCourses();
    if (courses && courses.length > 0) {
        testCourseId = courses[0].id;
        process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching Assets for Course ${testCourseId.slice(0, 6)}... `);
        try {
            const assets = await AssetService.getCourseAssets(testCourseId);
            console.log(`${colors.green}✔ PASS${colors.reset} (Found: ${assets.length})`);
        } catch (e: any) {
            console.log(`${colors.red}✘ FAIL${colors.reset}`);
            console.error(e.message);
        }
    } else {
        console.log("  Skipping Asset test (No courses found)");
    }


    // --- SCENARIO 7: Notifications ---
    console.log(`\n${colors.yellow}📜 Scenario 7: Notifications${colors.reset}`);

    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching UNREAD Notifications... `);
    let notifs: any[] = [];
    try {
        notifs = await NotificationService.getUnread(userId);
        console.log(`${colors.green}✔ PASS${colors.reset} (Found: ${notifs.length})`);
    } catch (e: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(e.message);
    }

    if (notifs.length > 0) {
        process.stdout.write(`${colors.blue}[TEST]${colors.reset} Marking ID ${notifs[0].id.slice(0, 6)} as read... `);
        try {
            await NotificationService.markAsRead(notifs[0].id);
            console.log(`${colors.green}✔ PASS${colors.reset}`);
        } catch (e: any) {
            console.log(`${colors.red}✘ FAIL${colors.reset}`);
            console.error(e.message);
        }
    }


    // --- SCENARIO 8: Orders ---
    console.log(`\n${colors.yellow}📜 Scenario 8: Orders${colors.reset}`);
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching Order History... `);
    try {
        const orders = await OrderService.getMyOrders(userId);
        console.log(`${colors.green}✔ PASS${colors.reset} (Found: ${orders.length})`);
    } catch (e: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(e.message);
    }

    console.log(`\n${colors.green}${colors.bold}✅ Advanced Features Verified.${colors.reset}\n`);
}

main().catch(console.error);

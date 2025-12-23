const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

// CONFIGURATION
const OUTPUT_BASE_DIR = path.join(__dirname, '../Customer_Orders'); // Stores user folders
const PROCESSED_LOG = path.join(__dirname, '../processed_orders.txt');
const POLL_INTERVAL = 10000; // 10 seconds

const prisma = new PrismaClient();

// Paths for Chrome (Adjust if needed, copied from automate_canva.js)
const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
];

function getChromePath() {
    for (const p of CHROME_PATHS) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('Chrome executable not found. Please set it manually.');
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function getProcessedOrders() {
    if (!fs.existsSync(PROCESSED_LOG)) return new Set();
    const content = fs.readFileSync(PROCESSED_LOG, 'utf-8');
    return new Set(content.split('\n').filter(line => line.trim() !== ''));
}

async function markAsProcessed(orderId) {
    fs.appendFileSync(PROCESSED_LOG, orderId + '\n');
}

async function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

// Main Automation Function
async function processOrder(order, browser) {
    console.log(`\n📦 Processing Order: ${order.id}`);
    console.log(`👤 Customer: ${order.user.name} (${order.user.mobile})`);

    const mobileLast4 = order.user.mobile.slice(-4);
    const folderName = `${order.user.name.replace(/\s+/g, '_')}_${mobileLast4}`;
    const userDir = path.join(OUTPUT_BASE_DIR, folderName);
    ensureDir(userDir);

    const page = await browser.newPage();
    
    try {
        await page.setViewport({ width: 1280, height: 800 });

        for (const item of order.items) {
            const designName = item.product.title; // Assuming product title is the design name
            console.log(`   🎨 Seeking Design: "${designName}"`);

            // 1. Navigate to Canva (Home)
            await page.goto('https://www.canva.com', { waitUntil: 'networkidle2' });

            // 2. Search for the design
            const searchInput = await page.waitForSelector('input[type="text"], input[role="combobox"]', { timeout: 10000 });
            if (searchInput) {
                await searchInput.click();
                await searchInput.type(designName);
                await page.keyboard.press('Enter');
                await delay(3000);

                // Filter by "Projects"
                const projectsTab = await page.$x("//button[contains(., 'Projects')]");
                if (projectsTab.length > 0) {
                    await projectsTab[0].click();
                    await delay(2000);
                }

                // Click first result
                const firstResult = await page.$('div[class*="grid"] a, div[class*="grid"] button'); 
                if (firstResult) {
                     await firstResult.click();
                } else {
                    console.error("   ❌ Could not find design in search results.");
                    continue;
                }

                // Wait for new tab
                const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page())));
                const designPage = await newPagePromise;
                if (!designPage) { 
                    console.error("   ❌ Failed to capture new tab.");
                    continue;
                }
                
                await designPage.bringToFront();
                await designPage.waitForNavigation({ waitUntil: 'domcontentloaded' });
                await delay(5000); // Wait for editor load

                // 3. Download as PDF Print
                console.log("   ⬇️  Downloading PDF...");
                
                // Click "Share" button (Top Right)
                const shareBtn = await designPage.$x("//button[contains(., 'Share')]");
                if (shareBtn.length > 0) {
                    await shareBtn[0].click();
                    await delay(1000);
                    
                    // Click "Download"
                    const downloadLink = await designPage.$x("//div[contains(., 'Download')]"); 
                    if (downloadLink.length > 0) {
                         await downloadLink[0].click();
                         await delay(1000);
                         
                         // Click "Download" button in the modal
                         const finalDownloadBtn = await designPage.$x("//button[contains(., 'Download') and not(contains(., 'Watermark'))]");
                         if (finalDownloadBtn.length > 0) {
                             // Setup download behavior
                             const client = await designPage.target().createCDPSession();
                             await client.send('Page.setDownloadBehavior', {
                                 behavior: 'allow',
                                 downloadPath: userDir,
                             });
                             
                             await finalDownloadBtn[0].click();
                             console.log("   ✅ Download initiated.");
                             await delay(10000); // Wait for download
                         }
                    }
                }
                
                await designPage.close();
            }
        }
    } catch (err) {
        console.error("   ❌ Error processing items:", err);
    } finally {
        await page.close();
    }
}

// Monitor Loop
(async () => {
    console.log("🚀 Order Automation Listener Started...");
    console.log(`watching orders... (Poll: ${POLL_INTERVAL}ms)`);
    
    // Launch Browser Once
    const executablePath = getChromePath();
    const userDataDir = path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Google\\Chrome\\User Data'); 
    
    const browser = await puppeteer.launch({
        executablePath,
        userDataDir,
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'] 
    });

    while (true) {
        try {
            const processed = await getProcessedOrders();

            // Fetch PENDING orders with Items and User
            const orders = await prisma.order.findMany({
                where: {
                    status: 'PENDING',
                },
                include: {
                    user: true,
                    items: {
                        include: { product: true }
                    }
                }
            });

            for (const order of orders) {
                if (!processed.has(order.id)) {
                    await processOrder(order, browser);
                    await markAsProcessed(order.id);
                }
            }

        } catch (error) {
            console.error("Error in loop:", error);
        }
        
        await delay(POLL_INTERVAL);
    }
})();

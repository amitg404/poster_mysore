const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const readline = require('readline');

// CONFIGURATION
const BASE_DIR = __dirname;
const IMAGES_DIR = path.join(BASE_DIR, 'Canva_posters');
const OUTPUT_DIR = path.join(BASE_DIR, 'Ready_to_Upload');
const PROCESSED_LOG = path.join(BASE_DIR, 'processed_images.txt');

// Paths for Chrome (Adjust if needed)
const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.USERPROFILE, 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe')
];

function getChromePath() {
    for (const p of CHROME_PATHS) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('Chrome executable not found. Please set it manually in the script.');
}

async function getProcessedItems() {
    if (!fs.existsSync(PROCESSED_LOG)) return new Set();
    const content = fs.readFileSync(PROCESSED_LOG, 'utf-8');
    return new Set(content.split('\n').filter(line => line.trim() !== ''));
}

async function markAsProcessed(itemName) {
    fs.appendFileSync(PROCESSED_LOG, itemName + '\n');
}

async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

(async () => {
    try {
        console.log('Starting Canva Automation V2 (Bundles + Download)...');
        
        // 0. Ensure Output Dir
        if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

        // 1. Setup Browser
        const executablePath = getChromePath();
        // CHANGED: Use a local profile to avoid conflicts with your main open Chrome
        const userDataDir = path.join(BASE_DIR, 'chrome_profile');
        
        console.log(`Launching Chrome...`);
        console.log(`Using Local Profile: ${userDataDir}`);
        console.log('NOTE: First time run? You might need to log in to Canva manually.');

        const browser = await puppeteer.launch({
            executablePath,
            userDataDir,
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = (await browser.pages())[0]; 

        // 2. Scan Directory
        if (!fs.existsSync(IMAGES_DIR)) {
            console.error(`Images directory not found: ${IMAGES_DIR}`);
            process.exit(1);
        }

        const items = fs.readdirSync(IMAGES_DIR); 
        const processed = await getProcessedItems();

        console.log(`Found ${items.length} items to process.`);

         // --- LOGIN CHECK ---
         console.log("Checking Canva Login...");
         await page.goto('https://www.canva.com', { waitUntil: 'networkidle2' });
         
         try {
             // Check if "Create a design" button exists (Logged in)
             // Or check for "Log in" button (Not logged in)
             const loginBtn = await page.$x("//button[contains(., 'Log in') or contains(., 'Sign in')]");
             if (loginBtn.length > 0) {
                 console.log(">>> YOU ARE NOT LOGGED IN.");
                 console.log(">>> Please log in to Canva in the browser window manually.");
                 console.log(">>> The script will wait until it detects you are logged in...");
                 
                 // Wait loop
                 while (true) {
                     await delay(2000);
                     const createBtn = await page.$x("//button[contains(., 'Create a design')]");
                     if (createBtn.length > 0) {
                         console.log(">>> Login detected! Resuming...");
                         break;
                     }
                 }
             }
         } catch (e) {
             console.log("Login check warning:", e);
         }


        // 3. Main Loop
        for (const item of items) {
            const itemPath = path.join(IMAGES_DIR, item);
            const isDirectory = fs.statSync(itemPath).isDirectory();
            
            // Skip hidden files or system files
            if (item.startsWith('.')) continue;

            if (processed.has(item)) {
                console.log(`Skipping ${item} (already processed)`);
                continue;
            }

            console.log(`Processing: ${item} [${isDirectory ? 'BUNDLE' : 'SINGLE'}]`);
            
            // Collect images for this design
            let designImages = [];
            if (isDirectory) {
                // Bundle: Get all images in folder
                const files = fs.readdirSync(itemPath);
                designImages = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).map(f => path.join(itemPath, f));
                if (designImages.length === 0) {
                     console.log(`Empty bundle ${item}, skipping.`);
                     continue;
                }
            } else {
                // Single: Just this file
                if (!/\.(jpg|jpeg|png|webp)$/i.test(item)) continue;
                designImages = [itemPath];
            }

            // --- START DESIGN ---
            await page.goto('https://www.canva.com', { waitUntil: 'networkidle2' });

            // Create A3
            // Find "Create a design"
            await page.waitForSelector('button');
            const createDesignBtns = await page.$x("//button[contains(., 'Create a design')]");
            if (createDesignBtns.length > 0) {
                await createDesignBtns[0].click();
            } else {
                throw new Error("Could not find 'Create a design' button");
            }

            await delay(1000);
            await page.keyboard.type('A3 Document');
            await delay(1500); // Wait for results
            await page.keyboard.press('Enter');

            // Handle New Tab
            const newTarget = await browser.waitForTarget(target => target.opener() === page.target());
            const designPage = await newTarget.page();
            await designPage.bringToFront();
            await designPage.waitForNavigation({ waitUntil: 'domcontentloaded' });
            await delay(3000);

            // Rename Design
            const cleanName = item; // Folder name or Filename
            // Try renaming via title input
            const titleInput = await designPage.$('input[value*="Untitled"]'); 
            if (titleInput) {
                 await titleInput.click({ clickCount: 3 });
                 await titleInput.type(cleanName);
                 await designPage.keyboard.press('Enter');
            } else {
                // Fallback: aria-label
                 const titleField = await designPage.$('input[aria-label="Design title"]');
                 if (titleField) {
                    await titleField.click({ clickCount: 3 });
                    await titleField.type(cleanName);
                    await designPage.keyboard.press('Enter');
                 }
            }

            // --- LOOP THROUGH PAGES ---
            for (let i = 0; i < designImages.length; i++) {
                const imgPath = designImages[i];
                console.log(`  -> Adding image: ${path.basename(imgPath)}`);

                // If not first page, add new page
                if (i > 0) {
                    const addPageBtn = await designPage.$x("//button[contains(., 'Add page')]");
                    if (addPageBtn.length > 0) {
                        await addPageBtn[0].click();
                        await delay(500);
                    }
                }

                // Upload
                // Click Uploads tab
                const uploadsTab = await designPage.$x("//p[contains(., 'Uploads')]"); 
                if (uploadsTab.length > 0) await uploadsTab[0].click();
                await delay(500);

                // File Chooser
                const [fileChooser] = await Promise.all([
                    designPage.waitForFileChooser(),
                    designPage.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        const uploadBtn = buttons.find(b => b.textContent.includes('Upload files'));
                        if (uploadBtn) uploadBtn.click();
                        return !!uploadBtn;
                    })
                ]);
                
                if (fileChooser) {
                    await fileChooser.accept([imgPath]);
                    // Enhanced Wait: Wait for the specific image "uploading" state to finish is hard.
                    // We just wait a generous amount.
                    await delay(4000); 
                }

                // Add to Canvas (Click most recent image)
                // Sidebar images usually top left.
                // Try selecting via generic img selector in sidebar container.
                const sidebarImages = await designPage.$$('div[class*="scrollList"] img, div[role="tabpanel"] img');
                if (sidebarImages.length > 0) {
                    await sidebarImages[0].click();
                }
                
                await delay(1000);

                // FIT TO PAGE (The "Set as background" trick)
                // Right click the image on canvas.
                // The image on canvas is likely the only selected element.
                // We click the center of the canvas to ensure focus? 
                // Or just right click the currently verified selection.
                
                // Clicking center of canvas
                const canvas = await designPage.$('div[data-testid="canvas-container"]'); // Helper
                if (canvas) {
                     // Not ideal. Let's try Context Menu.
                     // Assuming the image is selected after clicking sidebar.
                     // Right click:
                     const selectionBox = await designPage.$('div[data-testid="selection-box"]'); // Often exists for selected item
                     // If not, we just guess coordinates.
                     await designPage.mouse.click(500, 500, { button: 'right' }); 
                     await delay(500);
                     
                     // Look for "Set image as background"
                     const menuItems = await designPage.$x("//div[contains(., 'Set image as background')]");
                     if (menuItems.length > 0) {
                         await menuItems[0].click();
                     } else {
                         console.log("  Could not find 'Set image as background'. Resizing might be needed manually.");
                     }
                }
                
                await delay(1000);
            }

            // --- REVIEW ---
            console.log('>>> PAUSING FOR REVIEW. Check the design in Chrome.');
            await askQuestion('Press ENTER in this terminal when verified and ready to download...');

            // --- DOWNLOAD ---
            console.log('Starting Download...');
            
            // Click Share
            const shareBtn = await designPage.$x("//button[contains(., 'Share')]");
            if (shareBtn.length > 0) await shareBtn[0].click();
            await delay(1000);

            // Click Download (in Share menu)
            const downloadLink = await designPage.$x("//button[contains(., 'Download')]"); // Sometimes it's a link or button
            if (downloadLink.length > 0) {
                await downloadLink[0].click();
            } else {
                // Sometimes it's nested
                const downloadText = await designPage.$x("//p[contains(., 'Download')]");
                if (downloadText.length > 0) await downloadText[0].click();
            }
            await delay(1000);

            // Select PDF Print
            // Dropdown usually shows 'PNG' or 'PDF Standard'.
            // Finding the dropdown:
            const fileTypeDropdown = await designPage.$('div[aria-haspopup="listbox"]'); 
            if (fileTypeDropdown) {
                await fileTypeDropdown.click();
                await delay(500);
                const pdfPrintOption = await designPage.$x("//div[contains(., 'PDF Print')]");
                if (pdfPrintOption.length > 0) await pdfPrintOption[0].click();
            }

            await delay(500);
            // Click Final Download Button
            const finalDownloadBtn = await designPage.$x("//button[contains(., 'Download') and not(contains(., 'Share'))]"); 
            // The one inside the modal
            if (finalDownloadBtn.length > 0) {
                // Set download behavior to save to specific folder? 
                // Puppeteer allows setting download path.
                const client = await designPage.target().createCDPSession();
                await client.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: OUTPUT_DIR,
                });
                
                await finalDownloadBtn[0].click();
                console.log('Downloading...');
                // Wait for download to finish? 
                // We can watch the file system.
                await delay(10000); // Wait for heavy PDF generation
            }

            console.log(`Finished ${item}`);
            await designPage.close();
            await markAsProcessed(item);
            
            await page.bringToFront();
        }

        console.log('All done!');
        await browser.close();

    } catch (error) {
        console.error('Fatal Error:', error);
    }
})();

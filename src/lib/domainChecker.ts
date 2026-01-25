import puppeteer, { type Browser, type Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Helper function for delays (Puppeteer doesn't have waitForTimeout on Page)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface DomainResult {
  domain: string;
  available: boolean;
  price?: string;
  status: "available" | "taken" | "premium" | "error";
  error?: string;
}

export class NamecheapBeastModeChecker {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // Run with visible browser
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      defaultViewport: {
        width: 1280,
        height: 800,
      },
    });
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(90000);

    await this.page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
  }

  async checkDomains(domains: string[]): Promise<DomainResult[]> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    const results: DomainResult[] = [];

    try {
      console.log("Navigating to Beast Mode...");
      await this.page.goto(
        "https://www.namecheap.com/domains/registration/results/?type=beast&domain=",
        {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        }
      );

      await delay(5000);

      const batchSize = 1000; // Namecheap Beast Mode supports up to 1000 domains
      for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize);
        console.log(
          `Checking batch ${i / batchSize + 1}: ${batch.length} domains`
        );
        const batchResults = await this.checkBatch(batch);
        results.push(...batchResults);

        if (i + batchSize < domains.length) {
          await delay(3000);
        }
      }

      return results;
    } catch (error) {
      console.error("Error checking domains:", error);
      throw error;
    }
  }

  private async checkBatch(domains: string[]): Promise<DomainResult[]> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    const results: DomainResult[] = [];

    try {
      // Create a temporary CSV file with domains
      console.log("Creating CSV file for upload...");
      const tmpDir = os.tmpdir();
      const csvPath = path.join(tmpDir, `domains-${Date.now()}.csv`);
      const csvContent = domains.join("\n");
      fs.writeFileSync(csvPath, csvContent);
      console.log(`✓ Created CSV file: ${csvPath}`);

      // Click "Import CSV file" button
      console.log("Clicking Import CSV file button...");
      try {
        // Use XPath or evaluate to find button by text in Puppeteer
        await this.page.waitForFunction(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(b => b.textContent?.includes('Import CSV file'));
        }, { timeout: 5000 });
        
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const importBtn = buttons.find(b => b.textContent?.includes('Import CSV file'));
          if (importBtn) {
            (importBtn as HTMLButtonElement).click();
          }
        });
        console.log("✓ Import CSV dialog opened");
        await delay(1500);
      } catch (e) {
        throw new Error("Failed to open Import CSV dialog: " + e);
      }

      // Upload file using Puppeteer's file input handling
      console.log("Uploading CSV file with Puppeteer...");
      try {
        // Find the file input element
        const fileInputSelector = 'input[type="file"]';
        await this.page.waitForSelector(fileInputSelector, { timeout: 5000 });
        
        console.log("✓ Found file input, uploading file...");
        
        // Upload file using Puppeteer's uploadFile method
        const fileInput = await this.page.$(fileInputSelector);
        if (!fileInput) {
          throw new Error("File input element not found");
        }
        
        await fileInput.uploadFile(csvPath);
        console.log("✓ File uploaded successfully");
        
        // Wait a bit for the file to be processed
        await delay(1000);
        
        // Debug: Check file input state
        const fileInputDebug = await this.page.evaluate(() => {
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          return {
            hasFiles: input?.files?.length ?? 0,
            fileName: input?.files?.[0]?.name ?? 'none',
            fileSize: input?.files?.[0]?.size ?? 0,
          };
        });
        console.log(`📋 File input debug:`, fileInputDebug);
        
        // Check Import button state (look for button with EXACTLY "Import", not "Import CSV file")
        const buttonDebug = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          // Find all buttons with Import text
          const importButtons = buttons.filter(b => b.textContent?.includes('Import'));
          const importDialogBtn = buttons.find(b => {
            const text = b.textContent?.trim() || '';
            // Match "Import" exactly or with whitespace, but NOT "Import CSV file"
            return text === 'Import' || (text.includes('Import') && !text.includes('CSV') && !text.includes('file'));
          });
          
          return {
            allImportButtons: importButtons.map(b => ({
              text: b.textContent?.trim(),
              disabled: (b as HTMLButtonElement).disabled
            })),
            dialogButtonFound: !!importDialogBtn,
            dialogButtonDisabled: importDialogBtn ? (importDialogBtn as HTMLButtonElement).disabled : null,
            dialogButtonText: importDialogBtn?.textContent?.trim() ?? null,
          };
        });
        console.log(`🔘 Import button debug:`, buttonDebug);
        
        // Wait for Import button (inside dialog) to become enabled
        console.log("Waiting for Import button (in dialog) to be enabled...");
        try {
          await this.page.waitForFunction(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            // Find the Import button in dialog (not "Import CSV file")
            const importBtn = buttons.find(b => {
              const text = b.textContent?.trim() || '';
              return text === 'Import' || (text.includes('Import') && !text.includes('CSV') && !text.includes('file'));
            });
            return importBtn && !(importBtn as HTMLButtonElement).disabled;
          }, { timeout: 10000 });
          console.log("✓ Import button (in dialog) is now enabled");
        } catch (e) {
          console.log("⚠️ Import button still disabled, trying to click anyway...");
        }
        
        // Click "Import" button in the dialog (NOT "Import CSV file")
        console.log("Clicking Import button (in dialog)...");
        try {
          const clicked = await this.page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            // Find the Import button in dialog (not "Import CSV file")
            const importBtn = buttons.find(b => {
              const text = b.textContent?.trim() || '';
              return text === 'Import' || (text.includes('Import') && !text.includes('CSV') && !text.includes('file'));
            });
            
            if (importBtn) {
              console.log('Found Import button in dialog:', importBtn.textContent);
              (importBtn as HTMLButtonElement).click();
              return true;
            }
            return false;
          });
          
          if (clicked) {
            console.log("✓ Import button (in dialog) clicked");
          } else {
            throw new Error('Import button not found in dialog');
          }
        } catch (e) {
          throw new Error("Failed to click Import button: " + e);
        }
        
        // Wait for the dialog to close and domains to be added
        console.log("Waiting for import to complete...");
        await delay(3000);
        
        // Verify domains were added by checking for domain buttons
        const domainButtonsCount = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.filter(b => {
            const text = b.textContent || '';
            return text.includes('.com') || text.includes('.net') || text.includes('.org');
          }).length;
        });
        console.log(`✓ Found ${domainButtonsCount} domain buttons after import`);
        
        if (domainButtonsCount === 0) {
          console.log("⚠️ Warning: No domain buttons found after import!");
          
          // Check if dialog is still open (import might have failed)
          const dialogStillOpen = await this.page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('*'));
            return headings.some(el => el.textContent?.includes('Import a CSV file'));
          });
          if (dialogStillOpen) {
            throw new Error("Import dialog still open - import may have failed");
          }
        }
      } catch (e) {
        console.error("Error during CSV upload:", e);
        throw new Error("CSV upload failed: " + (e instanceof Error ? e.message : String(e)));
      }

      // Clean up temporary file
      fs.unlinkSync(csvPath);
      console.log("✓ CSV file uploaded and cleaned up");

      // Click Generate button
      console.log("Clicking Generate button...");
      const generateBtnFound = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const generateBtn = buttons.find(b => b.textContent?.includes('Generate'));
        if (generateBtn) {
          (generateBtn as HTMLButtonElement).click();
          return true;
        }
        return false;
      });
      
      if (!generateBtnFound) {
        throw new Error("Generate button not found");
      }

      // Wait for results to load
      console.log("Waiting for results to load...");
      console.log(
        "⏳ This may take 10-20 seconds for Beast Mode to process domains..."
      );

      // Wait for the page to finish loading results
      await delay(10000); // Initial wait

      // Check for error messages
      const errorMsg = await this.page.$(".results-beast__error");
      if (errorMsg) {
        const errorText = await errorMsg.evaluate((el) => el.textContent);
        console.log("⚠️ Beast Mode error:", errorText);
      }

      // Wait for either results or error state
      try {
        await Promise.race([
          this.page.waitForSelector("article:not(.domain-empty)", {
            timeout: 30000,
          }),
          this.page.waitForSelector(".results-beast__error", {
            timeout: 30000,
          }),
        ]);
      } catch (e) {
        console.log("⚠️ Timeout waiting for results");
      }

      // Additional wait for dynamic content
      await delay(3000);

      // Debug: Check page state
      const pageContent = await this.page.content();
      const hasResults =
        pageContent.includes("Add to Cart") ||
        pageContent.includes("add to cart");
      const hasError =
        pageContent.includes("Unsupported TLD") ||
        pageContent.includes("No available");
      console.log(`📊 Has results: ${hasResults}, Has error: ${hasError}`);

      // Parse results
      console.log("Parsing results...");
      for (const domain of domains) {
        try {
          const result = await this.parseDomainResult(domain);
          results.push(result);
        } catch (error) {
          results.push({
            domain,
            available: false,
            status: "error",
            error: error instanceof Error ? error.message : "Failed to parse",
          });
        }
      }

      // Reset for next batch
      const resetClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const resetBtn = buttons.find(b => b.textContent?.includes('Reset'));
        if (resetBtn) {
          (resetBtn as HTMLButtonElement).click();
          return true;
        }
        return false;
      });
      
      if (resetClicked) {
        await delay(2000);
      }
    } catch (error) {
      console.error("Error in checkBatch:", error);

      for (const domain of domains) {
        results.push({
          domain,
          available: false,
          status: "error",
          error: error instanceof Error ? error.message : "Batch error",
        });
      }
    }

    return results;
  }

  private async parseDomainResult(domain: string): Promise<DomainResult> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    console.log(`🔍 Parsing result for: ${domain}`);

    // Get all articles
    const articles = await this.page.$$("article");
    console.log(`  Found ${articles.length} article elements`);

    // Normalize domain for comparison (lowercase)
    const domainLower = domain.toLowerCase();

    // Check each article
    for (const article of articles) {
      // First check the H2 heading for the domain name
      const h2Element = await article.$("h2");
      if (h2Element) {
        const h2Text = await h2Element.evaluate((el) => el.textContent);
        const h2TextLower = h2Text?.toLowerCase() || "";

        // Check if this article is for our domain (case-insensitive)
        if (h2TextLower === domainLower) {
          console.log(`  ✓ Found domain in article (via h2 heading)`);

          const text = await article.evaluate((el) => el.textContent);
          const textLower = text?.toLowerCase() || "";

          // Method 1: Check for "Add to cart" text in article (means available)
          if (textLower.includes("add to cart")) {
            console.log(`  ✓ Available - has "Add to cart" button`);

            // Extract price - look for €XX.XX pattern
            const priceMatch = text?.match(/€([\d,]+\.?\d*)/);
            const price = priceMatch ? `€${priceMatch[1]}` : undefined;
            console.log(`  Price: ${price || "not found"}`);

            const priceValue = price
              ? parseFloat(price.replace("€", "").replace(",", ""))
              : 0;

            return {
              domain,
              available: true,
              price,
              status: priceValue > 100 ? "premium" : "available",
            };
          }

          // Method 2: Check for taken/unavailable indicators
          if (
            textLower.includes("taken") ||
            textLower.includes("make offer") ||
            textLower.includes("unavailable") ||
            textLower.includes("registered") ||
            textLower.includes("not available")
          ) {
            console.log(`  ✗ Taken - domain already registered`);
            return {
              domain,
              available: false,
              status: "taken",
            };
          }

          // Method 3: If article has price but no "add to cart", might be premium/special
          const priceMatch = text?.match(/€([\d,]+\.?\d*)/);
          if (priceMatch) {
            const price = `€${priceMatch[1]}`;
            const priceValue = parseFloat(
              price.replace("€", "").replace(",", "")
            );

            console.log(
              `  ⚠️ Has price (${price}) but no clear status - assuming available`
            );

            return {
              domain,
              available: true,
              price,
              status: priceValue > 100 ? "premium" : "available",
            };
          }

          // Found domain but unclear status
          console.log(`  ⚠️ Found but unclear status`);
          console.log(`  Article text: ${text?.substring(0, 200)}`);
        }
      }
    }

    console.log(`  ❌ Domain not found in results`);
    return {
      domain,
      available: false,
      status: "error",
      error: "Domain not found in Beast Mode results",
    };
  }

  async close() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

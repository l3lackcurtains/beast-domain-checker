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
  private logCallback: ((message: string, type?: string) => void) | null = null;

  setLogCallback(callback: (message: string, type?: string) => void) {
    this.logCallback = callback;
  }

  private log(message: string, type: string = 'info') {
    // Only log to console if no callback is set (CLI mode)
    if (!this.logCallback) {
      console.log(message);
    } else {
      // Send to callback (web mode)
      this.logCallback(message, type);
    }
  }

  private async switchToUSD(): Promise<void> {
    if (!this.page) return;

    try {
      // Check current currency using the dropdown toggle
      const currentCurrency = await this.page.evaluate(() => {
        const toggle = document.querySelector('.gb-dropdown--currency .gb-dropdown__toggle');
        return toggle?.textContent?.trim() || '';
      });

      // If already USD, skip
      if (currentCurrency.includes('$') && currentCurrency.includes('USD')) {
        this.log('✓ Currency already set to USD', 'success');
        return;
      }

      this.log('💱 Switching currency to USD...', 'info');

      // Click the currency dropdown toggle to open it
      await this.page.evaluate(() => {
        const toggle = document.querySelector('.gb-dropdown--currency .gb-dropdown__toggle') as HTMLElement;
        if (toggle) toggle.click();
      });

      await delay(500);

      // Click the USD option using data-ncid attribute
      const switched = await this.page.evaluate(() => {
        const usdOption = document.querySelector('[data-ncid="currency-USD"]') as HTMLElement;
        if (usdOption) {
          usdOption.click();
          return true;
        }
        return false;
      });

      if (switched) {
        await delay(2000); // Wait for page to update with new currency
        this.log('✓ Currency switched to USD', 'success');
      } else {
        this.log('⚠ Could not switch to USD, continuing with current currency', 'info');
      }
    } catch (e) {
      this.log(`⚠ Currency switch failed: ${e}`, 'info');
    }
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
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
      this.log("🌐 Establishing secure connection to Namecheap Beast Mode...", 'system');
      await this.page.goto(
        "https://www.namecheap.com/domains/registration/results/?type=beast&domain=",
        {
          waitUntil: "domcontentloaded",
          timeout: 90000,
        }
      );

      await delay(5000);
      this.log("✓ Connection established. Interface ready.", 'success');

      // Switch to USD currency if not already selected
      await this.switchToUSD();

      const batchSize = 1000; // Namecheap Beast Mode supports up to 1000 domains
      for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize);
        this.log(
          `⚡ Initiating scan protocol: ${batch.length} domains queued`,
          'info'
        );
        const batchResults = await this.checkBatch(batch);
        results.push(...batchResults);

        if (i + batchSize < domains.length) {
          await delay(3000);
        }
      }

      return results;
    } catch (error) {
      this.log(`✗ Error checking domains: ${error}`, 'error');
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
      const tmpDir = os.tmpdir();
      const csvPath = path.join(tmpDir, `domains-${Date.now()}.csv`);
      const csvContent = domains.join("\n");
      fs.writeFileSync(csvPath, csvContent);
      this.log(`📝 Generated payload file: ${domains.length} targets`, 'info');

      // Click "Import CSV file" button
      try {
        this.log('🎯 Locating import interface...', 'info');
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
        await delay(1500);
        this.log('✓ Import dialog intercepted', 'success');
      } catch (e) {
        throw new Error("Failed to open Import CSV dialog: " + e);
      }

      // Upload file using Puppeteer's file input handling
      try {
        this.log('⬆️ Uploading payload to Beast Mode servers...', 'info');
        const fileInputSelector = 'input[type="file"]';
        await this.page.waitForSelector(fileInputSelector, { timeout: 5000 });
        
        const fileInput = await this.page.$(fileInputSelector);
        if (!fileInput) {
          throw new Error("File input element not found");
        }
        
        await fileInput.uploadFile(csvPath);
        await delay(1000);
        this.log('✓ Upload complete. Verifying data integrity...', 'success');
        
        // Wait for Import button (inside dialog) to become enabled
        await this.page.waitForFunction(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const importBtn = buttons.find(b => {
            const text = b.textContent?.trim() || '';
            return text === 'Import' || (text.includes('Import') && !text.includes('CSV') && !text.includes('file'));
          });
          return importBtn && !(importBtn as HTMLButtonElement).disabled;
        }, { timeout: 10000 });
        
        // Click "Import" button in the dialog
        const clicked = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const importBtn = buttons.find(b => {
            const text = b.textContent?.trim() || '';
            return text === 'Import' || (text.includes('Import') && !text.includes('CSV') && !text.includes('file'));
          });
          
          if (importBtn) {
            (importBtn as HTMLButtonElement).click();
            return true;
          }
          return false;
        });
        
        if (!clicked) {
          throw new Error('Import button not found in dialog');
        }
        
        await delay(3000);
        
        this.log('🔎 Verifying injection success...', 'info');
        // Verify domains were added
        const domainButtonsCount = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.filter(b => {
            const text = b.textContent || '';
            return text.includes('.com') || text.includes('.net') || text.includes('.org');
          }).length;
        });
        
        if (domainButtonsCount === 0) {
          const dialogStillOpen = await this.page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll('*'));
            return headings.some(el => el.textContent?.includes('Import a CSV file'));
          });
          if (dialogStillOpen) {
            throw new Error("Import dialog still open - import may have failed");
          }
        }
        
        this.log(`✓ Injection verified: ${domains.length} domains loaded into system`, 'success');
      } catch (e) {
        throw new Error("CSV upload failed: " + (e instanceof Error ? e.message : String(e)));
      }

      // Clean up temporary file
      fs.unlinkSync(csvPath);

      // Click Generate button
      this.log('⚡ Triggering Beast Mode execution...', 'info');
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

      this.log("⚙️ Injection complete. Executing Beast Mode protocol...", 'system');
      this.log("🔍 Scanning WHOIS database across global registrars...", 'info');

      // Wait for button area loading indicators to disappear
      await this.page.waitForFunction(() => {
        const buttons = document.querySelectorAll('button');
        const loadingButtons = Array.from(buttons).filter(btn => {
          const classList = btn.classList;
          const text = btn.textContent || '';
          const hasLoadingClass = Array.from(classList).some(c => 
            c.includes('loading') || c.includes('spinner') || c.includes('disabled')
          );
          const hasLoadingText = text.includes('...') || text.includes('Loading') || text.includes('Processing');
          const hasSpinner = btn.querySelector('[class*="loading"], [class*="spinner"], svg[class*="animate"]');
          return hasLoadingClass || hasLoadingText || hasSpinner;
        });
        const loadingOverlays = document.querySelectorAll('[class*="overlay"], [class*="mask"], [class*="backdrop"]');
        const visibleOverlays = Array.from(loadingOverlays).filter(overlay => {
          const style = window.getComputedStyle(overlay as HTMLElement);
          return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });
        return loadingButtons.length === 0 && visibleOverlays.length === 0;
      }, { timeout: 60000, polling: 500 });

      // Wait for domain results to appear
      await Promise.race([
        this.page.waitForSelector("article:not(.domain-empty)", { timeout: 30000 }),
        this.page.waitForSelector(".results-beast__error", { timeout: 30000 }),
      ]).catch(() => {});

      // Wait for all domain cards to finish loading (using strong selectors)
      await this.page.waitForFunction(() => {
        // Check for loaded articles (not empty placeholders)
        const loadedArticles = document.querySelectorAll('article:not(.domain-empty)');
        if (loadedArticles.length === 0) return false;
        
        // Check if articles have finished loading content
        const stillLoading = Array.from(loadedArticles).filter(article => {
          const hasSkeleton = article.querySelector('[class*="skeleton"], [class*="placeholder"]');
          const hasSpinner = article.querySelector('[class*="loading"], [class*="spinner"]');
          const hasDomainName = article.querySelector('h2');
          // Check for price element (new selector: .price strong, old: .gb-label--price) or status indicators
          const hasPriceElement = article.querySelector('.price strong') || article.querySelector('.gb-label--price');
          const hasStatusContent = article.textContent && (
            article.textContent.includes('Add to cart') ||
            article.textContent.includes('TAKEN') ||
            article.textContent.includes('Make offer') ||
            article.textContent.includes('$') ||
            article.textContent.includes('€') ||
            article.textContent.includes('£')
          );
          return hasSkeleton || hasSpinner || !hasDomainName || (!hasPriceElement && !hasStatusContent);
        });
        return stillLoading.length === 0;
      }, { timeout: 60000, polling: 1000 }).catch(() => {});

      await delay(2000);
      
      this.log(`🔬 Extracting data from ${domains.length} entries...`, 'info');
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
      
      // Log summary
      const summary = {
        available: results.filter(r => r.status === "available").length,
        premium: results.filter(r => r.status === "premium").length,
        taken: results.filter(r => r.status === "taken").length,
        error: results.filter(r => r.status === "error").length,
      };
      this.log(`✓ Scan complete: ${summary.available} available, ${summary.premium} premium, ${summary.taken} taken`, 'success');

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

    // Use strong selectors: article:not(.domain-empty) for loaded results
    const articles = await this.page.$$("article:not(.domain-empty)");
    const domainLower = domain.toLowerCase();

    for (const article of articles) {
      const h2Element = await article.$("h2");
      if (h2Element) {
        const h2Text = await h2Element.evaluate((el) => el.textContent);
        const h2TextLower = h2Text?.toLowerCase() || "";

        if (h2TextLower === domainLower) {
          const text = await article.evaluate((el) => el.textContent);
          const textLower = text?.toLowerCase() || "";

          // First check for taken/unavailable (priority check)
          if (
            textLower.includes("taken") ||
            textLower.includes("make offer") ||
            textLower.includes("unavailable") ||
            textLower.includes("registered") ||
            textLower.includes("not available")
          ) {
            return {
              domain,
              available: false,
              status: "taken",
            };
          }

          // Try to extract price using the .price strong selector (primary location)
          let price: string | undefined;
          const priceStrong = await article.$('.price strong');
          if (priceStrong) {
            const priceText = await priceStrong.evaluate((el) => el.textContent);
            if (priceText) {
              // Extract price with currency symbol (format: $12.98/yr)
              const priceMatch = priceText.match(/([$€£])\s*([\d,]+\.?\d*)/);
              if (priceMatch) {
                price = `${priceMatch[1]}${priceMatch[2]}`;
              }
            }
          }

          // Fallback: try .gb-label--price (older interface version)
          if (!price) {
            const priceElement = await article.$('.gb-label--price');
            if (priceElement) {
              const priceText = await priceElement.evaluate((el) => el.textContent);
              if (priceText) {
                const priceMatch = priceText.match(/([$€£])\s*([\d,]+\.?\d*)/);
                if (priceMatch) {
                  price = `${priceMatch[1]}${priceMatch[2]}`;
                }
              }
            }
          }

          // Last fallback: try to extract price from full text content
          if (!price) {
            const priceMatch = text?.match(/([$€£])\s*([\d,]+\.?\d*)/);
            if (priceMatch) {
              price = `${priceMatch[1]}${priceMatch[2]}`;
            }
          }

          // Check for "Add to cart" (available)
          if (textLower.includes("add to cart")) {
            const priceValue = price
              ? parseFloat(price.replace(/[$€£,\s]/g, ""))
              : 0;

            return {
              domain,
              available: true,
              price,
              status: priceValue > 100 ? "premium" : "available",
            };
          }

          // Has price but no explicit "add to cart" button (still available)
          if (price) {
            const priceValue = parseFloat(price.replace(/[$€£,\s]/g, ""));

            return {
              domain,
              available: true,
              price,
              status: priceValue > 100 ? "premium" : "available",
            };
          }
        }
      }
    }

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

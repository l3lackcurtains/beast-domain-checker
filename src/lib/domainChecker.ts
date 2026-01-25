import { chromium, type Browser, type Page } from 'playwright';

export interface DomainResult {
  domain: string;
  available: boolean;
  price?: string;
  status: 'available' | 'taken' | 'premium' | 'error';
  error?: string;
}

export class NamecheapBeastModeChecker {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    this.browser = await chromium.launch({ 
      headless: true, // Run in background (headless mode)
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    this.page = await this.browser.newPage();
    this.page.setDefaultTimeout(90000);
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
  }

  async checkDomains(domains: string[]): Promise<DomainResult[]> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const results: DomainResult[] = [];

    try {
      console.log('Navigating to Beast Mode...');
      await this.page.goto('https://www.namecheap.com/domains/registration/results/?type=beast&domain=', {
        waitUntil: 'domcontentloaded',
        timeout: 90000
      });
      
      await this.page.waitForTimeout(5000);

      const batchSize = 1000; // Namecheap Beast Mode supports up to 1000 domains
      for (let i = 0; i < domains.length; i += batchSize) {
        const batch = domains.slice(i, i + batchSize);
        console.log(`Checking batch ${i / batchSize + 1}: ${batch.length} domains`);
        const batchResults = await this.checkBatch(batch);
        results.push(...batchResults);

        if (i + batchSize < domains.length) {
          await this.page.waitForTimeout(3000);
        }
      }

      return results;
    } catch (error) {
      console.error('Error checking domains:', error);
      throw error;
    }
  }

  private async checkBatch(domains: string[]): Promise<DomainResult[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const results: DomainResult[] = [];

    try {
      // Find textarea
      console.log('Finding textarea...');
      const textarea = await this.page.$('textarea[placeholder*="Enter up to"]');
      
      if (!textarea) {
        throw new Error('Textarea not found');
      }

      // Clear textarea first
      await textarea.click({ clickCount: 3 }); // Select all
      await this.page.keyboard.press('Backspace');
      await this.page.waitForTimeout(500);

      // Fill domains one by one
      console.log('Filling domains:', domains.join(', '));
      const domainText = domains.join('\n');
      
      // Method 1: Try using keyboard.type (simulates real typing)
      await textarea.click();
      await this.page.keyboard.type(domainText, { delay: 50 });
      await this.page.waitForTimeout(1000);
      
      // Verify the content was entered
      const enteredText = await textarea.inputValue();
      console.log(`✓ Entered ${enteredText.split('\n').length} lines into textarea`);
      console.log(`First 100 chars: ${enteredText.substring(0, 100)}`);

      // Click Generate
      console.log('Clicking Generate button...');
      const generateBtn = await this.page.$('button:has-text("Generate")');
      if (!generateBtn) {
        throw new Error('Generate button not found');
      }
      
      await generateBtn.click();

      // Wait for results to load
      console.log('Waiting for results to load...');
      console.log('⏳ This may take 10-20 seconds for Beast Mode to process domains...');
      
      // Wait for the page to finish loading results
      await this.page.waitForTimeout(10000); // Initial wait
      
      // Check for error messages
      const errorMsg = await this.page.$('.results-beast__error');
      if (errorMsg) {
        const errorText = await errorMsg.textContent();
        console.log('⚠️ Beast Mode error:', errorText);
      }
      
      // Wait for either results or error state
      try {
        await Promise.race([
          this.page.waitForSelector('article:not(.domain-empty)', { timeout: 30000 }),
          this.page.waitForSelector('.results-beast__error', { timeout: 30000 })
        ]);
      } catch (e) {
        console.log('⚠️ Timeout waiting for results');
      }

      // Additional wait for dynamic content
      await this.page.waitForTimeout(3000);
      
      // Debug: Check page state
      const pageContent = await this.page.content();
      const hasResults = pageContent.includes('Add to Cart') || pageContent.includes('add to cart');
      const hasError = pageContent.includes('Unsupported TLD') || pageContent.includes('No available');
      console.log(`📊 Has results: ${hasResults}, Has error: ${hasError}`);

      // Parse results
      console.log('Parsing results...');
      for (const domain of domains) {
        try {
          const result = await this.parseDomainResult(domain);
          results.push(result);
        } catch (error) {
          results.push({
            domain,
            available: false,
            status: 'error',
            error: error instanceof Error ? error.message : 'Failed to parse'
          });
        }
      }

      // Reset for next batch
      const resetBtn = await this.page.$('button:has-text("Reset")');
      if (resetBtn) {
        await resetBtn.click();
        await this.page.waitForTimeout(2000);
      }

    } catch (error) {
      console.error('Error in checkBatch:', error);
      
      for (const domain of domains) {
        results.push({
          domain,
          available: false,
          status: 'error',
          error: error instanceof Error ? error.message : 'Batch error'
        });
      }
    }

    return results;
  }

  private async parseDomainResult(domain: string): Promise<DomainResult> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    console.log(`🔍 Parsing result for: ${domain}`);

    // Get all articles
    const articles = await this.page.$$('article');
    console.log(`  Found ${articles.length} article elements`);
    
    // Check each article
    for (const article of articles) {
      const text = await article.textContent();
      const className = await article.getAttribute('class');
      
      // Skip empty placeholder articles
      if (className?.includes('domain-empty')) {
        continue;
      }
      
      if (text && text.includes(domain)) {
        console.log(`  ✓ Found domain in article`);
        
        const textLower = text.toLowerCase();
        
        // Method 1: Check for "Add to cart" text in article (means available)
        if (textLower.includes('add to cart')) {
          console.log(`  ✓ Available - has "Add to cart" text`);
          
          // Extract price - look for €XX.XX pattern
          const priceMatch = text.match(/€([\d,]+\.?\d*)/);
          const price = priceMatch ? `€${priceMatch[1]}` : undefined;
          console.log(`  Price: ${price || 'not found'}`);
          
          const priceValue = price ? parseFloat(price.replace('€', '').replace(',', '')) : 0;
          
          return {
            domain,
            available: true,
            price,
            status: priceValue > 100 ? 'premium' : 'available'
          };
        }
        
        // Method 2: Check for taken/unavailable indicators
        if (textLower.includes('taken') || 
            textLower.includes('unavailable') || 
            textLower.includes('registered') ||
            textLower.includes('not available')) {
          console.log(`  ✗ Taken`);
          return {
            domain,
            available: false,
            status: 'taken'
          };
        }
        
        // Method 3: If article has price but no "add to cart", might be premium/special
        const priceMatch = text.match(/€([\d,]+\.?\d*)/);
        if (priceMatch) {
          const price = `€${priceMatch[1]}`;
          const priceValue = parseFloat(price.replace('€', '').replace(',', ''));
          
          console.log(`  ⚠️ Has price (${price}) but no clear status - assuming available`);
          
          return {
            domain,
            available: true,
            price,
            status: priceValue > 100 ? 'premium' : 'available'
          };
        }
        
        // Found domain but unclear status
        console.log(`  ⚠️ Found but unclear status`);
        console.log(`  Article text: ${text.substring(0, 200)}`);
      }
    }

    // Method 3: Check entire page content as fallback
    const pageText = await this.page.textContent('body');
    if (pageText && pageText.includes(domain)) {
      console.log(`  ⚠️ Domain found in page but not in articles`);
      
      // Check if anywhere on page it says taken/unavailable
      const pageLower = pageText.toLowerCase();
      const domainIndex = pageLower.indexOf(domain.toLowerCase());
      const surrounding = pageLower.substring(Math.max(0, domainIndex - 100), domainIndex + 200);
      
      if (surrounding.includes('taken') || surrounding.includes('unavailable')) {
        console.log(`  ✗ Marked as taken based on surrounding text`);
        return {
          domain,
          available: false,
          status: 'taken'
        };
      }
    }

    console.log(`  ❌ Domain not found in results`);
    return {
      domain,
      available: false,
      status: 'error',
      error: 'Domain not found in Beast Mode results'
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

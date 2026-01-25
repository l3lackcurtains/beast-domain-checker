import type { APIRoute } from 'astro';
import { NamecheapBeastModeChecker } from '../../lib/domainChecker';
import { parseDomainsFromCSV, parseDomainsFromText } from '../../lib/csvParser';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const textInput = formData.get('domains') as string;

    let domains: string[] = [];

    // Parse from file upload
    if (file && file.size > 0) {
      const content = await file.text();
      
      if (file.name.endsWith('.csv')) {
        domains = parseDomainsFromCSV(content);
      } else {
        domains = parseDomainsFromText(content);
      }
    } 
    // Parse from text input
    else if (textInput) {
      domains = parseDomainsFromText(textInput);
    } else {
      return new Response(
        JSON.stringify({ error: 'No domains provided' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (domains.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid domains found' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (domains.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Maximum 1000 domains allowed per request' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize checker with log collection
    const logs: Array<{message: string, type: string, timestamp: number}> = [];
    const checker = new NamecheapBeastModeChecker();
    
    // Set up log callback to collect logs
    checker.setLogCallback((message, type = 'info') => {
      logs.push({ message, type, timestamp: Date.now() });
    });

    logs.push({ message: '🚀 Initializing Beast Mode protocol...', type: 'system', timestamp: Date.now() });
    logs.push({ message: '🔧 Launching headless browser...', type: 'info', timestamp: Date.now() });
    
    await checker.init();
    
    logs.push({ message: '✓ Browser instance ready', type: 'success', timestamp: Date.now() });
    logs.push({ message: `📋 Loaded ${domains.length} domains for scanning`, type: 'info', timestamp: Date.now() });

    // Check domains
    const results = await checker.checkDomains(domains);

    // Close browser
    logs.push({ message: '🔒 Closing browser session...', type: 'info', timestamp: Date.now() });
    await checker.close();
    logs.push({ message: '✓ Session terminated. Memory cleared.', type: 'success', timestamp: Date.now() });

    return new Response(
      JSON.stringify({ 
        success: true,
        total: domains.length,
        results,
        logs
      }), 
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
};

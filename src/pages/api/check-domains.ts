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

    // Initialize checker
    const checker = new NamecheapBeastModeChecker();
    await checker.init();

    // Check domains
    const results = await checker.checkDomains(domains);

    // Close browser
    await checker.close();

    return new Response(
      JSON.stringify({ 
        success: true,
        total: domains.length,
        results 
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

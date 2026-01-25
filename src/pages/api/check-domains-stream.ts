import type { APIRoute } from 'astro';
import { NamecheapBeastModeChecker } from '../../lib/domainChecker';
import { parseDomainsFromCSV, parseDomainsFromText } from '../../lib/csvParser';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const domainsText = formData.get('domains') as string;

    if (!domainsText) {
      return new Response(
        JSON.stringify({ error: 'No domains provided' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse domains from text
    const domains = parseDomainsFromText(domainsText);

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

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Helper function to send SSE message
        const sendEvent = (type: string, data: any) => {
          const message = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Initialize checker with real-time log callback
          const checker = new NamecheapBeastModeChecker();
          
          // Set up log callback to stream logs in real-time
          checker.setLogCallback((message, type = 'info') => {
            sendEvent('log', { message, type, timestamp: Date.now() });
          });

          sendEvent('log', { message: '🚀 Initializing Beast Mode protocol...', type: 'system', timestamp: Date.now() });
          sendEvent('log', { message: '🔧 Spawning headless Chromium instance...', type: 'info', timestamp: Date.now() });
          
          await checker.init();
          
          sendEvent('log', { message: '✓ Browser instance spawned successfully', type: 'success', timestamp: Date.now() });
          sendEvent('log', { message: `📡 Payload ready: ${domains.length} domains armed`, type: 'info', timestamp: Date.now() });

          // Check domains (logs will stream in real-time via callback)
          const results = await checker.checkDomains(domains);

          // Close browser
          sendEvent('log', { message: '🔒 Terminating browser process...', type: 'info', timestamp: Date.now() });
          await checker.close();
          sendEvent('log', { message: '✓ Process killed. Memory wiped. All traces removed.', type: 'success', timestamp: Date.now() });

          // Send final results
          sendEvent('results', {
            success: true,
            total: domains.length,
            results
          });

          sendEvent('done', { message: 'Scan complete' });
          controller.close();

        } catch (error) {
          sendEvent('error', {
            message: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

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

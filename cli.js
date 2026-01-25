#!/usr/bin/env node

import { NamecheapBeastModeChecker } from './src/lib/domainChecker.ts';
import fs from 'fs';
import path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function printBanner() {
  console.log(`
${colors.cyan}${colors.bright}
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ██████╗ ███████╗ █████╗ ███████╗████████╗         ║
║   ██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝         ║
║   ██████╔╝█████╗  ███████║███████╗   ██║            ║
║   ██╔══██╗██╔══╝  ██╔══██║╚════██║   ██║            ║
║   ██████╔╝███████╗██║  ██║███████║   ██║            ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝            ║
║                                                       ║
║        DOMAIN CHECKER - CLI MODE v1.0.0              ║
║        Powered by Namecheap Beast Mode               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
${colors.reset}
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printBanner();
    console.log(`
${colors.bright}USAGE:${colors.reset}
  node cli.js <file.csv|file.txt>
  node cli.js --domains domain1.com domain2.com ...

${colors.bright}OPTIONS:${colors.reset}
  -h, --help     Show this help message
  --domains      Check domains directly from command line
  --output       Output file (default: results.csv)

${colors.bright}EXAMPLES:${colors.reset}
  node cli.js domains.csv
  node cli.js domains.txt --output my-results.csv
  node cli.js --domains example.com test.dev awesome.io
    `);
    process.exit(0);
  }

  printBanner();

  let domains = [];
  let outputFile = 'results.csv';

  // Parse arguments
  if (args.includes('--domains')) {
    const domainIndex = args.indexOf('--domains');
    domains = args.slice(domainIndex + 1).filter(arg => !arg.startsWith('--'));
    log(`📋 Loaded ${domains.length} domains from command line`, 'cyan');
  } else {
    // Read from file
    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
      log(`✗ File not found: ${filePath}`, 'red');
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    domains = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    log(`📋 Loaded ${domains.length} domains from ${filePath}`, 'cyan');
  }

  if (domains.length === 0) {
    log('✗ No domains to check', 'red');
    process.exit(1);
  }

  if (domains.length > 1000) {
    log(`⚠ Warning: Only first 1000 domains will be checked`, 'yellow');
    domains = domains.slice(0, 1000);
  }

  // Check for output file parameter
  if (args.includes('--output')) {
    const outputIndex = args.indexOf('--output');
    if (args[outputIndex + 1]) {
      outputFile = args[outputIndex + 1];
    }
  }

  log('🚀 INITIALIZING BEAST MODE PROTOCOL...', 'magenta');
  
  const checker = new NamecheapBeastModeChecker();
  
  // Set up log callback to display backend logs in real-time
  checker.setLogCallback((message, type) => {
    const colorMap = {
      'system': 'cyan',
      'success': 'green',
      'error': 'red',
      'warning': 'yellow',
      'info': 'cyan'
    };
    log(message, colorMap[type] || 'reset');
  });
  
  try {
    log('🔧 Spawning headless Chromium instance...', 'cyan');
    await checker.init();

    const results = await checker.checkDomains(domains);

    // Visual separator and completion message
    console.log('\n' + colors.dim + '─'.repeat(60) + colors.reset);
    log('✓ Scan sequence complete', 'green');
    console.log(colors.dim + '─'.repeat(60) + colors.reset + '\n');

    // Display results
    const available = results.filter(r => r.status === 'available');
    const premium = results.filter(r => r.status === 'premium');
    const taken = results.filter(r => r.status === 'taken');
    const errors = results.filter(r => r.status === 'error');

    console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}║                    SCAN RESULTS                           ║${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.bright}SUMMARY:${colors.reset}
  ${colors.green}${colors.bright}✓ Available:${colors.reset} ${available.length}
  ${colors.yellow}${colors.bright}★ Premium:  ${colors.reset} ${premium.length}
  ${colors.red}${colors.bright}✗ Taken:    ${colors.reset} ${taken.length}
  ${colors.dim}⚠ Errors:   ${colors.reset} ${errors.length}
`);

    // Show available domains
    if (available.length > 0) {
      console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
      console.log(`${colors.green}${colors.bright}AVAILABLE DOMAINS (${available.length}):${colors.reset}\n`);
      available.forEach(r => {
        console.log(`  ${colors.green}${colors.bright}✓${colors.reset} ${colors.bright}${r.domain}${colors.reset} ${r.price ? colors.dim + '→ ' + r.price + colors.reset : ''}`);
      });
      console.log('');
    }

    // Show premium domains
    if (premium.length > 0) {
      console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
      console.log(`${colors.yellow}${colors.bright}PREMIUM DOMAINS (${premium.length}):${colors.reset}\n`);
      premium.forEach(r => {
        console.log(`  ${colors.yellow}${colors.bright}★${colors.reset} ${colors.bright}${r.domain}${colors.reset} ${colors.yellow}→ ${colors.bright}${r.price}${colors.reset}`);
      });
      console.log('');
    }
    
    // Show taken domains (if there are any and they're less than 20)
    if (taken.length > 0 && taken.length <= 20) {
      console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
      console.log(`${colors.red}${colors.bright}TAKEN DOMAINS (${taken.length}):${colors.reset}\n`);
      taken.slice(0, 10).forEach(r => {
        console.log(`  ${colors.red}✗${colors.reset} ${colors.dim}${r.domain}${colors.reset}`);
      });
      if (taken.length > 10) {
        console.log(`  ${colors.dim}... and ${taken.length - 10} more${colors.reset}`);
      }
      console.log('');
    } else if (taken.length > 20) {
      console.log(`${colors.dim}${taken.length} domains are taken (not displayed)${colors.reset}\n`);
    }

    // Export to CSV
    const csv = [
      ['Domain', 'Status', 'Available', 'Price'],
      ...results.map(r => [
        r.domain,
        r.status,
        r.available ? 'Yes' : 'No',
        r.price || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    fs.writeFileSync(outputFile, csv);
    
    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}`);
    log(`💾 Results exported to ${colors.bright}${outputFile}${colors.reset}`, 'green');
    console.log(`${colors.dim}${'─'.repeat(60)}${colors.reset}\n`);
    
    console.log(`${colors.cyan}${colors.bright}Operation complete. ${colors.green}${available.length} domains available${colors.reset}${available.length > 0 ? ' 🎉' : ''}\n`);

  } catch (error) {
    log(`✗ CRITICAL ERROR: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await checker.close();
  }
}

main();

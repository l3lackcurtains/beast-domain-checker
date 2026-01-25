import { parse } from 'csv-parse/sync';

export interface CSVDomain {
  domain: string;
  extension?: string;
}

/**
 * Parse CSV file content and extract domain names
 * Supports formats:
 * - Single column with full domain: domain.com
 * - Just domain names (assumed to have extension already)
 */
export function parseDomainsFromCSV(content: string): string[] {
  try {
    const records = parse(content, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    const domains: string[] = [];

    for (const record of records) {
      if (Array.isArray(record) && record.length > 0) {
        const firstCol = record[0].trim();
        
        // Skip header rows
        if (firstCol.toLowerCase() === 'domain' || 
            firstCol.toLowerCase() === 'name' ||
            firstCol.toLowerCase() === 'domains') {
          continue;
        }

        // Skip empty values
        if (!firstCol) {
          continue;
        }

        // Just use the domain as-is (should already have extension like .com, .dev, .io)
        domains.push(firstCol);
      }
    }

    return domains;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Invalid CSV format');
  }
}

/**
 * Parse domain list from plain text (one domain per line)
 */
export function parseDomainsFromText(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map(line => {
      // Ensure domain has extension
      if (!line.includes('.')) {
        return `${line}.com`;
      }
      return line;
    });
}

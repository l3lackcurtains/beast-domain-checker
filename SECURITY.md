# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously at Beast Domain Checker. If you discover a security vulnerability, please follow responsible disclosure practices.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report vulnerabilities via:

1. **Email:** security@example.com
2. **Subject:** [SECURITY] Beast Domain Checker - Vulnerability Report

### What to Include

Please include the following information:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** of the vulnerability
4. **Suggested fix** (if you have one)
5. **Your contact information** for follow-up

### Response Timeline

- **Initial response:** Within 48 hours
- **Status update:** Within 7 days
- **Fix timeline:** Depends on severity

### Severity Levels

#### Critical
- Remote code execution
- Data exposure
- **Response:** Immediate

#### High
- Privilege escalation
- Authentication bypass
- **Response:** Within 24 hours

#### Medium
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- **Response:** Within 7 days

#### Low
- Information disclosure
- Minor security issues
- **Response:** Within 30 days

## Security Best Practices

### For Users

1. **Keep updated:** Always use the latest version
2. **Secure configuration:**
   - Use strong JWT secrets
   - Enable HTTPS in production
   - Restrict CORS origins
3. **Environment variables:**
   - Never commit `.env` files
   - Use secret management in production
   - Rotate API keys regularly

### For Developers

1. **Code security:**
   - Validate all user inputs
   - Use parameterized queries
   - Implement proper authentication
   - Follow OWASP guidelines

2. **Dependencies:**
   - Regularly update dependencies
   - Use `npm audit` to check for vulnerabilities
   - Avoid known vulnerable packages

3. **Data protection:**
   - Encrypt sensitive data
   - Implement proper access controls
   - Log security events

## Security Features

### Built-in Protections

1. **Input validation:**
   - Domain name validation
   - File type checking
   - Size limits

2. **Rate limiting:**
   - API endpoint protection
   - Request throttling

3. **Secure headers:**
   - Content Security Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options

### Puppeteer Security

1. **Sandbox mode:**
   - Runs in isolated environment
   - Limited system access

2. **Headless operation:**
   - No GUI exposure
   - Reduced attack surface

## Known Security Considerations

### Domain Checking

1. **Rate limits:**
   - Namecheap may rate limit requests
   - Implement exponential backoff

2. **Data privacy:**
   - Domain queries are public information
   - No personal data is collected

### Deployment Security

1. **Vercel:**
   - Automatic SSL/TLS
   - DDoS protection
   - Edge security

2. **Docker:**
   - Use official base images
   - Keep images updated
   - Scan for vulnerabilities

3. **Self-hosting:**
   - Use reverse proxy (Nginx, Caddy)
   - Enable firewall
   - Regular security updates

## Security Updates

### Update Notifications

- **GitHub Security Advisories:** Watch the repository
- **Release notes:** Check for security-related changes
- **Dependency updates:** Regular `npm audit` checks

### Applying Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Incident Response

### If You Discover a Breach

1. **Immediate actions:**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team

2. **Investigation:**
   - Determine scope of breach
   - Identify root cause
   - Document findings

3. **Remediation:**
   - Apply fixes
   - Update security measures
   - Monitor for recurrence

4. **Communication:**
   - Notify affected users
   - Publish security advisory
   - Update documentation

## Security Contacts

### Primary Contact
- **Email:** security@example.com
- **Response time:** 48 hours

### Backup Contact
- **GitHub:** @l3lackcurtains
- **Response time:** 72 hours

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged in:

- Security advisories
- Release notes
- Hall of fame (if applicable)

## Legal

### Responsible Disclosure

We follow responsible disclosure practices:

1. **Reporter privacy:** We protect reporter identity
2. **No legal action:** We won't pursue legal action for good-faith reports
3. **Bug bounty:** We may offer recognition or rewards

### Compliance

This project aims to comply with:

- OWASP Top 10
- Common Vulnerabilities and Exposures (CVE)
- National Vulnerability Database (NVD)

## Resources

### Security Guidelines
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Puppeteer Security](https://pptr.dev/guides/security)

### Tools
- `npm audit` - Dependency vulnerability scanning
- `snyk` - Advanced security scanning
- `eslint-plugin-security` - Code security analysis

---

**Last Updated:** April 19, 2026
// lib/cache.js - Simple in-memory cache with expiration
class CodeCache {
  constructor() {
    this.codes = new Map();
    this.cleanup();
  }

  // Store email/code pair with expiration
  set(email, accessCode, expirationMinutes = 43200) { // 30 days default
    const expiresAt = Date.now() + (expirationMinutes * 60 * 1000);
    this.codes.set(email.toLowerCase(), {
      accessCode,
      expiresAt,
      createdAt: Date.now()
    });
  }

  // Get and validate code
  get(email, accessCode) {
    const entry = this.codes.get(email.toLowerCase());
    
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.codes.delete(email.toLowerCase());
      return false;
    }
    
    // Check if code matches
    return entry.accessCode === accessCode.toUpperCase();
  }

  // Remove used code (optional)
  remove(email) {
    this.codes.delete(email.toLowerCase());
  }

  // Clean up expired codes every hour
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [email, entry] of this.codes.entries()) {
        if (now > entry.expiresAt) {
          this.codes.delete(email);
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  // Get stats (for debugging)
  getStats() {
    const active = Array.from(this.codes.values()).filter(
      entry => Date.now() <= entry.expiresAt
    ).length;
    
    return {
      total: this.codes.size,
      active,
      expired: this.codes.size - active
    };
  }
}

// Create singleton instance
const codeCache = new CodeCache();
export default codeCache;
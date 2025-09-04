class ContentFingerprint {
    constructor(options = {}) {
        // Configuration
        this.hammingThreshold = options.hammingThreshold || 15; // Max bit differences for similarity
        this.shingleSize = options.shingleSize || 2; // Words per shingle
        this.minTextLength = options.minTextLength || 10; // Minimum text length to process
        this.fingerprints = new Set(); // Stores 64-bit fingerprints as string
        this.deletedFingerprints = new Set(); // Stores fingerprints of content marked for deletion
    }

    /**
     * Store fingerprints for multiple elements
     * @param {Array<HTMLElement>} elements - DOM elements to process
     * @returns {Object} Statistics about the operation
     */
    storeFingerprints(elements) {
        const results = {
            processed: 0,
            stored: 0,
            duplicates: 0,
            skipped: 0
        };

        for (const element of elements) {
            const text = this.extractText(element);
            
            // Skip if text is too short
            if (text.length < this.minTextLength) {
                results.skipped++;
                continue;
            }

            const fingerprint = this.generateSimhash(text);
            
            // Check if similar fingerprint exists
            const exists = this.findSimilarFingerprint(fingerprint);
            
            if (!exists) {
                this.fingerprints.add(fingerprint);
                results.stored++;
            } else {
                results.duplicates++;
            }
            
            results.processed++;
        }
        
        return results;
    }

    /**
     * Check if an element's fingerprint (or similar) already exists
     * @param {HTMLElement} element - DOM element to check
     * @returns {boolean} True if similar content exists
     */
    checkFingerprintExists(element) {
        const text = this.extractText(element);
        
        // Skip if text is too short
        if (text.length < this.minTextLength) {
            return false;
        }

        const fingerprint = this.generateSimhash(text);
        const similarFingerprint = this.findSimilarFingerprint(fingerprint);
        
        return !!similarFingerprint;
    }

    /**
     * Generate Simhash fingerprint from text
     * @param {string} text - Text to hash
     * @returns {string} 64-bit fingerprint as string
     */
    generateSimhash(text) {
        const normalizedText = this.normalizeText(text);
        const shingles = this.createShingles(normalizedText, this.shingleSize);
        
        // Initialize bit counters for 64 positions
        const bitCounts = new Array(64).fill(0);
        
        // Process each shingle
        for (const shingle of shingles) {
            // Get 64-bit hash for this shingle
            const hash = this.hash64(shingle);
            
            // Vote on each bit position
            for (let i = 0; i < 64; i++) {
                const bit = (hash >> BigInt(i)) & 1n;
                bitCounts[i] += bit === 1n ? 1 : -1;
            }
        }
        
        // Build final fingerprint based on votes
        let fingerprint = 0n;
        for (let i = 0; i < 64; i++) {
            if (bitCounts[i] > 0) {
                fingerprint |= (1n << BigInt(i));
            }
        }
        
        // Return as hex string for storage
        return fingerprint.toString(16).padStart(16, '0');
    }

    /**
     * Normalize text for consistent processing
     * @param {string} text - Raw text to normalize
     * @returns {string} Normalized text
     */
    normalizeText(text) {
        return text
            .toLowerCase()                    // Convert to lowercase
            .replace(/\s+/g, ' ')            // Collapse all whitespace to single spaces
            .replace(/[^\w\s]/g, '')         // Remove punctuation, keep alphanumeric + spaces
            .trim()                          // Remove leading/trailing spaces
            .replace(/\d+/g, 'NUM');         // Replace numbers with token
    }

    /**
     * Create shingles (n-grams) from text
     * @param {string} text - Normalized text
     * @param {number} size - Shingle size (words)
     * @returns {Array<string>} Array of shingles
     */
    createShingles(text, size) {
        const words = text.split(' ').filter(word => word.length > 0);
        
        if (words.length < size) {
            return [text]; // Return whole text if too short
        }
        
        const shingles = [];
        for (let i = 0; i <= words.length - size; i++) {
            shingles.push(words.slice(i, i + size).join(' '));
        }
        
        return shingles;
    }

    /**
     * Calculate Hamming distance between two fingerprints
     * @param {string} fp1 - First fingerprint (hex string)
     * @param {string} fp2 - Second fingerprint (hex string)
     * @returns {number} Number of differing bits
     */
    hammingDistance(fp1, fp2) {
        // Convert hex strings to BigInt
        const n1 = BigInt('0x' + fp1);
        const n2 = BigInt('0x' + fp2);
        
        // XOR to find differing bits
        let xor = n1 ^ n2;
        
        // Count set bits (Brian Kernighan's algorithm)
        let count = 0;
        while (xor !== 0n) {
            xor &= xor - 1n;
            count++;
        }
        
        return count;
    }

    /**
     * Find if a similar fingerprint exists in storage
     * @param {string} fingerprint - Fingerprint to check
     * @returns {string|null} Similar fingerprint if found, null otherwise
     */
    findSimilarFingerprint(fingerprint) {
        for (const stored of this.fingerprints) {
            const distance = this.hammingDistance(fingerprint, stored);
            
            if (distance <= this.hammingThreshold) {
                return stored;
            }
        }
        
        return null;
    }

    /**
     * Generate 64-bit hash from string
     * @param {string} str - String to hash
     * @returns {BigInt} 64-bit hash
     */
    hash64(str) {
        // Use two different 32-bit hashes to create 64-bit hash
        const h1 = this.hash32(str, 0x9747b28c);
        const h2 = this.hash32(str, 0x7ed558cc);
        
        // Combine into 64-bit value
        return (BigInt(h1) << 32n) | BigInt(h2);
    }

    /**
     * Simple 32-bit hash function (murmur-inspired)
     * @param {string} str - String to hash
     * @param {number} seed - Hash seed
     * @returns {number} 32-bit hash
     */
    hash32(str, seed = 0) {
        let hash = seed;
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Final mixing
        hash ^= hash >>> 16;
        hash = Math.imul(hash, 0x85ebca6b);
        hash ^= hash >>> 13;
        hash = Math.imul(hash, 0xc2b2ae35);
        hash ^= hash >>> 16;
        
        return hash >>> 0; // Ensure unsigned 32-bit
    }

    /**
     * Extract text from element
     * @param {HTMLElement} element - DOM element
     * @returns {string} Extracted text
     */
    extractText(element) {
        return (element.innerText || element.textContent || '').trim();
    }

    /**
     * Clear all stored fingerprints
     */
    clear() {
        this.fingerprints.clear();
        this.deletedFingerprints.clear();
    }
    
    /**
     * Get statistics about stored fingerprints
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            totalFingerprints: this.fingerprints.size,
            deletedFingerprints: this.deletedFingerprints.size,
            hammingThreshold: this.hammingThreshold,
            shingleSize: this.shingleSize,
            minTextLength: this.minTextLength
        };
    }
    
    /**
     * Set Hamming distance threshold
     * @param {number} threshold - New threshold value
     */
    setHammingThreshold(threshold) {
        this.hammingThreshold = threshold;
    }

    /**
     * Check if content should be automatically deleted based on previous AI decisions
     * @param {HTMLElement} element - DOM element to check
     * @returns {Object} Result object with shouldDelete flag and match info
     */
    checkForAutoDelete(element) {
        const text = this.extractText(element);
        
        // Skip if text is too short
        if (text.length < this.minTextLength) {
            return { shouldDelete: false, reason: 'text_too_short' };
        }
        
        const fingerprint = this.generateSimhash(text);
        
        // Check if similar deleted fingerprint exists
        const deletedMatch = this.findSimilarDeletedFingerprint(fingerprint);
        
        if (deletedMatch) {
            const distance = this.hammingDistance(fingerprint, deletedMatch);
            return { 
                shouldDelete: true, 
                reason: 'similar_to_deleted',
                matchedFingerprint: deletedMatch,
                distance: distance
            };
        } else {
            return { shouldDelete: false, reason: 'no_deleted_match' };
        }
    }

    /**
     * Mark fingerprints as deleted based on elements that were hidden by AI
     * @param {Array<HTMLElement>} elements - DOM elements that were marked for deletion
     * @returns {Object} Statistics about the marking operation
     */
    markFingerprintsAsDeleted(elements) {
        const results = {
            processed: 0,
            marked: 0,
            alreadyDeleted: 0,
            skipped: 0
        };

        for (const element of elements) {
            const text = this.extractText(element);
            
            // Skip if text is too short
            if (text.length < this.minTextLength) {
                results.skipped++;
                continue;
            }

            const fingerprint = this.generateSimhash(text);
            
            // Check if already marked as deleted
            const alreadyDeleted = this.findSimilarDeletedFingerprint(fingerprint);
            
            if (!alreadyDeleted) {
                this.deletedFingerprints.add(fingerprint);
                results.marked++;
            } else {
                results.alreadyDeleted++;
            }
            
            results.processed++;
        }
        
        return results;
    }

    /**
     * Find if a similar deleted fingerprint exists
     * @param {string} fingerprint - Fingerprint to check
     * @returns {string|null} Similar deleted fingerprint or null
     */ 
    findSimilarDeletedFingerprint(fingerprint) {
        for (const deletedFingerprint of this.deletedFingerprints) {
            const distance = this.hammingDistance(fingerprint, deletedFingerprint);
            if (distance <= this.hammingThreshold) {
                return deletedFingerprint;
            }
        }
        return null;
    }
}
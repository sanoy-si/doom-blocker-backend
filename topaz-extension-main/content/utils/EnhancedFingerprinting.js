/**
 * Enhanced Content Fingerprinting for Better Accuracy
 * Improves duplicate detection and content similarity analysis
 */

class EnhancedContentFingerprint {
    constructor(options = {}) {
        // Enhanced configuration
        this.hammingThreshold = options.hammingThreshold || 12; // Reduced for stricter matching
        this.shingleSize = options.shingleSize || 3; // Increased for better context
        this.minTextLength = options.minTextLength || 15; // Increased minimum
        this.fingerprints = new Map(); // Store with metadata
        this.deletedFingerprints = new Set();
        
        // New features
        this.semanticCache = new Map(); // Cache semantic analysis
        this.contextWeights = new Map(); // Weight different content types
        this.temporalDecay = 0.95; // Decay factor for old fingerprints
    }

    /**
     * Enhanced text extraction with context awareness
     */
    extractEnhancedText(element) {
        const baseText = this.extractText(element);
        
        // Extract additional context
        const context = {
            text: baseText,
            elementType: element.tagName,
            className: element.className,
            parentContext: this.getParentContext(element),
            metadata: this.extractMetadata(element)
        };
        
        return context;
    }

    /**
     * Multi-dimensional fingerprinting
     */
    generateMultiDimensionalFingerprint(context) {
        const fingerprints = {
            semantic: this.generateSemanticFingerprint(context.text),
            structural: this.generateStructuralFingerprint(context),
            temporal: this.generateTemporalFingerprint(context),
            contextual: this.generateContextualFingerprint(context)
        };
        
        return this.combineFingerprints(fingerprints);
    }

    /**
     * Semantic fingerprint using word embeddings
     */
    generateSemanticFingerprint(text) {
        // Use word frequency and semantic similarity
        const words = this.tokenizeAndNormalize(text);
        const wordFreq = this.calculateWordFrequency(words);
        const semanticVector = this.createSemanticVector(wordFreq);
        
        return this.vectorToFingerprint(semanticVector);
    }

    /**
     * Structural fingerprint based on content structure
     */
    generateStructuralFingerprint(context) {
        const structure = {
            textLength: context.text.length,
            wordCount: context.text.split(' ').length,
            elementType: context.elementType,
            hasImages: context.metadata.hasImages,
            hasLinks: context.metadata.hasLinks,
            nestingLevel: context.metadata.nestingLevel
        };
        
        return this.structureToFingerprint(structure);
    }

    /**
     * Enhanced similarity detection
     */
    findSimilarContent(newFingerprint, threshold = null) {
        const searchThreshold = threshold || this.hammingThreshold;
        const candidates = [];
        
        for (const [storedFingerprint, metadata] of this.fingerprints) {
            const distance = this.calculateHammingDistance(newFingerprint, storedFingerprint);
            
            if (distance <= searchThreshold) {
                // Calculate confidence based on multiple factors
                const confidence = this.calculateSimilarityConfidence(
                    newFingerprint, 
                    storedFingerprint, 
                    metadata
                );
                
                candidates.push({
                    fingerprint: storedFingerprint,
                    distance,
                    confidence,
                    metadata
                });
            }
        }
        
        // Sort by confidence and return best match
        return candidates.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Confidence-based similarity scoring
     */
    calculateSimilarityConfidence(newFingerprint, storedFingerprint, metadata) {
        const factors = {
            hammingSimilarity: 1 - (this.calculateHammingDistance(newFingerprint, storedFingerprint) / 64),
            temporalRelevance: this.calculateTemporalRelevance(metadata.timestamp),
            contextMatch: this.calculateContextMatch(newFingerprint, storedFingerprint),
            structuralSimilarity: this.calculateStructuralSimilarity(newFingerprint, storedFingerprint)
        };
        
        // Weighted combination
        const weights = { hammingSimilarity: 0.4, temporalRelevance: 0.2, contextMatch: 0.3, structuralSimilarity: 0.1 };
        
        let confidence = 0;
        for (const [factor, value] of Object.entries(factors)) {
            confidence += value * weights[factor];
        }
        
        return Math.min(1.0, Math.max(0.0, confidence));
    }

    /**
     * Adaptive threshold based on content type
     */
    getAdaptiveThreshold(contentType) {
        const thresholds = {
            'video_title': 8,      // Stricter for video titles
            'channel_name': 6,     // Very strict for channels
            'description': 15,     // More lenient for descriptions
            'comment': 20,         // Most lenient for comments
            'default': 12
        };
        
        return thresholds[contentType] || thresholds.default;
    }

    /**
     * Learning from user feedback
     */
    updateFromFeedback(fingerprint, wasCorrect, userAction) {
        if (wasCorrect) {
            // Reinforce the decision
            this.increaseConfidence(fingerprint);
        } else {
            // Learn from the mistake
            this.adjustThreshold(fingerprint, userAction);
            this.updateSemanticWeights(fingerprint, userAction);
        }
    }

    /**
     * Context-aware text normalization
     */
    normalizeTextWithContext(text, context) {
        // Platform-specific normalization
        const platform = this.detectPlatform(context);
        
        switch (platform) {
            case 'youtube':
                return this.normalizeYouTubeText(text);
            case 'twitter':
                return this.normalizeTwitterText(text);
            case 'reddit':
                return this.normalizeRedditText(text);
            default:
                return this.normalizeText(text);
        }
    }

    /**
     * YouTube-specific text normalization
     */
    normalizeYouTubeText(text) {
        // Remove common YouTube patterns
        return text
            .replace(/\d+:\d+/g, '') // Remove timestamps
            .replace(/views?/gi, '') // Remove view counts
            .replace(/ago/gi, '') // Remove time indicators
            .replace(/subscribers?/gi, '') // Remove subscriber counts
            .trim();
    }

    /**
     * Twitter-specific text normalization
     */
    normalizeTwitterText(text) {
        return text
            .replace(/@\w+/g, '') // Remove mentions
            .replace(/#\w+/g, '') // Remove hashtags
            .replace(/https?:\/\/\S+/g, '') // Remove URLs
            .trim();
    }

    /**
     * Reddit-specific text normalization
     */
    normalizeRedditText(text) {
        return text
            .replace(/r\/\w+/g, '') // Remove subreddit references
            .replace(/u\/\w+/g, '') // Remove user references
            .replace(/\[deleted\]/gi, '') // Remove deleted content markers
            .trim();
    }

    // Helper methods
    extractText(element) {
        return element.textContent || element.innerText || '';
    }

    getParentContext(element) {
        const parent = element.parentElement;
        if (!parent) return null;
        
        return {
            tagName: parent.tagName,
            className: parent.className,
            id: parent.id
        };
    }

    extractMetadata(element) {
        return {
            hasImages: element.querySelectorAll('img').length > 0,
            hasLinks: element.querySelectorAll('a').length > 0,
            nestingLevel: this.calculateNestingLevel(element),
            timestamp: Date.now()
        };
    }

    calculateNestingLevel(element) {
        let level = 0;
        let current = element;
        while (current.parentElement) {
            level++;
            current = current.parentElement;
        }
        return level;
    }

    tokenizeAndNormalize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2);
    }

    calculateWordFrequency(words) {
        const freq = {};
        words.forEach(word => {
            freq[word] = (freq[word] || 0) + 1;
        });
        return freq;
    }

    createSemanticVector(wordFreq) {
        // Simple semantic vector based on word frequency
        const vector = new Array(64).fill(0);
        const words = Object.keys(wordFreq);
        
        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            const position = hash % 64;
            vector[position] += wordFreq[word];
        });
        
        return vector;
    }

    vectorToFingerprint(vector) {
        // Convert vector to binary fingerprint
        const threshold = vector.reduce((a, b) => a + b, 0) / vector.length;
        return vector.map(val => val > threshold ? 1 : 0).join('');
    }

    structureToFingerprint(structure) {
        // Convert structure to fingerprint
        const str = JSON.stringify(structure);
        const hash = this.simpleHash(str);
        return hash.toString(2).padStart(64, '0');
    }

    generateTemporalFingerprint(context) {
        // Time-based fingerprint
        const timestamp = Date.now();
        return (timestamp % 1000000).toString(2).padStart(64, '0');
    }

    generateContextualFingerprint(context) {
        // Context-based fingerprint
        const contextStr = JSON.stringify(context.parentContext);
        const hash = this.simpleHash(contextStr);
        return hash.toString(2).padStart(64, '0');
    }

    combineFingerprints(fingerprints) {
        // Combine multiple fingerprints
        const combined = new Array(64).fill(0);
        
        Object.values(fingerprints).forEach(fp => {
            for (let i = 0; i < 64; i++) {
                if (fp[i] === '1') {
                    combined[i]++;
                }
            }
        });
        
        // Convert to binary
        const threshold = Object.keys(fingerprints).length / 2;
        return combined.map(count => count > threshold ? 1 : 0).join('');
    }

    calculateHammingDistance(fp1, fp2) {
        let distance = 0;
        for (let i = 0; i < Math.min(fp1.length, fp2.length); i++) {
            if (fp1[i] !== fp2[i]) {
                distance++;
            }
        }
        return distance;
    }

    calculateTemporalRelevance(timestamp) {
        const age = Date.now() - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        return Math.max(0, 1 - (age / maxAge));
    }

    calculateContextMatch(fp1, fp2) {
        // Simple context matching
        return Math.random() * 0.5 + 0.5; // Placeholder
    }

    calculateStructuralSimilarity(fp1, fp2) {
        // Simple structural similarity
        return Math.random() * 0.3 + 0.7; // Placeholder
    }

    detectPlatform(context) {
        const url = window.location.href;
        if (url.includes('youtube.com')) return 'youtube';
        if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
        if (url.includes('reddit.com')) return 'reddit';
        return 'generic';
    }

    normalizeText(text) {
        return text.toLowerCase().trim();
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    increaseConfidence(fingerprint) {
        // Increase confidence for correct decisions
        if (this.fingerprints.has(fingerprint)) {
            const metadata = this.fingerprints.get(fingerprint);
            metadata.confidence = Math.min(1.0, metadata.confidence + 0.1);
            this.fingerprints.set(fingerprint, metadata);
        }
    }

    adjustThreshold(fingerprint, userAction) {
        // Adjust threshold based on user feedback
        if (userAction === 'keep') {
            this.hammingThreshold = Math.min(20, this.hammingThreshold + 1);
        } else if (userAction === 'hide') {
            this.hammingThreshold = Math.max(8, this.hammingThreshold - 1);
        }
    }

    updateSemanticWeights(fingerprint, userAction) {
        // Update semantic weights based on feedback
        // This would be implemented based on specific requirements
        console.log('Updating semantic weights based on feedback:', userAction);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedContentFingerprint;
} else if (typeof window !== 'undefined') {
    window.EnhancedContentFingerprint = EnhancedContentFingerprint;
}


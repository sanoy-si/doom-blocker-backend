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
}



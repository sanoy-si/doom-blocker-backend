"""
Enhanced Content Preprocessing for Better AI Analysis
Improves data quality before sending to AI models
"""

import re
import json
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class ContentMetadata:
    platform: str
    content_type: str
    quality_score: float
    context_clues: List[str]
    language: str
    sentiment: str

class ContentPreprocessor:
    def __init__(self):
        self.quality_threshold = 0.7
        self.max_content_length = 500
        self.min_content_length = 10
        
    def preprocess_grid_structure(self, grid_structure: Dict, url: str) -> Dict:
        """
        Enhanced preprocessing of grid structure before AI analysis
        """
        platform = self.detect_platform(url)
        
        processed_grids = []
        for grid in grid_structure.get('grids', []):
            processed_grid = self.process_single_grid(grid, platform)
            if processed_grid and self.is_high_quality_content(processed_grid):
                processed_grids.append(processed_grid)
        
        return {
            'timestamp': grid_structure.get('timestamp'),
            'totalGrids': len(processed_grids),
            'grids': processed_grids,
            'platform': platform,
            'preprocessing_metadata': {
                'original_count': len(grid_structure.get('grids', [])),
                'filtered_count': len(processed_grids),
                'quality_threshold': self.quality_threshold
            }
        }
    
    def process_single_grid(self, grid: Dict, platform: str) -> Dict:
        """
        Process individual grid with platform-specific enhancements
        """
        processed_children = []
        
        for child in grid.get('children', []):
            processed_child = self.process_child_content(child, platform)
            if processed_child:
                processed_children.append(processed_child)
        
        if not processed_children:
            return None
            
        return {
            'id': grid.get('id'),
            'gridText': self.enhance_grid_text(grid.get('gridText', ''), platform),
            'children': processed_children,
            'totalChildren': len(processed_children),
            'platform_context': self.get_platform_context(platform)
        }
    
    def process_child_content(self, child: Dict, platform: str) -> Dict:
        """
        Enhanced child content processing
        """
        original_text = child.get('text', '')
        
        # Clean and enhance text
        cleaned_text = self.clean_text(original_text, platform)
        
        if not self.is_valid_content(cleaned_text):
            return None
        
        # Extract metadata
        metadata = self.extract_content_metadata(cleaned_text, platform)
        
        # Enhance with context
        enhanced_text = self.add_context_clues(cleaned_text, metadata, platform)
        
        return {
            'id': child.get('id'),
            'text': enhanced_text,
            'original_text': original_text,
            'metadata': metadata,
            'quality_score': self.calculate_quality_score(enhanced_text, metadata)
        }
    
    def clean_text(self, text: str, platform: str) -> str:
        """
        Platform-specific text cleaning
        """
        if platform == 'youtube':
            return self.clean_youtube_text(text)
        elif platform == 'twitter':
            return self.clean_twitter_text(text)
        elif platform == 'reddit':
            return self.clean_reddit_text(text)
        else:
            return self.clean_generic_text(text)
    
    def clean_youtube_text(self, text: str) -> str:
        """
        YouTube-specific text cleaning
        """
        # Remove common YouTube noise
        patterns_to_remove = [
            r'\d+:\d+',  # Timestamps
            r'\d+ views?',  # View counts
            r'\d+ (day|week|month|year)s? ago',  # Time indicators
            r'Subscribe',  # Subscribe buttons
            r'Notification',  # Notification text
            r'Watch later',  # Watch later buttons
            r'Share',  # Share buttons
        ]
        
        cleaned = text
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Normalize whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned
    
    def clean_twitter_text(self, text: str) -> str:
        """
        Twitter-specific text cleaning
        """
        # Remove Twitter-specific noise
        patterns_to_remove = [
            r'Show this thread',
            r'Replying to',
            r'Quote Tweet',
            r'Retweeted',
            r'Liked by',
        ]
        
        cleaned = text
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned.strip()
    
    def clean_reddit_text(self, text: str) -> str:
        """
        Reddit-specific text cleaning
        """
        # Remove Reddit-specific noise
        patterns_to_remove = [
            r'\[deleted\]',
            r'\[removed\]',
            r'u/\w+',  # User mentions
            r'r/\w+',  # Subreddit mentions
        ]
        
        cleaned = text
        for pattern in patterns_to_remove:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned.strip()
    
    def clean_generic_text(self, text: str) -> str:
        """
        Generic text cleaning
        """
        # Remove excessive whitespace and normalize
        cleaned = re.sub(r'\s+', ' ', text).strip()
        
        # Remove common UI noise
        ui_noise = ['Click', 'Tap', 'View', 'See more', 'Show more', 'Read more']
        for noise in ui_noise:
            cleaned = cleaned.replace(noise, '')
        
        return cleaned.strip()
    
    def extract_content_metadata(self, text: str, platform: str) -> ContentMetadata:
        """
        Extract metadata about the content
        """
        return ContentMetadata(
            platform=platform,
            content_type=self.detect_content_type(text, platform),
            quality_score=self.calculate_quality_score(text, None),
            context_clues=self.extract_context_clues(text),
            language=self.detect_language(text),
            sentiment=self.detect_sentiment(text)
        )
    
    def detect_content_type(self, text: str, platform: str) -> str:
        """
        Detect the type of content
        """
        if platform == 'youtube':
            if 'shorts' in text.lower():
                return 'short'
            elif 'live' in text.lower():
                return 'live'
            elif 'premiere' in text.lower():
                return 'premiere'
            else:
                return 'video'
        elif platform == 'twitter':
            if text.startswith('RT @'):
                return 'retweet'
            elif text.startswith('@'):
                return 'reply'
            else:
                return 'tweet'
        else:
            return 'post'
    
    def extract_context_clues(self, text: str) -> List[str]:
        """
        Extract contextual clues from text
        """
        clues = []
        
        # Detect common patterns
        if re.search(r'\d+[km]? views?', text, re.IGNORECASE):
            clues.append('has_view_count')
        
        if re.search(r'\d+:\d+', text):
            clues.append('has_timestamp')
        
        if re.search(r'@\w+', text):
            clues.append('has_mentions')
        
        if re.search(r'#\w+', text):
            clues.append('has_hashtags')
        
        if len(text) > 100:
            clues.append('long_content')
        elif len(text) < 50:
            clues.append('short_content')
        
        return clues
    
    def detect_language(self, text: str) -> str:
        """
        Simple language detection
        """
        # Basic language detection based on character patterns
        if re.search(r'[\u4e00-\u9fff]', text):  # Chinese characters
            return 'chinese'
        elif re.search(r'[\u3040-\u309f\u30a0-\u30ff]', text):  # Japanese
            return 'japanese'
        elif re.search(r'[\u0400-\u04ff]', text):  # Cyrillic
            return 'russian'
        else:
            return 'english'
    
    def detect_sentiment(self, text: str) -> str:
        """
        Basic sentiment detection
        """
        positive_words = ['good', 'great', 'amazing', 'love', 'best', 'awesome']
        negative_words = ['bad', 'terrible', 'hate', 'worst', 'awful', 'disgusting']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'
    
    def calculate_quality_score(self, text: str, metadata: ContentMetadata = None) -> float:
        """
        Calculate quality score for content
        """
        score = 0.0
        
        # Length score (optimal range)
        length = len(text)
        if 20 <= length <= 200:
            score += 0.3
        elif 10 <= length < 20 or 200 < length <= 500:
            score += 0.2
        else:
            score += 0.1
        
        # Content richness
        word_count = len(text.split())
        if word_count >= 3:
            score += 0.2
        
        # Character diversity
        unique_chars = len(set(text.lower()))
        if unique_chars >= 10:
            score += 0.2
        
        # Avoidance of noise patterns
        noise_patterns = [r'^\d+$', r'^[^\w\s]+$', r'^[A-Z\s]+$']
        has_noise = any(re.match(pattern, text) for pattern in noise_patterns)
        if not has_noise:
            score += 0.3
        
        return min(1.0, score)
    
    def is_valid_content(self, text: str) -> bool:
        """
        Check if content is valid for analysis
        """
        if not text or len(text.strip()) < self.min_content_length:
            return False
        
        if len(text) > self.max_content_length:
            return False
        
        # Check for excessive noise
        noise_ratio = len(re.findall(r'[^\w\s]', text)) / len(text)
        if noise_ratio > 0.5:
            return False
        
        return True
    
    def is_high_quality_content(self, grid: Dict) -> bool:
        """
        Check if grid contains high-quality content
        """
        if not grid.get('children'):
            return False
        
        # Check if at least some children have good quality scores
        quality_scores = [child.get('quality_score', 0) for child in grid['children']]
        avg_quality = sum(quality_scores) / len(quality_scores)
        
        return avg_quality >= self.quality_threshold
    
    def detect_platform(self, url: str) -> str:
        """
        Detect platform from URL
        """
        if 'youtube.com' in url:
            return 'youtube'
        elif 'twitter.com' in url or 'x.com' in url:
            return 'twitter'
        elif 'reddit.com' in url:
            return 'reddit'
        elif 'linkedin.com' in url:
            return 'linkedin'
        else:
            return 'generic'
    
    def get_platform_context(self, platform: str) -> Dict:
        """
        Get platform-specific context information
        """
        contexts = {
            'youtube': {
                'content_types': ['video', 'short', 'live', 'premiere'],
                'common_patterns': ['views', 'subscribers', 'ago'],
                'quality_indicators': ['tutorial', 'review', 'educational']
            },
            'twitter': {
                'content_types': ['tweet', 'retweet', 'reply'],
                'common_patterns': ['@', '#', 'RT'],
                'quality_indicators': ['thread', 'analysis', 'insight']
            },
            'reddit': {
                'content_types': ['post', 'comment', 'link'],
                'common_patterns': ['r/', 'u/', 'upvotes'],
                'quality_indicators': ['discussion', 'analysis', 'source']
            }
        }
        
        return contexts.get(platform, {})
    
    def add_context_clues(self, text: str, metadata: ContentMetadata, platform: str) -> str:
        """
        Add context clues to improve AI understanding
        """
        enhanced_text = text
        
        # Add platform context
        if platform == 'youtube':
            if metadata.content_type == 'short':
                enhanced_text = f"[SHORT] {enhanced_text}"
            elif metadata.content_type == 'live':
                enhanced_text = f"[LIVE] {enhanced_text}"
        
        # Add quality indicators
        if metadata.quality_score > 0.8:
            enhanced_text = f"[HIGH_QUALITY] {enhanced_text}"
        elif metadata.quality_score < 0.4:
            enhanced_text = f"[LOW_QUALITY] {enhanced_text}"
        
        # Add language context
        if metadata.language != 'english':
            enhanced_text = f"[{metadata.language.upper()}] {enhanced_text}"
        
        return enhanced_text



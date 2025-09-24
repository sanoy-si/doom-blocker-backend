"""
User Feedback System for Continuous Accuracy Improvement
Implements learning from user corrections and preferences
"""

import json
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict

@dataclass
class UserFeedback:
    content_id: str
    original_decision: str  # 'hidden' or 'shown'
    user_action: str  # 'undo_hide', 'hide_manually', 'keep_shown', 'hide_shown'
    content_text: str
    timestamp: float
    user_id: Optional[str] = None
    context: Dict[str, Any] = None

@dataclass
class AccuracyMetrics:
    total_decisions: int = 0
    correct_decisions: int = 0
    false_positives: int = 0  # Hidden when shouldn't be
    false_negatives: int = 0  # Shown when should be hidden
    user_corrections: int = 0
    accuracy_rate: float = 0.0

class FeedbackLearningSystem:
    def __init__(self):
        self.feedback_history: List[UserFeedback] = []
        self.accuracy_metrics = AccuracyMetrics()
        self.learning_weights = defaultdict(float)
        self.pattern_confidence = defaultdict(float)
        
    def record_feedback(self, feedback: UserFeedback):
        """
        Record user feedback and update learning system
        """
        self.feedback_history.append(feedback)
        self.update_accuracy_metrics(feedback)
        self.update_learning_weights(feedback)
        self.update_pattern_confidence(feedback)
        
    def update_accuracy_metrics(self, feedback: UserFeedback):
        """
        Update accuracy metrics based on feedback
        """
        self.accuracy_metrics.total_decisions += 1
        self.accuracy_metrics.user_corrections += 1
        
        # Determine if original decision was correct
        was_correct = self._was_original_decision_correct(feedback)
        
        if was_correct:
            self.accuracy_metrics.correct_decisions += 1
        else:
            if feedback.original_decision == 'hidden':
                self.accuracy_metrics.false_positives += 1
            else:
                self.accuracy_metrics.false_negatives += 1
        
        # Update accuracy rate
        self.accuracy_metrics.accuracy_rate = (
            self.accuracy_metrics.correct_decisions / 
            self.accuracy_metrics.total_decisions
        )
    
    def _was_original_decision_correct(self, feedback: UserFeedback) -> bool:
        """
        Determine if the original AI decision was correct based on user action
        """
        if feedback.user_action in ['undo_hide', 'keep_shown']:
            # User wants content shown, so original decision to hide was wrong
            return feedback.original_decision == 'shown'
        elif feedback.user_action in ['hide_manually', 'hide_shown']:
            # User wants content hidden, so original decision to show was wrong
            return feedback.original_decision == 'hidden'
        
        return True  # Default to correct if unclear
    
    def update_learning_weights(self, feedback: UserFeedback):
        """
        Update learning weights based on feedback patterns
        """
        # Extract features from the content
        features = self._extract_features(feedback.content_text)
        
        # Update weights based on feedback
        for feature in features:
            if feedback.user_action in ['undo_hide', 'keep_shown']:
                # Content should be shown, decrease hiding weight
                self.learning_weights[feature] -= 0.1
            elif feedback.user_action in ['hide_manually', 'hide_shown']:
                # Content should be hidden, increase hiding weight
                self.learning_weights[feature] += 0.1
            
            # Keep weights in reasonable range
            self.learning_weights[feature] = max(-1.0, min(1.0, self.learning_weights[feature]))
    
    def update_pattern_confidence(self, feedback: UserFeedback):
        """
        Update confidence in specific patterns based on feedback
        """
        patterns = self._extract_patterns(feedback.content_text)
        
        for pattern in patterns:
            if feedback.user_action in ['undo_hide', 'keep_shown']:
                # Pattern led to incorrect hiding, decrease confidence
                self.pattern_confidence[pattern] *= 0.9
            elif feedback.user_action in ['hide_manually', 'hide_shown']:
                # Pattern should have led to hiding, increase confidence
                self.pattern_confidence[pattern] *= 1.1
            
            # Keep confidence in reasonable range
            self.pattern_confidence[pattern] = max(0.1, min(2.0, self.pattern_confidence[pattern]))
    
    def _extract_features(self, text: str) -> List[str]:
        """
        Extract features from text for learning
        """
        features = []
        text_lower = text.lower()
        
        # Common content patterns
        if 'shorts' in text_lower:
            features.append('contains_shorts')
        if 'live' in text_lower:
            features.append('contains_live')
        if 'music' in text_lower:
            features.append('contains_music')
        if 'gaming' in text_lower:
            features.append('contains_gaming')
        if 'politics' in text_lower:
            features.append('contains_politics')
        if 'clickbait' in text_lower or '!' in text:
            features.append('contains_clickbait')
        
        # Length features
        if len(text) < 50:
            features.append('short_content')
        elif len(text) > 200:
            features.append('long_content')
        
        # Language features
        if any(char in text for char in '🎵🎮🎬🎯🔥💯'):
            features.append('contains_emojis')
        
        return features
    
    def _extract_patterns(self, text: str) -> List[str]:
        """
        Extract patterns from text for confidence tracking
        """
        patterns = []
        text_lower = text.lower()
        
        # Title patterns
        if text_lower.startswith('how to'):
            patterns.append('how_to_pattern')
        if text_lower.startswith('why'):
            patterns.append('why_pattern')
        if 'vs' in text_lower:
            patterns.append('comparison_pattern')
        if 'review' in text_lower:
            patterns.append('review_pattern')
        
        # Emotional patterns
        if any(word in text_lower for word in ['amazing', 'incredible', 'shocking']):
            patterns.append('emotional_language')
        
        # Question patterns
        if '?' in text:
            patterns.append('question_pattern')
        
        return patterns
    
    def get_improved_blacklist(self, original_blacklist: List[str]) -> List[str]:
        """
        Generate improved blacklist based on learning
        """
        improved_blacklist = original_blacklist.copy()
        
        # Add high-confidence patterns that should be hidden
        for pattern, confidence in self.pattern_confidence.items():
            if confidence > 1.5 and pattern not in improved_blacklist:
                improved_blacklist.append(pattern)
        
        # Remove low-confidence patterns
        improved_blacklist = [
            item for item in improved_blacklist 
            if self.pattern_confidence.get(item, 1.0) > 0.5
        ]
        
        return improved_blacklist
    
    def get_improved_whitelist(self, original_whitelist: List[str]) -> List[str]:
        """
        Generate improved whitelist based on learning
        """
        improved_whitelist = original_whitelist.copy()
        
        # Add features that users consistently want to see
        for feature, weight in self.learning_weights.items():
            if weight < -0.5 and feature not in improved_whitelist:
                improved_whitelist.append(feature)
        
        return improved_whitelist
    
    def get_accuracy_report(self) -> Dict[str, Any]:
        """
        Generate accuracy report for monitoring
        """
        return {
            'overall_accuracy': self.accuracy_metrics.accuracy_rate,
            'total_decisions': self.accuracy_metrics.total_decisions,
            'false_positive_rate': (
                self.accuracy_metrics.false_positives / 
                max(1, self.accuracy_metrics.total_decisions)
            ),
            'false_negative_rate': (
                self.accuracy_metrics.false_negatives / 
                max(1, self.accuracy_metrics.total_decisions)
            ),
            'user_correction_rate': (
                self.accuracy_metrics.user_corrections / 
                max(1, self.accuracy_metrics.total_decisions)
            ),
            'top_learning_weights': dict(
                sorted(self.learning_weights.items(), key=lambda x: abs(x[1]), reverse=True)[:10]
            ),
            'top_pattern_confidence': dict(
                sorted(self.pattern_confidence.items(), key=lambda x: x[1], reverse=True)[:10]
            )
        }
    
    def export_learning_data(self) -> Dict[str, Any]:
        """
        Export learning data for analysis
        """
        return {
            'feedback_history': [asdict(feedback) for feedback in self.feedback_history],
            'accuracy_metrics': asdict(self.accuracy_metrics),
            'learning_weights': dict(self.learning_weights),
            'pattern_confidence': dict(self.pattern_confidence),
            'export_timestamp': time.time()
        }
    
    def import_learning_data(self, data: Dict[str, Any]):
        """
        Import learning data from previous sessions
        """
        if 'feedback_history' in data:
            self.feedback_history = [
                UserFeedback(**feedback) for feedback in data['feedback_history']
            ]
        
        if 'accuracy_metrics' in data:
            self.accuracy_metrics = AccuracyMetrics(**data['accuracy_metrics'])
        
        if 'learning_weights' in data:
            self.learning_weights = defaultdict(float, data['learning_weights'])
        
        if 'pattern_confidence' in data:
            self.pattern_confidence = defaultdict(float, data['pattern_confidence'])

class AdaptiveThresholdSystem:
    """
    System for adapting filtering thresholds based on user behavior
    """
    
    def __init__(self):
        self.base_threshold = 0.5
        self.user_preferences = defaultdict(float)
        self.content_type_thresholds = defaultdict(float)
    
    def adjust_threshold(self, content_type: str, user_feedback: UserFeedback):
        """
        Adjust threshold for specific content type based on feedback
        """
        if user_feedback.user_action in ['undo_hide', 'keep_shown']:
            # User wants more content shown, lower threshold
            self.content_type_thresholds[content_type] -= 0.05
        elif user_feedback.user_action in ['hide_manually', 'hide_shown']:
            # User wants more content hidden, raise threshold
            self.content_type_thresholds[content_type] += 0.05
        
        # Keep thresholds in reasonable range
        self.content_type_thresholds[content_type] = max(0.1, min(0.9, 
            self.content_type_thresholds[content_type]))
    
    def get_adaptive_threshold(self, content_type: str) -> float:
        """
        Get adaptive threshold for content type
        """
        return self.content_type_thresholds.get(content_type, self.base_threshold)



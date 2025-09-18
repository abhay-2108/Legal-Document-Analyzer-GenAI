"""
Legal Document Analyzer Services Package

This package contains the core AI services for document analysis:
- DocumentProcessor: Handles file upload, text extraction, and preprocessing
- DocumentAnalyzer: Provides AI-powered analysis using Gemini API
- WorkflowOrchestrator: Manages the complete document analysis workflow
"""

from .document_processor import DocumentProcessor, ProcessedDocument
from .document_analyzer import (
    DocumentAnalyzer, DocumentEntity, ClauseAnalysis, RiskAssessment,
    ExtractedEntities, ObligationsRights, NormsBenchmarking, 
    Recommendations, AnalysisResult, UserProfile
)
from .workflow_orchestrator import DocumentAnalysisWorkflow, WorkflowResult, WorkflowStatus

__all__ = [
    "DocumentProcessor",
    "ProcessedDocument", 
    "DocumentAnalyzer",
    "DocumentEntity",
    "ClauseAnalysis",
    "RiskAssessment",
    "ExtractedEntities",
    "ObligationsRights", 
    "NormsBenchmarking",
    "Recommendations",
    "AnalysisResult",
    "UserProfile",
    "DocumentAnalysisWorkflow",
    "WorkflowResult",
    "WorkflowStatus"
]

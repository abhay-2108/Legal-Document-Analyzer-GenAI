#!/usr/bin/env python3
"""
Enhanced Legal Document Analyzer API with Full AI Integration
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
import jwt
from datetime import datetime, timedelta
import os
import uuid
import asyncio
import logging
from typing import List, Dict, Any, Optional
import json
from pathlib import Path
from dataclasses import asdict
import tempfile

# Import our AI services
from services.workflow_orchestrator import DocumentAnalysisWorkflow, WorkflowResult
from services.document_analyzer import DocumentAnalyzer, AnalysisResult, UserProfile
from services.document_processor import DocumentProcessor

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Legal Document Analyzer API",
    version="3.0.0",
    description="Comprehensive AI-powered legal document analysis with privacy-preserving features"
)

security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key-here-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables. AI features may not work.")

# Initialize AI services
try:
    workflow_orchestrator = DocumentAnalysisWorkflow(GEMINI_API_KEY) if GEMINI_API_KEY else None
    document_processor = DocumentProcessor()
    document_analyzer = DocumentAnalyzer(GEMINI_API_KEY) if GEMINI_API_KEY else None
except Exception as e:
    logger.error(f"Failed to initialize AI services: {str(e)}")
    workflow_orchestrator = None
    document_processor = DocumentProcessor()  # This should work without API key
    document_analyzer = None

# Pydantic Models
class LoginRequest(BaseModel):
    email: str
    password: str

class UserRegistrationRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str
    workflow_id: str
    file_size: int
    content_type: str

class WorkflowStatusResponse(BaseModel):
    workflow_id: str
    status: str
    progress: float
    current_step: Optional[str]
    estimated_completion: Optional[str]
    steps: List[Dict[str, Any]]
    start_time: str
    error_message: Optional[str] = None

class DocumentAnalysisRequest(BaseModel):
    document_id: str
    analysis_options: Optional[Dict[str, Any]] = {}

class QuestionRequest(BaseModel):
    document_id: str
    question: str

class UserProfileUpdate(BaseModel):
    role: Optional[str] = None
    risk_tolerance: Optional[str] = None
    industry: Optional[str] = None
    experience_level: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = {}

class ExportRequest(BaseModel):
    document_id: str
    format: str = "pdf"  # pdf, json, txt
    sections: List[str] = ["summary", "risks", "recommendations"]

# In-memory storage (replace with database in production)
users_db = {
    "demo@example.com": {
        "user_id": "demo_user",
        "email": "demo@example.com",
        "password": "demo123",
        "name": "Demo User",
        "role": "user",
        "created_at": "2024-01-01T00:00:00Z",
        "profile": {
            "risk_tolerance": "medium",
            "industry": "technology",
            "experience_level": "intermediate"
        }
    },
    "admin@example.com": {
        "user_id": "admin_user",
        "email": "admin@example.com",
        "password": "admin123",
        "name": "Admin User",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z",
        "profile": {
            "risk_tolerance": "low",
            "industry": "legal",
            "experience_level": "expert"
        }
    }
}

documents_db = {}
analysis_results_db = {}

# Helper Functions
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token and return user info"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
        # Find user in database
        user = next((u for u in users_db.values() if u["user_id"] == user_id), None)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def create_jwt_token(user: Dict[str, Any]) -> str:
    """Create JWT token for user"""
    now = datetime.utcnow()
    expiration = now + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        "user_id": user["user_id"],
        "email": user["email"],
        "role": user["role"],
        "name": user["name"],
        "iat": now,
        "exp": expiration
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def check_ai_availability():
    """Check if AI services are available"""
    if not workflow_orchestrator or not document_analyzer:
        raise HTTPException(
            status_code=503, 
            detail="AI services unavailable. Please check GEMINI_API_KEY configuration."
        )

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Legal Document Analyzer API",
        "version": "3.0.0",
        "status": "operational",
        "ai_services": {
            "workflow_orchestrator": workflow_orchestrator is not None,
            "document_analyzer": document_analyzer is not None,
            "document_processor": document_processor is not None
        },
        "features": [
            "Advanced AI Document Analysis",
            "Privacy-Preserving PII Redaction", 
            "Real-time Workflow Processing",
            "Risk Assessment & Classification",
            "Industry Norm Benchmarking",
            "Interactive Q&A System",
            "Comprehensive Reporting",
            "Role-based User Profiles"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "operational",
            "document_processor": "operational",
            "workflow_orchestrator": "operational" if workflow_orchestrator else "unavailable",
            "ai_analyzer": "operational" if document_analyzer else "unavailable"
        },
        "database": {
            "users": len(users_db),
            "documents": len(documents_db),
            "analysis_results": len(analysis_results_db)
        }
    }
    
    overall_health = all(
        service != "unavailable" 
        for service in health_status["services"].values()
    )
    
    if not overall_health:
        health_status["status"] = "degraded"
    
    return health_status

# Authentication Endpoints

@app.post("/auth/login")
async def login(credentials: LoginRequest):
    """User login with JWT token generation"""
    user = users_db.get(credentials.email)
    
    if not user or user["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_jwt_token(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRATION_HOURS * 3600,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "profile": user.get("profile", {})
        }
    }

@app.post("/auth/register")
async def register(registration: UserRegistrationRequest):
    """User registration"""
    if registration.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_data = {
        "user_id": user_id,
        "email": registration.email,
        "password": registration.password,
        "name": registration.name,
        "role": registration.role,
        "created_at": datetime.utcnow().isoformat(),
        "profile": {
            "risk_tolerance": "medium",
            "industry": "general",
            "experience_level": "beginner"
        }
    }
    
    users_db[registration.email] = user_data
    token = create_jwt_token(user_data)
    
    return {
        "message": "Registration successful",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRATION_HOURS * 3600,
        "user": {
            "user_id": user_data["user_id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "role": user_data["role"],
            "profile": user_data["profile"]
        }
    }

@app.get("/auth/profile")
async def get_user_profile(current_user: Dict[str, Any] = Depends(verify_token)):
    """Get user profile"""
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "profile": current_user.get("profile", {}),
        "created_at": current_user.get("created_at")
    }

@app.put("/auth/profile")
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Update user profile"""
    user_email = current_user["email"]
    user = users_db[user_email]
    
    if profile_update.role is not None:
        user["role"] = profile_update.role
    
    # Update profile fields
    if "profile" not in user:
        user["profile"] = {}
    
    if profile_update.risk_tolerance:
        user["profile"]["risk_tolerance"] = profile_update.risk_tolerance
    if profile_update.industry:
        user["profile"]["industry"] = profile_update.industry
    if profile_update.experience_level:
        user["profile"]["experience_level"] = profile_update.experience_level
    if profile_update.preferences:
        user["profile"]["preferences"] = profile_update.preferences
    
    return {"message": "Profile updated successfully", "profile": user["profile"]}

# Document Management Endpoints

@app.post("/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    redaction_level: str = Query("partial", regex="^(none|partial|full)$"),
    analysis_depth: str = Query("comprehensive", regex="^(basic|standard|comprehensive)$"),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Upload and analyze document"""
    check_ai_availability()
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read and validate file content
    content = await file.read()
    if len(content) > 100 * 1024 * 1024:  # 100MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum size: 100MB")
    
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    
    # Generate document ID
    document_id = str(uuid.uuid4())
    
    # Create document record
    document_record = {
        "document_id": document_id,
        "filename": file.filename,
        "file_size": len(content),
        "content_type": file.content_type or "application/octet-stream",
        "upload_timestamp": datetime.utcnow().isoformat(),
        "user_id": current_user["user_id"],
        "status": "uploaded",
        "redaction_level": redaction_level,
        "analysis_depth": analysis_depth
    }
    
    documents_db[document_id] = document_record
    
    # Start background analysis
    workflow_options = {
        "redaction_level": redaction_level,
        "analysis_depth": analysis_depth,
        "enable_benchmarking": True
    }
    
    user_profile = current_user.get("profile", {})
    
    background_tasks.add_task(
        process_document_workflow,
        document_id,
        content,
        file.filename,
        user_profile,
        workflow_options
    )
    
    return DocumentUploadResponse(
        document_id=document_id,
        filename=file.filename,
        message="Document uploaded successfully. AI analysis started.",
        workflow_id="",  # Will be updated when workflow starts
        file_size=len(content),
        content_type=document_record["content_type"]
    )

async def process_document_workflow(
    document_id: str,
    file_content: bytes,
    filename: str,
    user_profile: Dict[str, Any],
    workflow_options: Dict[str, Any]
):
    """Background task to process document through AI workflow"""
    try:
        logger.info(f"Starting workflow for document {document_id}")
        
        # Execute the complete workflow
        workflow_result = await workflow_orchestrator.execute_workflow(
            file_content=file_content,
            filename=filename,
            user_profile=user_profile,
            workflow_options=workflow_options
        )
        
        # Update document record
        documents_db[document_id]["workflow_id"] = workflow_result.workflow_id
        documents_db[document_id]["status"] = "completed"
        
        # Store analysis results
        analysis_results_db[document_id] = {
            "document_id": document_id,
            "workflow_result": workflow_orchestrator.to_dict(workflow_result),
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Workflow completed for document {document_id}")
        
    except Exception as e:
        logger.error(f"Workflow failed for document {document_id}: {str(e)}")
        documents_db[document_id]["status"] = "failed"
        documents_db[document_id]["error_message"] = str(e)

@app.get("/documents")
async def get_documents(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get user documents with pagination and filtering"""
    # Filter documents by user
    user_docs = [
        doc for doc in documents_db.values()
        if doc["user_id"] == current_user["user_id"]
    ]
    
    # Apply search filter
    if search:
        search_lower = search.lower()
        user_docs = [
            doc for doc in user_docs
            if search_lower in doc["filename"].lower()
        ]
    
    # Apply status filter
    if status:
        user_docs = [doc for doc in user_docs if doc["status"] == status]
    
    # Sort by upload time (newest first)
    user_docs.sort(key=lambda x: x["upload_timestamp"], reverse=True)
    
    # Apply pagination
    total = len(user_docs)
    paginated_docs = user_docs[offset:offset + limit]
    
    return {
        "documents": paginated_docs,
        "total": total,
        "offset": offset,
        "limit": limit,
        "has_more": offset + limit < total
    }

@app.get("/documents/{document_id}")
async def get_document_details(
    document_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get detailed document information"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Include analysis results if available
    analysis_results = analysis_results_db.get(document_id)
    
    return {
        "document": doc,
        "analysis_results": analysis_results["workflow_result"] if analysis_results else None
    }

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Delete a document and its analysis results"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete document and analysis results
    del documents_db[document_id]
    if document_id in analysis_results_db:
        del analysis_results_db[document_id]
    
    # Cancel workflow if running
    workflow_id = doc.get("workflow_id")
    if workflow_id and workflow_orchestrator:
        await workflow_orchestrator.cancel_workflow(workflow_id)
    
    return {"message": "Document deleted successfully"}

# Workflow Management Endpoints

@app.get("/workflows/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get real-time workflow status"""
    check_ai_availability()
    
    status = workflow_orchestrator.get_workflow_status(workflow_id)
    if not status:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return status

@app.post("/workflows/{workflow_id}/cancel")
async def cancel_workflow(
    workflow_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Cancel a running workflow"""
    check_ai_availability()
    
    success = await workflow_orchestrator.cancel_workflow(workflow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found or already completed")
    
    return {"message": "Workflow cancelled successfully"}

# Analysis and Q&A Endpoints

@app.post("/documents/{document_id}/question")
async def ask_question(
    document_id: str,
    question_request: QuestionRequest,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Ask a question about a specific document"""
    check_ai_availability()
    
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get analysis results
    analysis_results = analysis_results_db.get(document_id)
    if not analysis_results:
        raise HTTPException(status_code=400, detail="Document analysis not completed")
    
    workflow_result = analysis_results["workflow_result"]
    processed_document = workflow_result.get("processed_document")
    analysis_result = workflow_result.get("analysis_result")
    
    if not processed_document or not analysis_result:
        raise HTTPException(status_code=400, detail="Document analysis data unavailable")
    
    # Use the AI analyzer to answer the question
    document_content = processed_document.get("redacted_content") or processed_document.get("content", "")
    
    try:
        answer = await document_analyzer.answer_question(
            document_content,
            question_request.question,
            analysis_result
        )
        
        return {
            "question": question_request.question,
            "answer": answer,
            "document_id": document_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Question answering failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process question")

@app.post("/documents/{document_id}/reanalyze")
async def reanalyze_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    analysis_request: Optional[DocumentAnalysisRequest] = None,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Re-analyze a document with updated options"""
    check_ai_availability()
    
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # For now, return message that reanalysis would require stored file content
    # In production, you would store the file content or retrieve it from storage
    return {
        "message": "Reanalysis feature requires file content storage. Please re-upload the document.",
        "document_id": document_id
    }

# Analytics and Reporting Endpoints

@app.get("/analytics/dashboard")
async def get_dashboard_analytics(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get dashboard analytics data"""
    user_docs = [doc for doc in documents_db.values() if doc["user_id"] == current_user["user_id"]]
    user_analyses = [res for res in analysis_results_db.values() 
                    if any(doc["document_id"] == res["document_id"] and 
                          doc["user_id"] == current_user["user_id"] 
                          for doc in documents_db.values())]
    
    # Calculate statistics
    total_documents = len(user_docs)
    completed_analyses = len(user_analyses)
    processing_docs = len([doc for doc in user_docs if doc["status"] in ["uploaded", "processing"]])
    
    # Risk distribution from analysis results
    risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for analysis in user_analyses:
        workflow_result = analysis.get("workflow_result", {})
        analysis_result = workflow_result.get("analysis_result", {})
        risk_assessment = analysis_result.get("risk_assessment", {})
        overall_risk = risk_assessment.get("overall_risk_level", "Medium")
        if overall_risk in risk_counts:
            risk_counts[overall_risk] += 1
    
    # Recent documents
    recent_docs = sorted(user_docs, key=lambda x: x["upload_timestamp"], reverse=True)[:5]
    
    return {
        "total_documents": total_documents,
        "completed_analyses": completed_analyses,
        "processing_documents": processing_docs,
        "success_rate": (completed_analyses / max(total_documents, 1)) * 100,
        "risk_distribution": [
            {"name": "Low Risk", "value": risk_counts["Low"], "color": "#4caf50"},
            {"name": "Medium Risk", "value": risk_counts["Medium"], "color": "#ff9800"},
            {"name": "High Risk", "value": risk_counts["High"], "color": "#f44336"},
            {"name": "Critical", "value": risk_counts["Critical"], "color": "#9c27b0"}
        ],
        "recent_documents": recent_docs,
        "system_health": {
            "api_status": "operational",
            "ai_services": "operational" if workflow_orchestrator else "degraded",
            "processing_queue": processing_docs
        }
    }

@app.get("/analytics/detailed")
async def get_detailed_analytics(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get detailed analytics for the Analytics page"""
    user_docs = [doc for doc in documents_db.values() if doc["user_id"] == current_user["user_id"]]
    user_analyses = [res for res in analysis_results_db.values() 
                    if any(doc["document_id"] == res["document_id"] and 
                          doc["user_id"] == current_user["user_id"] 
                          for doc in documents_db.values())]
    
    # Document type distribution
    doc_types = {}
    for analysis in user_analyses:
        workflow_result = analysis.get("workflow_result", {})
        processed_doc = workflow_result.get("processed_document", {})
        file_type = processed_doc.get("file_type", "unknown")
        doc_types[file_type] = doc_types.get(file_type, 0) + 1
    
    # Monthly trends (mock data for demo)
    monthly_trends = [
        {"month": "Jan", "documents": len(user_docs) // 6, "risks": len(user_analyses) // 8},
        {"month": "Feb", "documents": len(user_docs) // 5, "risks": len(user_analyses) // 7},
        {"month": "Mar", "documents": len(user_docs) // 4, "risks": len(user_analyses) // 6},
        {"month": "Apr", "documents": len(user_docs) // 3, "risks": len(user_analyses) // 5},
        {"month": "May", "documents": len(user_docs) // 2, "risks": len(user_analyses) // 4},
        {"month": "Jun", "documents": len(user_docs), "risks": len(user_analyses)}
    ]
    
    return {
        "documents_processed": len(user_docs),
        "success_rate": (len(user_analyses) / max(len(user_docs), 1)) * 100,
        "average_processing_time": 2.3,  # Mock value
        "document_types": [
            {"name": doc_type.replace(".", "").upper(), "count": count, "percentage": (count / max(len(user_docs), 1)) * 100}
            for doc_type, count in doc_types.items()
        ],
        "monthly_trends": monthly_trends,
        "risk_distribution": {
            "Low": sum(1 for a in user_analyses 
                      if a.get("workflow_result", {}).get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "Low"),
            "Medium": sum(1 for a in user_analyses 
                         if a.get("workflow_result", {}).get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "Medium"),
            "High": sum(1 for a in user_analyses 
                       if a.get("workflow_result", {}).get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "High"),
            "Critical": sum(1 for a in user_analyses 
                           if a.get("workflow_result", {}).get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "Critical")
        }
    }

# Export Endpoints

@app.post("/documents/{document_id}/export")
async def export_analysis(
    document_id: str,
    export_request: ExportRequest,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Export analysis results in various formats"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    analysis_results = analysis_results_db.get(document_id)
    if not analysis_results:
        raise HTTPException(status_code=400, detail="No analysis results available")
    
    if export_request.format == "json":
        return JSONResponse(
            content=analysis_results["workflow_result"],
            headers={
                "Content-Disposition": f"attachment; filename={doc['filename']}_analysis.json"
            }
        )
    
    elif export_request.format == "txt":
        # Generate text report
        workflow_result = analysis_results["workflow_result"]
        analysis_result = workflow_result.get("analysis_result", {})
        
        report_lines = [
            f"Document Analysis Report",
            f"=" * 50,
            f"Document: {doc['filename']}",
            f"Analysis Date: {analysis_results['created_at']}",
            f"",
            f"Executive Summary:",
            f"{analysis_result.get('summary', 'Not available')}",
            f"",
            f"Risk Assessment:",
            f"Overall Risk Level: {analysis_result.get('risk_assessment', {}).get('overall_risk_level', 'Unknown')}",
        ]
        
        report_content = "\n".join(report_lines)
        
        return JSONResponse(
            content={"report": report_content},
            headers={
                "Content-Disposition": f"attachment; filename={doc['filename']}_analysis.txt"
            }
        )
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

# System Management Endpoints

@app.post("/system/cleanup")
async def cleanup_system(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Clean up old workflows and temporary data (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if workflow_orchestrator:
        workflow_orchestrator.cleanup_completed_workflows(max_age_hours=24)
    
    return {"message": "System cleanup completed"}

@app.get("/system/stats")
async def get_system_stats(
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get system statistics (admin only)"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "total_users": len(users_db),
        "total_documents": len(documents_db),
        "total_analyses": len(analysis_results_db),
        "active_workflows": len(workflow_orchestrator.active_workflows) if workflow_orchestrator else 0,
        "ai_services": {
            "workflow_orchestrator": workflow_orchestrator is not None,
            "document_analyzer": document_analyzer is not None,
            "document_processor": True
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Legal Document Analyzer API v3.0.0")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")

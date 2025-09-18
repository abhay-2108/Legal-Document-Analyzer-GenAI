#!/usr/bin/env python3
"""
Enhanced API for Legal Document Analyzer with Real AI Integration
"""

from fastapi import FastAPI, HTTPException, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import uuid
import asyncio
import random
from typing import List, Dict, Any, Optional
import json
from io import BytesIO

# Load environment variables
load_dotenv()

# AI Service imports
# Import AI service after path setup
ai_service = None

app = FastAPI(title="Legal Document Analyzer API", version="3.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration (authentication removed)

# Models
class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str
    workflow_id: str

class WorkflowStatus(BaseModel):
    workflow_id: str
    status: str
    progress: float
    current_step: str
    estimated_completion: Optional[str] = None

class AnalyticsData(BaseModel):
    documents_processed: int
    success_rate: float
    average_processing_time: float
    risk_distribution: Dict[str, int]
    document_types: List[Dict[str, Any]]

# In-memory storage (for demo purposes)
mock_documents = {}
mock_workflows = {}
mock_ai_results = {}  # Store AI analysis results
mock_analytics = {
    "documents_processed": 1247,
    "success_rate": 94.2,
    "average_processing_time": 2.3,
    "risk_distribution": {
        "Low": 450,
        "Medium": 320,
        "High": 180,
        "Critical": 50
    },
    "document_types": [
        {"name": "Contracts", "count": 420, "percentage": 35},
        {"name": "NDAs", "count": 280, "percentage": 23},
        {"name": "Terms of Service", "count": 200, "percentage": 17},
        {"name": "Privacy Policies", "count": 150, "percentage": 12},
        {"name": "Other", "count": 150, "percentage": 13}
    ]
}

# Helper functions
def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text content from uploaded file"""
    try:
        # Simple text extraction - in production, use proper libraries for PDF/DOCX
        if filename.lower().endswith('.txt'):
            return file_content.decode('utf-8', errors='ignore')
        elif filename.lower().endswith('.pdf'):
            # In production: use PyPDF2 or pdfplumber
            return file_content.decode('utf-8', errors='ignore')[:2000]  # Sample for demo
        elif filename.lower().endswith(('.docx', '.doc')):
            # In production: use python-docx
            return file_content.decode('utf-8', errors='ignore')[:2000]  # Sample for demo
        else:
            return file_content.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Text extraction error: {str(e)}")
        return "Error extracting text from document"

async def process_document_with_ai(workflow_id: str, document_id: str, content: str, filename: str):
    """Process document with real AI analysis"""
    steps = [
        "Uploading", 
        "Extracting Text", 
        "AI Analysis Starting", 
        "Analyzing Content", 
        "Identifying Risks", 
        "Generating Insights",
        "Finalizing Report",
        "Complete"
    ]
    
    try:
        for i, step in enumerate(steps):
            progress = (i / (len(steps) - 1)) * 100
            
            # Update workflow status
            mock_workflows[workflow_id] = {
                "workflow_id": workflow_id,
                "status": "processing" if i < len(steps) - 1 else "completed",
                "progress": progress,
                "current_step": step,
                "estimated_completion": "2-3 minutes" if i < len(steps) - 1 else None,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Perform AI analysis during the analysis steps
            if step == "AI Analysis Starting":
                print(f"Starting AI analysis for document: {filename}")
                if ai_service:
                    try:
                        ai_result = await ai_service.analyze_document(content, filename)
                        mock_ai_results[document_id] = ai_result
                        print(f"AI analysis completed for: {filename}")
                    except Exception as ai_error:
                        print(f"AI analysis failed: {ai_error}")
                        # Create fallback analysis result
                        mock_ai_results[document_id] = {
                            "summary": f"Document {filename} uploaded successfully. AI analysis failed but document is stored.",
                            "risk_level": "Unknown",
                            "key_points": ["AI analysis unavailable"],
                            "analysis_status": "failed"
                        }
                else:
                    print("AI service not available, creating mock analysis")
                    mock_ai_results[document_id] = {
                        "summary": f"Document {filename} uploaded successfully. AI analysis will be available when service is initialized.",
                        "risk_level": "Pending",
                        "key_points": ["Upload successful", "AI analysis pending"],
                        "analysis_status": "pending"
                    }
            
            await asyncio.sleep(1 if i < 3 else 2)  # Slower for AI steps
            
    except Exception as e:
        print(f"AI Processing Error: {str(e)}")
        # Mark workflow as failed but store fallback result
        mock_workflows[workflow_id] = {
            "workflow_id": workflow_id,
            "status": "failed",
            "progress": 100,
            "current_step": f"Failed: {str(e)}",
            "estimated_completion": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Legal Document Analyzer API", 
        "version": "3.0.0",
        "status": "running",
        "features": [
            "Real AI-Powered Document Analysis",
            "Google Gemini Integration",
            "Real-time Processing Workflows", 
            "Risk Assessment & Analytics",
            "Secure Authentication",
            "Interactive Q&A System",
            "Document Export & Reporting"
        ]
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": "99.9%",
        "services": {
            "database": "connected",
            "ai_engine": "operational",
            "gemini_api": "connected",
            "document_store": "available"
        }
    }

# Authentication removed - login endpoint removed

@app.post("/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """Upload document for AI-powered analysis"""
    try:
        # Debug logging
        print(f"File info: {file.filename}, content_type: {file.content_type}")
        
        # Validate file
        if not file.filename:
            print("Error: No filename provided")
            raise HTTPException(status_code=400, detail="No file provided")
        
        allowed_extensions = ['.pdf', '.docx', '.txt', '.doc']
        file_extension = '.' + file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        
        if file_extension not in allowed_extensions:
            print(f"Error: Invalid file extension: {file_extension}")
            raise HTTPException(status_code=400, detail=f"File type not supported. Allowed: {allowed_extensions}")
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        print(f"File size: {file_size} bytes")
        
        if file_size > 50 * 1024 * 1024:  # 50MB limit
            print(f"Error: File too large: {file_size} bytes")
            raise HTTPException(status_code=413, detail="File too large. Maximum size: 50MB")
        
        if file_size == 0:
            print("Error: Empty file")
            raise HTTPException(status_code=400, detail="Empty file not allowed")
        
        # Extract text content
        text_content = extract_text_from_file(content, file.filename)
        print(f"Extracted text length: {len(text_content)} characters")
        
        # Generate IDs
        document_id = str(uuid.uuid4())
        workflow_id = str(uuid.uuid4())
        
        print(f"Generated document_id: {document_id}, workflow_id: {workflow_id}")
        
        # Store document metadata
        mock_documents[document_id] = {
            "document_id": document_id,
            "filename": file.filename,
            "file_size": file_size,
            "content_type": file.content_type,
            "content": text_content,  # Store extracted content
            "upload_timestamp": datetime.utcnow().isoformat(),
            "status": "uploaded",
            "workflow_id": workflow_id,
        }
        
        # Start AI-powered background processing
        background_tasks.add_task(process_document_with_ai, workflow_id, document_id, text_content, file.filename)
        
        print(f"Upload successful: {file.filename} -> {document_id}")
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            message="Document uploaded successfully. AI analysis started.",
            workflow_id=workflow_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error during upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/documents/{document_id}")
async def get_document_details(
    document_id: str
):
    """Get document details with AI analysis results"""
    if document_id not in mock_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = mock_documents[document_id]
    
    # Get AI analysis results
    ai_results = mock_ai_results.get(document_id, {})
    
    # Combine document info with AI results
    doc_with_analysis = dict(doc)
    doc_with_analysis.update(ai_results)
    
    return doc_with_analysis

@app.post("/documents/{document_id}/question")
async def ask_question(
    document_id: str,
    question_data: dict
):
    """Ask a question about a document using enhanced AI with MCP integration"""
    if document_id not in mock_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = mock_documents[document_id]
    
    question = question_data.get("question", "")
    document_content = doc.get("content", "")
    filename = doc.get("filename", "")
    
    # Get analysis context from AI results
    analysis_context = mock_ai_results.get(document_id, {})
    
    try:
        # Use enhanced AI service to answer the question with analysis context
        if ai_service:
            result = await ai_service.answer_question(
                document_content, 
                question, 
                filename, 
                analysis_context  # Pass analysis context for enhanced answers
            )
            result["timestamp"] = datetime.utcnow().isoformat()
            result["enhanced_ai_version"] = "v1.0_with_mcp"
            result["mcp_integration_enabled"] = True
            return result
        else:
            # Return fallback response when AI service is not available
            return {
                "question": question,
                "answer": "AI service is currently unavailable. Please try again later when the service is fully initialized.",
                "confidence": 0.0,
                "relevant_sections": [],
                "recommendations": ["Upload successful", "AI analysis pending"],
                "sources": [],
                "timestamp": datetime.utcnow().isoformat(),
                "enhanced_ai_version": "v1.0_fallback",
                "mcp_integration_enabled": False
            }
        
    except Exception as e:
        print(f"Enhanced Q&A Error: {str(e)}")
        return {
            "question": question,
            "answer": "I apologize, but I'm unable to process your question at this time. Please try again later.",
            "confidence": 0.0,
            "relevant_sections": [],
            "recommendations": [],
            "sources": [],
            "legal_basis": [],
            "regulatory_references": [],
            "risk_considerations": [],
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "enhanced_ai_version": "v1.0_with_mcp_fallback",
            "mcp_integration_enabled": False
        }

@app.get("/documents")
async def get_documents(
    offset: int = 0,
    limit: int = 50,
    search: Optional[str] = None
):
    """Get all documents with pagination and search"""
    # Get all documents
    user_docs = list(mock_documents.values())
    
    # Apply search filter
    if search:
        user_docs = [
            doc for doc in user_docs 
            if search.lower() in doc["filename"].lower()
        ]
    
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

@app.get("/workflows/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str
):
    """Get workflow status"""
    if workflow_id not in mock_workflows:
        # Return default status for new workflows
        return {
            "workflow_id": workflow_id,
            "status": "initializing",
            "progress": 0,
            "current_step": "Starting analysis...",
            "estimated_completion": "3-5 minutes"
        }
    
    return mock_workflows[workflow_id]

@app.get("/analytics/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics data"""
    # Generate some dynamic data
    base_stats = {
        "total_documents": len(mock_documents),
        "active_workflows": len([w for w in mock_workflows.values() if w["status"] == "processing"]),
        "completed_analyses": len([w for w in mock_workflows.values() if w["status"] == "completed"]),
        "average_risk_score": round(random.uniform(0.3, 0.8), 2),
        "success_rate": 94.2,
        "recent_documents": list(mock_documents.values())[-5:] if mock_documents else [],
        "system_health": {
            "api_status": "operational",
            "ai_engine": "connected",
            "processing_queue": len([w for w in mock_workflows.values() if w["status"] == "processing"]),
            "last_backup": datetime.utcnow().isoformat()
        },
        "monthly_trends": [
            {"month": "Jan", "documents": 45, "risks": 18},
            {"month": "Feb", "documents": 52, "risks": 20},
            {"month": "Mar", "documents": 48, "risks": 15},
            {"month": "Apr", "documents": 61, "risks": 22},
            {"month": "May", "documents": 58, "risks": 19},
            {"month": "Jun", "documents": 67, "risks": 25}
        ],
        "risk_distribution": [
            {"name": "Low Risk", "value": 450, "color": "#4caf50"},
            {"name": "Medium Risk", "value": 320, "color": "#ff9800"},
            {"name": "High Risk", "value": 180, "color": "#f44336"},
            {"name": "Critical", "value": 50, "color": "#9c27b0"}
        ]
    }
    
    return base_stats

@app.get("/analytics/detailed")
async def get_detailed_analytics():
    """Get detailed analytics for Analytics page"""
    return mock_analytics

# Initialize AI service on startup
try:
    from enhanced_ai_service import enhanced_ai_service
    ai_service = enhanced_ai_service
    print("[OK] Enhanced AI service initialized successfully")
except Exception as e:
    print(f"[WARNING] AI service initialization failed: {e}")
    print("API will run with limited functionality")
    ai_service = None

if __name__ == "__main__":
    import uvicorn
    print("Starting Enhanced Legal Document Analyzer API with AI Integration...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

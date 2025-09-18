#!/usr/bin/env python3
"""
Enhanced API for Legal Document Analyzer
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import os
import uuid
import asyncio
import random
from typing import List, Dict, Any, Optional
import json
from io import BytesIO

app = FastAPI(title="Legal Document Analyzer API", version="2.0.0")
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

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
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def simulate_processing(workflow_id: str):
    """Simulate document processing workflow"""
    steps = ["Uploading", "Extracting Text", "Analyzing Content", "Identifying Risks", "Generating Report", "Complete"]
    
    for i, step in enumerate(steps):
        progress = (i / (len(steps) - 1)) * 100
        mock_workflows[workflow_id] = {
            "workflow_id": workflow_id,
            "status": "processing" if i < len(steps) - 1 else "completed",
            "progress": progress,
            "current_step": step,
            "estimated_completion": "2-3 minutes" if i < len(steps) - 1 else None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await asyncio.sleep(2)  # Simulate processing time

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Legal Document Analyzer API", 
        "version": "2.0.0",
        "status": "running",
        "features": [
            "Document Upload & Analysis",
            "Real-time Processing Workflows", 
            "Risk Assessment & Analytics",
            "Secure Authentication",
            "Interactive Dashboard"
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
            "document_store": "available"
        }
    }

@app.post("/auth/login")
async def login(credentials: LoginRequest):
    """Login endpoint with credential validation"""
    # Demo users for testing
    valid_users = {
        "demo@example.com": {
            "password": "demo123",
            "user_id": "demo_user",
            "roles": ["user"],
            "name": "Demo User"
        },
        "admin@example.com": {
            "password": "admin123", 
            "user_id": "admin_user",
            "roles": ["admin", "user"],
            "name": "Admin User"
        }
    }
    
    # Validate credentials
    user_data = valid_users.get(credentials.email)
    if not user_data or user_data["password"] != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    now = datetime.utcnow()
    expiration = now + timedelta(hours=JWT_EXPIRATION_HOURS)
    
    payload = {
        "user_id": user_data["user_id"],
        "email": credentials.email,
        "roles": user_data["roles"],
        "name": user_data["name"],
        "iat": now,
        "exp": expiration
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "access_token": token,
        "token_type": "bearer", 
        "expires_in": JWT_EXPIRATION_HOURS * 3600,
        "user": {
            "user_id": user_data["user_id"],
            "email": credentials.email,
            "name": user_data["name"],
            "roles": user_data["roles"]
        }
    }

@app.post("/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(verify_token)
):
    """Upload document for analysis"""
    try:
        # Debug logging
        print(f"Upload attempt by user: {current_user['user_id']}")
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
            "upload_timestamp": datetime.utcnow().isoformat(),
            "user_id": current_user["user_id"],
            "status": "uploaded",
            "workflow_id": workflow_id,
            "analysis_results": {
                "risk_level": random.choice(["Low", "Medium", "High", "Critical"]),
                "confidence_score": round(random.uniform(0.7, 0.98), 2),
                "key_clauses": random.randint(5, 15),
                "processing_time": round(random.uniform(1.2, 4.5), 1)
            }
        }
        
        # Start background processing
        background_tasks.add_task(simulate_processing, workflow_id)
        
        print(f"Upload successful: {file.filename} -> {document_id}")
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            message="Document uploaded successfully. Processing started.",
            workflow_id=workflow_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error during upload: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/documents")
async def get_documents(
    offset: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """Get user documents with pagination and search"""
    # Filter documents by user
    user_docs = [
        doc for doc in mock_documents.values() 
        if doc["user_id"] == current_user["user_id"]
    ]
    
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

@app.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: dict = Depends(verify_token)
):
    """Delete a document"""
    if document_id not in mock_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = mock_documents[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    del mock_documents[document_id]
    
    return {"message": "Document deleted successfully"}

@app.get("/workflows/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str,
    current_user: dict = Depends(verify_token)
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
async def get_dashboard_analytics(
    current_user: dict = Depends(verify_token)
):
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
            "processing_queue": random.randint(0, 5),
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
async def get_detailed_analytics(
    current_user: dict = Depends(verify_token)
):
    """Get detailed analytics for Analytics page"""
    return mock_analytics

@app.get("/documents/{document_id}")
async def get_document_details(
    document_id: str,
    current_user: dict = Depends(verify_token)
):
    """Get document details"""
    if document_id not in mock_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = mock_documents[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Add mock analysis content
    doc_with_analysis = dict(doc)
    doc_with_analysis.update({
        "content": "Sample legal document content for analysis...",
        "summary": "This document contains standard legal terms and conditions with moderate risk levels.",
        "key_clauses": [
            "Confidentiality Agreement",
            "Liability Limitations", 
            "Termination Clause",
            "Intellectual Property Rights",
            "Dispute Resolution"
        ],
        "risks": [
            {
                "type": "Compliance Risk",
                "level": "Medium",
                "description": "Some clauses may not comply with latest regulations",
                "recommendation": "Review compliance requirements"
            },
            {
                "type": "Liability Risk", 
                "level": "Low",
                "description": "Standard liability limitations appear adequate",
                "recommendation": "No immediate action required"
            }
        ]
    })
    
    return doc_with_analysis

@app.post("/documents/{document_id}/question")
async def ask_question(
    document_id: str,
    question_data: dict,
    current_user: dict = Depends(verify_token)
):
    """Ask a question about a document"""
    if document_id not in mock_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = mock_documents[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    question = question_data.get("question", "")
    
    # Mock AI responses based on question keywords
    responses = {
        "risk": "Based on my analysis, this document has a moderate risk level due to some unclear liability clauses. I recommend reviewing sections 4.2 and 7.1 for potential improvements.",
        "liability": "The liability section limits damages to the contract value and excludes consequential damages. This is standard practice but may need adjustment based on your specific needs.",
        "termination": "The document includes standard termination clauses allowing either party to terminate with 30 days notice. Early termination penalties are outlined in section 8.",
        "compliance": "The document appears to comply with standard legal requirements, though I recommend verifying against current regulations in your jurisdiction.",
        "intellectual property": "Intellectual property rights are clearly defined, with work product ownership typically remaining with the original creator unless explicitly transferred.",
    }
    
    # Find best matching response
    response_text = "I can help you understand this document. Could you please be more specific about what aspect you'd like me to analyze?"
    for keyword, response in responses.items():
        if keyword.lower() in question.lower():
            response_text = response
            break
    
    return {
        "question": question,
        "answer": response_text,
        "confidence": 0.85,
        "sources": ["Document analysis", "Legal knowledge base"],
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/documents/{document_id}/export")
async def export_document(
    document_id: str,
    export_data: dict,
    current_user: dict = Depends(verify_token)
):
    """Export document analysis"""
    if document_id not in mock_documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = mock_documents[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    format_type = export_data.get("format", "json")
    sections = export_data.get("sections", ["summary", "risks", "recommendations"])
    
    # Generate export data
    export_content = {
        "document_info": {
            "filename": doc["filename"],
            "upload_date": doc["upload_timestamp"],
            "analysis_date": datetime.utcnow().isoformat()
        },
        "summary": "This document analysis provides insights into legal risks and compliance issues.",
        "risks": [
            {
                "category": "Compliance",
                "level": "Medium", 
                "description": "Some terms may need regulatory review"
            },
            {
                "category": "Liability",
                "level": "Low",
                "description": "Standard liability protections in place"
            }
        ],
        "recommendations": [
            "Review compliance requirements with legal counsel",
            "Consider updating liability limitations",
            "Verify intellectual property clauses"
        ],
        "key_clauses": doc["analysis_results"]["key_clauses"],
        "confidence_score": doc["analysis_results"]["confidence_score"]
    }
    
    # Filter sections based on request
    filtered_content = {k: v for k, v in export_content.items() if k in sections or k == "document_info"}
    
    if format_type == "json":
        return {
            "content": filtered_content,
            "format": "json",
            "filename": f"{doc['filename']}_analysis.json"
        }
    elif format_type == "text":
        # Convert to text format
        text_content = f"Document Analysis Report\n{'='*50}\n\n"
        text_content += f"Document: {doc['filename']}\n"
        text_content += f"Analysis Date: {datetime.utcnow().isoformat()}\n\n"
        
        if "summary" in sections:
            text_content += f"Summary:\n{filtered_content.get('summary', '')}\n\n"
        
        if "risks" in sections:
            text_content += "Identified Risks:\n"
            for risk in filtered_content.get('risks', []):
                text_content += f"- {risk['category']} ({risk['level']}): {risk['description']}\n"
            text_content += "\n"
        
        if "recommendations" in sections:
            text_content += "Recommendations:\n"
            for rec in filtered_content.get('recommendations', []):
                text_content += f"- {rec}\n"
        
        return {
            "content": text_content,
            "format": "text",
            "filename": f"{doc['filename']}_analysis.txt"
        }
    
    return {
        "content": filtered_content,
        "format": format_type,
        "filename": f"{doc['filename']}_analysis.{format_type}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

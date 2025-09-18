#!/usr/bin/env python3
"""
Working Legal Document Analyzer API with Mock AI Analysis
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import os
import uuid
import asyncio
import logging
from typing import List, Dict, Any, Optional
import json
import random
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Legal Document Analyzer API",
    version="3.0.0",
    description="AI-powered legal document analysis with privacy-preserving features"
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

# Pydantic Models
class LoginRequest(BaseModel):
    email: str
    password: str

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str
    workflow_id: str
    file_size: int
    content_type: str

class QuestionRequest(BaseModel):
    document_id: str
    question: str

# In-memory storage
users_db = {
    "demo@example.com": {
        "user_id": "demo_user",
        "email": "demo@example.com",
        "password": "demo123",
        "name": "Demo User",
        "role": "user",
        "created_at": "2024-01-01T00:00:00Z"
    },
    "admin@example.com": {
        "user_id": "admin_user", 
        "email": "admin@example.com",
        "password": "admin123",
        "name": "Admin User",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z"
    }
}

documents_db = {}
analysis_results_db = {}
workflows_db = {}

# Helper Functions
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token and return user info"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        
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

def generate_mock_analysis(filename: str, content_length: int) -> Dict[str, Any]:
    """Generate mock analysis results for demo purposes"""
    
    # Simulate different document types
    risk_levels = ["Low", "Medium", "High", "Critical"]
    risk_level = random.choice(risk_levels)
    
    # Generate mock clauses
    clause_types = ["liability", "termination", "payment", "confidentiality", "governing_law", "dispute_resolution"]
    clauses = []
    
    for i in range(random.randint(3, 8)):
        clause_type = random.choice(clause_types)
        clauses.append({
            "clause_id": f"clause_{i+1}",
            "text": f"This is a mock {clause_type} clause extracted from the document. It contains important legal terms and conditions that require careful review.",
            "type": clause_type,
            "risk_level": random.choice(["low", "medium", "high"]),
            "confidence": round(random.uniform(0.7, 0.95), 2),
            "explanation": f"This {clause_type} clause has been classified with {random.choice(['standard', 'favorable', 'concerning'])} terms.",
            "suggestions": [f"Review the {clause_type} terms carefully", "Consider legal consultation if needed"],
            "legal_implications": f"This {clause_type} clause may impact your legal obligations and rights."
        })
    
    # Generate mock entities
    entities = {
        "persons": [f"John Smith", f"Jane Doe", f"Legal Representative"],
        "organizations": [f"ABC Corporation", f"Legal Services Inc.", f"Contract Partners LLC"],
        "locations": [f"New York, NY", f"California", f"United States"],
        "dates": [f"2024-01-15", f"2024-12-31", f"2025-06-30"],
        "monetary_amounts": [f"$10,000", f"$50,000", f"$100,000"],
        "other": [f"Contract Number: CNT-2024-001", f"Reference ID: REF-12345"]
    }
    
    # Generate mock risk assessment
    risk_assessment = {
        "overall_risk_level": risk_level,
        "risk_score": random.randint(20, 95),
        "identified_risks": [
            {
                "type": "contractual",
                "severity": risk_level.lower(),
                "description": f"Potential {risk_level.lower()} risk identified in contractual terms"
            },
            {
                "type": "compliance",
                "severity": "medium",
                "description": "Standard compliance considerations apply"
            }
        ],
        "critical_issues": ["Review termination clauses", "Verify liability limits"] if risk_level in ["High", "Critical"] else [],
        "warnings": ["Standard legal review recommended"],
        "recommendations": ["Consider legal consultation", "Review all terms carefully"]
    }
    
    # Generate mock obligations
    obligations = {
        "obligations": [
            {"party": "Party A", "description": "Must provide services as specified in Schedule A"},
            {"party": "Party B", "description": "Must make payments according to agreed schedule"}
        ],
        "rights": [
            {"party": "Party A", "description": "Right to terminate upon 30 days notice"},
            {"party": "Party B", "description": "Right to receive services as contracted"}
        ],
        "deadlines": ["Payment due within 30 days", "Contract renewal by December 31"],
        "payments": ["Monthly fee: $5,000", "Setup fee: $1,000"]
    }
    
    # Generate mock recommendations
    recommendations = {
        "action_items": [
            {"priority": "high", "action": "Review liability limitations carefully", "timeline": "Before signing"},
            {"priority": "medium", "action": "Clarify termination procedures", "timeline": "During negotiation"},
            {"priority": "low", "action": "Consider adding additional protections", "timeline": "If possible"}
        ],
        "priority_items": ["Review all terms", "Understand obligations", "Verify contact details"],
        "warnings": ["Ensure all parties understand their obligations"],
        "next_steps": ["Legal review recommended", "Clarify any unclear terms"]
    }
    
    return {
        "document_id": str(uuid.uuid4()),
        "summary": f"This {filename} appears to be a legal document containing {len(clauses)} key clauses with an overall {risk_level.lower()} risk profile. The document includes standard contractual terms and requires careful review of liability and termination provisions.",
        "detailed_summary": f"Comprehensive analysis of {filename} reveals a {risk_level.lower()} risk document with multiple contractual obligations. Key areas include payment terms, liability limitations, and termination conditions. The document structure follows standard legal formatting with clearly defined sections for parties, obligations, and governing terms.",
        "risk_summary": f"Risk analysis indicates {risk_level.lower()} overall risk with primary concerns in {random.choice(['liability', 'termination', 'payment'])} clauses. Recommended actions include legal review and clarification of key terms.",
        "entities": entities,
        "clauses": clauses,
        "risk_assessment": risk_assessment,
        "obligations": obligations,
        "benchmarking": {
            "compliance_score": random.randint(70, 95),
            "deviations": [{"section": "Standard Terms", "deviation": "Within normal parameters", "severity": "low"}],
            "industry_standards": ["Standard contractual language", "Common legal provisions"],
            "recommendations": ["Follows industry best practices"],
            "document_type": "contract"
        },
        "recommendations": recommendations,
        "metadata": {
            "processing_time": f"{random.randint(30, 120)} seconds",
            "redaction_applied": False,
            "confidence_scores": {
                "legal_document": 0.95,
                "analysis_quality": 0.88
            }
        }
    }

async def simulate_document_processing(document_id: str, filename: str, file_size: int):
    """Simulate document processing workflow"""
    workflow_id = str(uuid.uuid4())
    
    # Create workflow status
    workflows_db[workflow_id] = {
        "workflow_id": workflow_id,
        "status": "processing",
        "progress": 0,
        "steps": [
            {"id": "upload", "name": "Document Upload", "status": "completed", "progress": 100},
            {"id": "extract", "name": "Text Extraction", "status": "running", "progress": 50},
            {"id": "analyze", "name": "AI Analysis", "status": "pending", "progress": 0},
            {"id": "report", "name": "Generate Report", "status": "pending", "progress": 0}
        ],
        "start_time": datetime.utcnow().isoformat(),
        "current_step": "Text Extraction"
    }
    
    # Update document with workflow ID
    documents_db[document_id]["workflow_id"] = workflow_id
    
    # Simulate processing steps
    steps = [
        ("Text Extraction", 25),
        ("Document Validation", 50), 
        ("AI Analysis", 75),
        ("Generating Report", 100)
    ]
    
    for step_name, progress in steps:
        await asyncio.sleep(2)  # Simulate processing time
        
        workflows_db[workflow_id]["progress"] = progress
        workflows_db[workflow_id]["current_step"] = step_name
        
        # Update step statuses
        for i, step in enumerate(workflows_db[workflow_id]["steps"]):
            if progress >= (i + 1) * 25:
                step["status"] = "completed" 
                step["progress"] = 100
            elif progress > i * 25:
                step["status"] = "running"
                step["progress"] = min(100, ((progress - i * 25) / 25) * 100)
    
    # Mark as completed
    workflows_db[workflow_id]["status"] = "completed"
    workflows_db[workflow_id]["end_time"] = datetime.utcnow().isoformat()
    
    # Generate and store analysis results
    analysis_result = generate_mock_analysis(filename, file_size)
    analysis_results_db[document_id] = {
        "document_id": document_id,
        "analysis_result": analysis_result,
        "workflow_result": {
            "workflow_id": workflow_id,
            "status": "completed",
            "processed_document": {
                "filename": filename,
                "content": f"Mock extracted text content from {filename}. This would contain the actual document text in a real implementation.",
                "file_size": file_size,
                "word_count": random.randint(500, 2000)
            },
            "analysis_result": analysis_result
        },
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Update document status
    documents_db[document_id]["status"] = "completed"
    documents_db[document_id]["analysis_results"] = {
        "risk_level": analysis_result["risk_assessment"]["overall_risk_level"],
        "confidence_score": random.randint(85, 98),
        "key_clauses": len(analysis_result["clauses"]),
        "processing_time": random.randint(30, 120)
    }

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Legal Document Analyzer API",
        "version": "3.0.0",
        "status": "operational",
        "ai_services": {
            "workflow_orchestrator": True,
            "document_analyzer": True,
            "document_processor": True
        },
        "features": [
            "Advanced AI Document Analysis",
            "Privacy-Preserving PII Redaction",
            "Real-time Workflow Processing", 
            "Risk Assessment & Classification",
            "Industry Norm Benchmarking",
            "Interactive Q&A System",
            "Comprehensive Reporting"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "operational",
            "document_processor": "operational",
            "workflow_orchestrator": "operational",
            "ai_analyzer": "operational"
        },
        "database": {
            "users": len(users_db),
            "documents": len(documents_db),
            "analysis_results": len(analysis_results_db)
        }
    }

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
            "role": user["role"]
        }
    }

# Document Management Endpoints
@app.post("/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    redaction_level: str = Query("partial", pattern="^(none|partial|full)$"),
    analysis_depth: str = Query("comprehensive", pattern="^(basic|standard|comprehensive)$"),
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Upload and analyze document"""
    
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
    
    # Start background processing
    background_tasks.add_task(simulate_document_processing, document_id, file.filename, len(content))
    
    logger.info(f"Document uploaded: {file.filename} ({len(content)} bytes)")
    
    return DocumentUploadResponse(
        document_id=document_id,
        filename=file.filename,
        message="Document uploaded successfully. AI analysis started.",
        workflow_id="",  # Will be updated when workflow starts
        file_size=len(content),
        content_type=document_record["content_type"]
    )

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
    
    return {"message": "Document deleted successfully"}

# Workflow Management Endpoints
@app.get("/workflows/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Get real-time workflow status"""
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflows_db[workflow_id]

# Q&A System
@app.post("/documents/{document_id}/question")
async def ask_question(
    document_id: str,
    question_request: QuestionRequest,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Ask a question about a specific document"""
    
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get analysis results
    analysis_results = analysis_results_db.get(document_id)
    if not analysis_results:
        raise HTTPException(status_code=400, detail="Document analysis not completed")
    
    # Generate mock answer based on question
    question_lower = question_request.question.lower()
    
    if "risk" in question_lower:
        answer = f"Based on my analysis, this document has a {analysis_results['analysis_result']['risk_assessment']['overall_risk_level'].lower()} risk level. The main risks identified include standard contractual obligations and liability considerations. I recommend reviewing the liability and termination clauses carefully."
    elif "obligation" in question_lower:
        obligations = analysis_results['analysis_result']['obligations']['obligations']
        answer = f"Your main obligations under this document include: {'; '.join([o['description'] for o in obligations[:2]])}. Please ensure you understand all requirements before signing."
    elif "termination" in question_lower:
        answer = "The document contains standard termination provisions. Based on my analysis, termination conditions include standard notice requirements and specific circumstances outlined in the termination clauses. Review these carefully to understand your exit options."
    elif "payment" in question_lower or "fee" in question_lower:
        payments = analysis_results['analysis_result']['obligations']['payments']
        answer = f"The payment terms in this document include: {'; '.join(payments[:2])}. Ensure you understand all financial obligations and payment schedules."
    else:
        answer = f"Based on my analysis of your document '{doc['filename']}', I can provide insights about the content. The document contains {len(analysis_results['analysis_result']['clauses'])} key clauses with {analysis_results['analysis_result']['risk_assessment']['overall_risk_level'].lower()} overall risk. Could you please ask a more specific question about risks, obligations, payments, or termination conditions?"
    
    return {
        "question": question_request.question,
        "answer": answer,
        "document_id": document_id,
        "timestamp": datetime.utcnow().isoformat()
    }

# Export functionality
@app.post("/documents/{document_id}/export")
async def export_analysis(
    document_id: str,
    export_request: dict,
    current_user: Dict[str, Any] = Depends(verify_token)
):
    """Export analysis results"""
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = documents_db[document_id]
    if doc["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    analysis_results = analysis_results_db.get(document_id)
    if not analysis_results:
        raise HTTPException(status_code=400, detail="No analysis results available")
    
    format_type = export_request.get("format", "json")
    
    if format_type == "json":
        return analysis_results["workflow_result"]
    elif format_type == "txt":
        # Generate text report
        analysis = analysis_results["workflow_result"]["analysis_result"]
        
        report = f"""Document Analysis Report
{'='*50}
Document: {doc['filename']}
Analysis Date: {analysis_results['created_at']}

Executive Summary:
{analysis['summary']}

Risk Assessment:
Overall Risk Level: {analysis['risk_assessment']['overall_risk_level']}
Risk Score: {analysis['risk_assessment']['risk_score']}/100

Key Clauses: {len(analysis['clauses'])}
Processing Time: {analysis['metadata']['processing_time']}

Recommendations:
{chr(10).join(['- ' + item['action'] for item in analysis['recommendations']['action_items'][:3]])}
"""
        
        return {"report": report}
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported export format")

# Analytics Endpoints
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
    
    # Calculate risk distribution
    risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for analysis in user_analyses:
        risk_level = analysis.get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level", "Medium")
        if risk_level in risk_counts:
            risk_counts[risk_level] += 1
    
    return {
        "total_documents": len(user_docs),
        "completed_analyses": len(user_analyses),
        "processing_documents": len([doc for doc in user_docs if doc["status"] in ["uploaded", "processing"]]),
        "success_rate": (len(user_analyses) / max(len(user_docs), 1)) * 100,
        "risk_distribution": [
            {"name": "Low Risk", "value": risk_counts["Low"], "color": "#4caf50"},
            {"name": "Medium Risk", "value": risk_counts["Medium"], "color": "#ff9800"},
            {"name": "High Risk", "value": risk_counts["High"], "color": "#f44336"},
            {"name": "Critical", "value": risk_counts["Critical"], "color": "#9c27b0"}
        ],
        "recent_documents": sorted(user_docs, key=lambda x: x["upload_timestamp"], reverse=True)[:5],
        "system_health": {
            "api_status": "operational",
            "ai_services": "operational",
            "processing_queue": len([doc for doc in user_docs if doc["status"] == "processing"])
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
    for doc in user_docs:
        ext = doc['filename'].split('.')[-1].lower() if '.' in doc['filename'] else 'unknown'
        doc_types[ext] = doc_types.get(ext, 0) + 1
    
    return {
        "documents_processed": len(user_docs),
        "success_rate": (len(user_analyses) / max(len(user_docs), 1)) * 100,
        "average_processing_time": 75.5,
        "document_types": [
            {"name": doc_type.upper(), "count": count, "percentage": (count / max(len(user_docs), 1)) * 100}
            for doc_type, count in doc_types.items()
        ],
        "monthly_trends": [
            {"month": "Jan", "documents": max(1, len(user_docs) // 6), "risks": max(1, len(user_analyses) // 8)},
            {"month": "Feb", "documents": max(1, len(user_docs) // 5), "risks": max(1, len(user_analyses) // 7)},
            {"month": "Mar", "documents": max(2, len(user_docs) // 4), "risks": max(1, len(user_analyses) // 6)},
            {"month": "Apr", "documents": max(3, len(user_docs) // 3), "risks": max(2, len(user_analyses) // 5)},
            {"month": "May", "documents": max(5, len(user_docs) // 2), "risks": max(3, len(user_analyses) // 4)},
            {"month": "Jun", "documents": len(user_docs), "risks": len(user_analyses)}
        ],
        "risk_distribution": {
            "Low": len([a for a in user_analyses if a.get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "Low"]),
            "Medium": len([a for a in user_analyses if a.get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "Medium"]), 
            "High": len([a for a in user_analyses if a.get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "High"]),
            "Critical": len([a for a in user_analyses if a.get("analysis_result", {}).get("risk_assessment", {}).get("overall_risk_level") == "Critical"])
        }
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Legal Document Analyzer API v3.0.0 - Working Version")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")

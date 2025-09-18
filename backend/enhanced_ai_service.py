#!/usr/bin/env python3
"""
Enhanced AI Service for Legal Document Analysis 
Integrates Google Gemini with MCP Server functionality
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Dict, List, Any
import json
import re
import asyncio
from datetime import datetime
# Import mcp_server - will be imported after initialization
mcp_server = None

# Load environment variables
load_dotenv()

class EnhancedLegalDocumentAI:
    def __init__(self):
        """Initialize Enhanced Gemini AI service with MCP integration"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        
        # Configure the model
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 64,
                "max_output_tokens": 8192,
            },
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        )
        
        # Initialize MCP server
        try:
            from mcp_server import mcp_server as mcp_instance
            self.mcp_server = mcp_instance
        except ImportError:
            print("Warning: MCP server not available")
            self.mcp_server = None
    
    async def analyze_document(self, content: str, filename: str) -> Dict[str, Any]:
        """Enhanced document analysis with MCP server integration"""
        
        try:
            # Step 1: Classify document type using AI
            doc_type = await self._classify_document_type(content)
            
            # Step 2: Get MCP server insights
            compliance_req = await self.mcp_server.get_compliance_requirements(doc_type)
            structure_validation = await self.mcp_server.validate_document_structure(content, doc_type)
            legal_norms = await self.mcp_server.search_legal_norms(doc_type)
            
            # Step 3: Enhanced AI analysis with MCP context
            ai_analysis = await self._perform_ai_analysis(
                content, filename, doc_type, 
                compliance_req, structure_validation, legal_norms
            )
            
            # Step 4: Calculate enhanced risk using MCP server
            mcp_risk = await self.mcp_server.calculate_risk(ai_analysis)
            
            # Step 5: Combine all insights
            enhanced_analysis = self._combine_analysis_results(
                ai_analysis, compliance_req, structure_validation, 
                legal_norms, mcp_risk, doc_type
            )
            
            return enhanced_analysis
            
        except Exception as e:
            print(f"Enhanced AI Analysis Error: {str(e)}")
            return self._get_fallback_analysis(filename, str(e))
    
    async def _classify_document_type(self, content: str) -> str:
        """Classify document type using AI"""
        classification_prompt = f"""
        Analyze this legal document and classify its type. Return only one of these types:
        - contract
        - privacy_policy
        - terms_of_service
        - employment_agreement
        - intellectual_property
        - compliance_document
        - nda
        - other

        Document content (first 1000 chars):
        {content[:1000]}

        Return only the document type, nothing else.
        """
        
        try:
            response = self.model.generate_content(classification_prompt)
            doc_type = response.text.strip().lower()
            
            # Validate classification
            valid_types = [
                'contract', 'privacy_policy', 'terms_of_service', 
                'employment_agreement', 'intellectual_property', 
                'compliance_document', 'nda', 'other'
            ]
            
            return doc_type if doc_type in valid_types else 'other'
            
        except Exception as e:
            print(f"Document classification error: {e}")
            return 'other'
    
    async def _perform_ai_analysis(self, content: str, filename: str, doc_type: str, 
                                 compliance_req: Dict, structure_validation: Dict, 
                                 legal_norms: Dict) -> Dict[str, Any]:
        """Perform enhanced AI analysis with MCP context"""
        
        prompt = f"""
        You are an expert legal document analyzer with access to compliance databases and legal norms.
        Analyze the following legal document comprehensively.

        Document Information:
        - Filename: {filename}
        - Document Type: {doc_type}
        
        MCP Server Insights:
        - Compliance Requirements: {json.dumps(compliance_req.get('requirements', {}), indent=2)}
        - Structure Completeness: {structure_validation.get('completeness_score', 0)}%
        - Missing Sections: {structure_validation.get('missing_sections', [])}
        - Relevant Legal Norms: {json.dumps(legal_norms.get('results', [])[:2], indent=2)}
        
        Document Content:
        {content}

        Provide comprehensive analysis in this JSON format:
        {{
            "summary": "Detailed summary incorporating MCP insights",
            "document_type": "{doc_type}",
            "key_clauses": ["List of important clauses found"],
            "risks": [
                {{
                    "type": "Risk category",
                    "level": "Low/Medium/High/Critical",
                    "description": "Risk description",
                    "recommendation": "Mitigation strategy",
                    "regulatory_basis": "Which regulation or norm this relates to"
                }}
            ],
            "obligations": [
                {{
                    "party": "Which party",
                    "description": "Obligation description",
                    "deadline": "Deadline if any",
                    "compliance_reference": "Related compliance requirement"
                }}
            ],
            "overall_risk_score": 50,
            "overall_risk_level": "Medium",
            "compliance_issues": ["Issues based on MCP compliance requirements"],
            "recommendations": ["Enhanced recommendations using MCP insights"],
            "confidence_score": 0.85,
            "structure_analysis": {{
                "completeness_score": {structure_validation.get('completeness_score', 0)},
                "missing_sections": {json.dumps(structure_validation.get('missing_sections', []))},
                "structural_recommendations": {json.dumps(structure_validation.get('recommendations', []))}
            }},
            "regulatory_compliance": {{
                "applicable_laws": {json.dumps(compliance_req.get('requirements', {}).get('applicable_laws', []))},
                "compliance_gaps": ["Identified gaps"],
                "required_clauses_status": "Analysis of required clauses presence"
            }}
        }}

        Focus on:
        1. Integration of MCP server compliance requirements
        2. Structural completeness based on document type
        3. Regulatory alignment with identified legal norms
        4. Enhanced risk assessment using both AI and MCP insights
        5. Actionable recommendations based on comprehensive analysis

        Respond with valid JSON only.
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                analysis_result = json.loads(json_str)
            else:
                analysis_result = json.loads(response_text)
            
            return self._validate_enhanced_analysis(analysis_result)
            
        except Exception as e:
            print(f"AI analysis error: {e}")
            return self._get_basic_ai_analysis(doc_type, filename)
    
    def _combine_analysis_results(self, ai_analysis: Dict, compliance_req: Dict, 
                                structure_validation: Dict, legal_norms: Dict, 
                                mcp_risk: Dict, doc_type: str) -> Dict[str, Any]:
        """Combine AI analysis with MCP server results"""
        
        enhanced_analysis = dict(ai_analysis)
        
        # Add MCP server data
        enhanced_analysis.update({
            "analyzed_at": datetime.utcnow().isoformat(),
            "analysis_version": "enhanced_v1.0",
            "mcp_integration": {
                "compliance_requirements": compliance_req,
                "structure_validation": structure_validation,
                "legal_norms_search": legal_norms,
                "mcp_risk_analysis": mcp_risk.get('risk_analysis', {}),
                "mcp_enabled": True
            },
            "enhanced_risk_score": mcp_risk.get('risk_analysis', {}).get('risk_score', 50),
            "enhanced_risk_level": mcp_risk.get('risk_analysis', {}).get('risk_level', 'Medium'),
            "compliance_score": mcp_risk.get('risk_analysis', {}).get('compliance_score', 50)
        })
        
        # Enhance recommendations with MCP insights
        mcp_recommendations = []
        if structure_validation.get('missing_sections'):
            for section in structure_validation.get('missing_sections', []):
                mcp_recommendations.append(f"Add missing section: {section}")
        
        if mcp_risk.get('risk_analysis', {}).get('recommendations'):
            mcp_recommendations.extend(mcp_risk['risk_analysis']['recommendations'])
        
        enhanced_analysis['recommendations'] = list(set(
            enhanced_analysis.get('recommendations', []) + mcp_recommendations
        ))
        
        return enhanced_analysis
    
    async def answer_question(self, document_content: str, question: str, 
                            filename: str, analysis_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Enhanced Q&A with MCP server context"""
        
        try:
            # Get document type from analysis context if available
            doc_type = 'other'
            if analysis_context:
                doc_type = analysis_context.get('document_type', 'other')
            
            # Get relevant legal norms for the question
            legal_norms = await self.mcp_server.search_legal_norms(question)
            
            # Enhanced Q&A prompt with MCP context
            prompt = f"""
            You are an expert legal advisor with access to comprehensive legal databases.
            Answer the user's question based on the document and available legal context.

            Document: {filename}
            Document Type: {doc_type}
            
            Legal Context from Database:
            {json.dumps(legal_norms.get('results', []), indent=2)}
            
            Document Analysis Context:
            {json.dumps(analysis_context or {}, indent=2)[:1000]}...
            
            Document Content:
            {document_content}

            User Question: {question}

            Provide your answer in JSON format:
            {{
                "question": "{question}",
                "answer": "Comprehensive answer incorporating legal database insights",
                "confidence": 0.85,
                "relevant_sections": ["Relevant document sections"],
                "recommendations": ["Actionable recommendations"],
                "sources": ["Document sections supporting the answer"],
                "legal_basis": ["Relevant legal norms and regulations"],
                "regulatory_references": ["Applicable laws and standards"],
                "risk_considerations": ["Any risks related to the question"]
            }}

            Focus on providing accurate, well-sourced answers with regulatory context.
            Respond with valid JSON only.
            """
            
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
            else:
                result = json.loads(response_text)
            
            # Add MCP context to response
            result['mcp_legal_context'] = legal_norms
            result['answered_at'] = datetime.utcnow().isoformat()
            
            return result
            
        except Exception as e:
            print(f"Enhanced Q&A Error: {str(e)}")
            return {
                "question": question,
                "answer": "I apologize, but I'm unable to process your question at this time. Please try rephrasing your question or contact support if the issue persists.",
                "confidence": 0.0,
                "relevant_sections": [],
                "recommendations": [],
                "sources": [],
                "legal_basis": [],
                "regulatory_references": [],
                "risk_considerations": [],
                "error": str(e)
            }
    
    def _validate_enhanced_analysis(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate enhanced analysis result"""
        
        # Basic validation from original service
        defaults = {
            "summary": "Enhanced document analysis completed",
            "document_type": "Legal Document",
            "key_clauses": [],
            "risks": [],
            "obligations": [],
            "overall_risk_score": 50,
            "overall_risk_level": "Medium",
            "compliance_issues": [],
            "recommendations": [],
            "confidence_score": 0.8,
            "structure_analysis": {
                "completeness_score": 0,
                "missing_sections": [],
                "structural_recommendations": []
            },
            "regulatory_compliance": {
                "applicable_laws": [],
                "compliance_gaps": [],
                "required_clauses_status": "Not analyzed"
            }
        }
        
        for key, default_value in defaults.items():
            if key not in result:
                result[key] = default_value
        
        # Validate enhanced fields
        if not isinstance(result.get("structure_analysis"), dict):
            result["structure_analysis"] = defaults["structure_analysis"]
        
        if not isinstance(result.get("regulatory_compliance"), dict):
            result["regulatory_compliance"] = defaults["regulatory_compliance"]
        
        return result
    
    def _get_fallback_analysis(self, filename: str, error: str) -> Dict[str, Any]:
        """Enhanced fallback analysis"""
        
        return {
            "summary": f"Enhanced analysis of {filename} could not be completed. Fallback analysis provided.",
            "document_type": "Legal Document",
            "key_clauses": ["Analysis unavailable - manual review required"],
            "risks": [{
                "type": "Analysis Risk",
                "level": "Medium",
                "description": "Unable to perform comprehensive analysis",
                "recommendation": "Manual legal review recommended",
                "regulatory_basis": "General legal practice"
            }],
            "obligations": [],
            "overall_risk_score": 60,
            "overall_risk_level": "Medium",
            "compliance_issues": ["Analysis service unavailable"],
            "recommendations": [
                "Conduct manual legal review",
                "Consult with legal counsel",
                "Retry analysis when service is available"
            ],
            "confidence_score": 0.3,
            "structure_analysis": {
                "completeness_score": 0,
                "missing_sections": [],
                "structural_recommendations": ["Manual structure review needed"]
            },
            "regulatory_compliance": {
                "applicable_laws": [],
                "compliance_gaps": ["Unable to assess"],
                "required_clauses_status": "Analysis unavailable"
            },
            "analyzed_at": datetime.utcnow().isoformat(),
            "analysis_version": "enhanced_v1.0_fallback",
            "error": error,
            "mcp_integration": {
                "mcp_enabled": False,
                "error": "MCP server integration failed"
            }
        }
    
    def _get_basic_ai_analysis(self, doc_type: str, filename: str) -> Dict[str, Any]:
        """Basic AI analysis when full analysis fails"""
        
        return {
            "summary": f"Basic analysis completed for {filename}",
            "document_type": doc_type,
            "key_clauses": ["Standard legal clauses expected"],
            "risks": [{
                "type": "General Risk",
                "level": "Medium",
                "description": "Standard legal risks for this document type",
                "recommendation": "Professional legal review recommended",
                "regulatory_basis": "General legal standards"
            }],
            "obligations": [],
            "overall_risk_score": 50,
            "overall_risk_level": "Medium",
            "compliance_issues": ["Detailed compliance review needed"],
            "recommendations": ["Seek professional legal advice"],
            "confidence_score": 0.5,
            "structure_analysis": {
                "completeness_score": 50,
                "missing_sections": ["Unable to determine"],
                "structural_recommendations": ["Manual structure review recommended"]
            },
            "regulatory_compliance": {
                "applicable_laws": ["Standard legal requirements"],
                "compliance_gaps": ["Detailed review required"],
                "required_clauses_status": "Manual verification needed"
            }
        }

# Global enhanced instance
enhanced_ai_service = EnhancedLegalDocumentAI()

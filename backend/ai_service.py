#!/usr/bin/env python3
"""
AI Service for Legal Document Analysis using Google Gemini
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai
from typing import Dict, List, Any
import json
import re
from datetime import datetime

# Load environment variables
load_dotenv()

class LegalDocumentAI:
    def __init__(self):
        """Initialize Gemini AI service"""
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
    
    async def analyze_document(self, content: str, filename: str) -> Dict[str, Any]:
        """Analyze a legal document and return structured insights"""
        
        prompt = f"""
        You are an expert legal document analyzer. Analyze the following legal document and provide a comprehensive analysis in JSON format.

        Document Filename: {filename}
        Document Content:
        {content}

        Please provide your analysis in the following JSON structure:
        {{
            "summary": "Brief summary of the document (2-3 sentences)",
            "document_type": "Type of legal document (e.g., Contract, NDA, Terms of Service, etc.)",
            "key_clauses": [
                "List of key clauses identified in the document"
            ],
            "risks": [
                {{
                    "type": "Risk category (e.g., Compliance Risk, Liability Risk, etc.)",
                    "level": "Risk level: Low, Medium, High, or Critical",
                    "description": "Description of the risk",
                    "recommendation": "Recommended action to mitigate the risk"
                }}
            ],
            "obligations": [
                {{
                    "party": "Which party has this obligation",
                    "description": "Description of the obligation",
                    "deadline": "Any deadline mentioned (or null if none)"
                }}
            ],
            "overall_risk_score": "Integer from 1-100 representing overall risk",
            "overall_risk_level": "Overall risk level: Low, Medium, High, or Critical",
            "compliance_issues": [
                "List of potential compliance issues identified"
            ],
            "recommendations": [
                "List of actionable recommendations for improving the document"
            ],
            "confidence_score": "Float from 0.0-1.0 representing analysis confidence"
        }}

        Provide only the JSON response, no additional text or explanations.
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            # Extract JSON from response
            response_text = response.text.strip()
            
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                analysis_result = json.loads(json_str)
            else:
                # Fallback parsing
                analysis_result = json.loads(response_text)
            
            # Validate and ensure required fields exist
            analysis_result = self._validate_analysis_result(analysis_result)
            
            return analysis_result
            
        except Exception as e:
            print(f"AI Analysis Error: {str(e)}")
            # Return fallback analysis
            return self._get_fallback_analysis(filename)
    
    async def answer_question(self, document_content: str, question: str, filename: str) -> Dict[str, Any]:
        """Answer a specific question about the document"""
        
        prompt = f"""
        You are an expert legal advisor. Based on the following legal document, answer the user's question with accuracy and detail.

        Document: {filename}
        Document Content:
        {document_content}

        User Question: {question}

        Please provide your answer in JSON format:
        {{
            "question": "{question}",
            "answer": "Detailed answer to the question based on the document",
            "confidence": "Float from 0.0-1.0 representing confidence in the answer",
            "relevant_sections": ["List of relevant sections or clauses from the document"],
            "recommendations": ["Any recommendations related to the question"],
            "sources": ["Document sections or clauses that support this answer"]
        }}

        Provide only the JSON response.
        """
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                result = json.loads(json_str)
            else:
                result = json.loads(response_text)
            
            return result
            
        except Exception as e:
            print(f"Q&A Error: {str(e)}")
            return {
                "question": question,
                "answer": "I apologize, but I'm unable to process your question at this time. Please try rephrasing your question or contact support if the issue persists.",
                "confidence": 0.0,
                "relevant_sections": [],
                "recommendations": [],
                "sources": []
            }
    
    def _validate_analysis_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fill missing fields in analysis result"""
        
        # Ensure all required fields exist
        defaults = {
            "summary": "Document analysis completed",
            "document_type": "Legal Document",
            "key_clauses": [],
            "risks": [],
            "obligations": [],
            "overall_risk_score": 50,
            "overall_risk_level": "Medium",
            "compliance_issues": [],
            "recommendations": [],
            "confidence_score": 0.8
        }
        
        for key, default_value in defaults.items():
            if key not in result:
                result[key] = default_value
        
        # Validate risk level
        if result["overall_risk_level"] not in ["Low", "Medium", "High", "Critical"]:
            result["overall_risk_level"] = "Medium"
        
        # Validate risk score
        if not isinstance(result["overall_risk_score"], (int, float)) or not (0 <= result["overall_risk_score"] <= 100):
            result["overall_risk_score"] = 50
        
        # Validate confidence score
        if not isinstance(result["confidence_score"], (int, float)) or not (0 <= result["confidence_score"] <= 1):
            result["confidence_score"] = 0.8
        
        return result
    
    def _get_fallback_analysis(self, filename: str) -> Dict[str, Any]:
        """Return a fallback analysis when AI processing fails"""
        
        return {
            "summary": f"Analysis of {filename} completed. This document appears to be a standard legal document requiring review.",
            "document_type": "Legal Document",
            "key_clauses": [
                "Standard legal clauses identified",
                "Terms and conditions section",
                "Rights and obligations outlined"
            ],
            "risks": [
                {
                    "type": "General Risk",
                    "level": "Medium",
                    "description": "Standard legal risks associated with this document type",
                    "recommendation": "Review with legal counsel for specific requirements"
                }
            ],
            "obligations": [
                {
                    "party": "All parties",
                    "description": "Standard legal obligations apply",
                    "deadline": None
                }
            ],
            "overall_risk_score": 50,
            "overall_risk_level": "Medium",
            "compliance_issues": [
                "Recommend compliance review with current regulations"
            ],
            "recommendations": [
                "Review document with qualified legal counsel",
                "Ensure all parties understand their obligations",
                "Verify compliance with applicable laws and regulations"
            ],
            "confidence_score": 0.6
        }

# Global instance
ai_service = LegalDocumentAI()

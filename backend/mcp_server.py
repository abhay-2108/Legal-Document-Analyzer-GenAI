#!/usr/bin/env python3
"""
MCP Server for Legal Document Analyzer
Model Context Protocol integration for external tool access
"""

import asyncio
import json
from typing import Any, Dict, List, Optional
from datetime import datetime
import logging

class LegalNormsDatabase:
    """Mock legal norms database for MCP server"""
    
    def __init__(self):
        self.norms = {
            "gdpr": {
                "name": "General Data Protection Regulation",
                "description": "EU data protection law",
                "key_requirements": [
                    "Data minimization",
                    "Purpose limitation", 
                    "Consent requirements",
                    "Right to erasure",
                    "Data breach notification"
                ],
                "compliance_score": 85
            },
            "ccpa": {
                "name": "California Consumer Privacy Act", 
                "description": "California privacy law",
                "key_requirements": [
                    "Consumer rights disclosure",
                    "Opt-out mechanisms",
                    "Data deletion rights",
                    "Non-discrimination provisions"
                ],
                "compliance_score": 78
            },
            "sox": {
                "name": "Sarbanes-Oxley Act",
                "description": "US corporate governance law",
                "key_requirements": [
                    "Financial reporting accuracy",
                    "Internal controls",
                    "Executive certification",
                    "Auditor independence"
                ],
                "compliance_score": 92
            },
            "pci_dss": {
                "name": "Payment Card Industry Data Security Standard",
                "description": "Credit card security requirements",
                "key_requirements": [
                    "Cardholder data protection",
                    "Encryption requirements",
                    "Access controls",
                    "Regular security testing"
                ],
                "compliance_score": 88
            }
        }
    
    def search_norms(self, query: str) -> List[Dict[str, Any]]:
        """Search legal norms database"""
        results = []
        query_lower = query.lower()
        
        for norm_id, norm_data in self.norms.items():
            if (query_lower in norm_data["name"].lower() or 
                query_lower in norm_data["description"].lower() or
                any(query_lower in req.lower() for req in norm_data["key_requirements"])):
                
                result = dict(norm_data)
                result["norm_id"] = norm_id
                results.append(result)
        
        return results
    
    def get_compliance_requirements(self, document_type: str, jurisdiction: str = "US") -> Dict[str, Any]:
        """Get compliance requirements for document type"""
        requirements = {
            "contract": {
                "applicable_laws": ["common_law", "ucc", "consumer_protection"],
                "key_clauses_required": [
                    "Consideration clause",
                    "Termination provisions", 
                    "Dispute resolution",
                    "Governing law"
                ],
                "risk_factors": ["enforceability", "ambiguity", "compliance"]
            },
            "privacy_policy": {
                "applicable_laws": ["gdpr", "ccpa", "coppa"],
                "key_clauses_required": [
                    "Data collection disclosure",
                    "Purpose of processing",
                    "User rights",
                    "Cookie policy",
                    "Third-party sharing"
                ],
                "risk_factors": ["privacy_violations", "regulatory_fines", "user_trust"]
            },
            "terms_of_service": {
                "applicable_laws": ["consumer_protection", "advertising_law"],
                "key_clauses_required": [
                    "Service description",
                    "User obligations",
                    "Limitation of liability",
                    "Intellectual property rights"
                ],
                "risk_factors": ["user_disputes", "service_abuse", "legal_challenges"]
            }
        }
        
        return requirements.get(document_type.lower(), {
            "applicable_laws": ["general_contract_law"],
            "key_clauses_required": ["Basic legal requirements"],
            "risk_factors": ["legal_compliance"]
        })

class RiskCalculator:
    """Mock risk calculation service for MCP server"""
    
    @staticmethod
    def calculate_document_risk(document_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate risk score based on document analysis"""
        
        # Mock risk calculation logic
        base_risk = 30
        risk_factors = document_analysis.get("risks", [])
        compliance_issues = document_analysis.get("compliance_issues", [])
        
        # Increase risk based on identified issues
        risk_score = base_risk + (len(risk_factors) * 10) + (len(compliance_issues) * 15)
        risk_score = min(risk_score, 100)  # Cap at 100
        
        if risk_score <= 25:
            risk_level = "Low"
        elif risk_score <= 50:
            risk_level = "Medium"  
        elif risk_score <= 75:
            risk_level = "High"
        else:
            risk_level = "Critical"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "compliance_score": max(100 - risk_score, 0),
            "recommendations": [
                "Review identified risk areas",
                "Implement risk mitigation strategies",
                "Regular compliance monitoring"
            ],
            "calculated_at": datetime.utcnow().isoformat()
        }

class MCPServer:
    """Model Context Protocol Server for Legal Document Analyzer"""
    
    def __init__(self):
        self.norms_db = LegalNormsDatabase()
        self.risk_calculator = RiskCalculator()
        self.tools = {
            "search_legal_norms": self.search_legal_norms,
            "get_compliance_requirements": self.get_compliance_requirements,
            "calculate_risk": self.calculate_risk,
            "validate_document_structure": self.validate_document_structure
        }
    
    async def search_legal_norms(self, query: str) -> Dict[str, Any]:
        """Search legal norms database"""
        try:
            results = self.norms_db.search_norms(query)
            return {
                "success": True,
                "results": results,
                "total_found": len(results),
                "query": query
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "results": []
            }
    
    async def get_compliance_requirements(self, document_type: str, jurisdiction: str = "US") -> Dict[str, Any]:
        """Get compliance requirements"""
        try:
            requirements = self.norms_db.get_compliance_requirements(document_type, jurisdiction)
            return {
                "success": True,
                "document_type": document_type,
                "jurisdiction": jurisdiction,
                "requirements": requirements
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def calculate_risk(self, document_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate document risk"""
        try:
            risk_result = self.risk_calculator.calculate_document_risk(document_analysis)
            return {
                "success": True,
                "risk_analysis": risk_result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def validate_document_structure(self, document_content: str, document_type: str) -> Dict[str, Any]:
        """Validate document structure"""
        try:
            # Mock document structure validation
            required_sections = {
                "contract": ["parties", "consideration", "terms", "signatures"],
                "privacy_policy": ["data_collection", "usage", "sharing", "rights"],
                "terms_of_service": ["service_description", "user_obligations", "limitations"]
            }
            
            sections_required = required_sections.get(document_type.lower(), ["basic_structure"])
            sections_found = []
            missing_sections = []
            
            # Simple keyword-based section detection
            content_lower = document_content.lower()
            for section in sections_required:
                if section.replace("_", " ") in content_lower:
                    sections_found.append(section)
                else:
                    missing_sections.append(section)
            
            completeness_score = (len(sections_found) / len(sections_required)) * 100
            
            return {
                "success": True,
                "document_type": document_type,
                "completeness_score": round(completeness_score, 1),
                "sections_found": sections_found,
                "missing_sections": missing_sections,
                "recommendations": [f"Consider adding {section}" for section in missing_sections] if missing_sections else ["Document structure appears complete"]
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def call_tool(self, tool_name: str, **kwargs) -> Dict[str, Any]:
        """Call a specific MCP tool"""
        if tool_name not in self.tools:
            return {
                "success": False,
                "error": f"Tool '{tool_name}' not found. Available tools: {list(self.tools.keys())}"
            }
        
        try:
            return await self.tools[tool_name](**kwargs)
        except Exception as e:
            return {
                "success": False,
                "error": f"Error calling tool '{tool_name}': {str(e)}"
            }
    
    def get_available_tools(self) -> Dict[str, str]:
        """Get list of available tools"""
        return {
            "search_legal_norms": "Search legal norms database for relevant regulations",
            "get_compliance_requirements": "Get compliance requirements for document type",
            "calculate_risk": "Calculate risk score based on document analysis",
            "validate_document_structure": "Validate document structure completeness"
        }

# Global MCP server instance
mcp_server = MCPServer()

# Test function
async def test_mcp_server():
    """Test MCP server functionality"""
    print("Testing MCP Server...")
    
    # Test legal norms search
    norms_result = await mcp_server.search_legal_norms("privacy")
    print(f"Legal norms search result: {norms_result}")
    
    # Test compliance requirements
    compliance_result = await mcp_server.get_compliance_requirements("privacy_policy")
    print(f"Compliance requirements: {compliance_result}")
    
    # Test risk calculation
    mock_analysis = {
        "risks": [
            {"type": "Privacy Risk", "level": "Medium"},
            {"type": "Compliance Risk", "level": "High"}
        ],
        "compliance_issues": ["Missing data retention policy"]
    }
    risk_result = await mcp_server.calculate_risk(mock_analysis)
    print(f"Risk calculation: {risk_result}")
    
    print("MCP Server test completed!")

if __name__ == "__main__":
    asyncio.run(test_mcp_server())

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import google.generativeai as genai
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class DocumentEntity:
    """Represents an extracted entity from the document"""
    type: str
    value: str
    confidence: float
    position: int
    context: str

@dataclass
class ClauseAnalysis:
    """Represents analysis of a document clause"""
    clause_id: str
    text: str
    type: str
    risk_level: str
    confidence: float
    explanation: str
    suggestions: List[str]
    legal_implications: str

@dataclass
class RiskAssessment:
    """Represents risk assessment of the document"""
    overall_risk: str
    overall_risk_level: str  # Alias for compatibility
    risk_score: float
    identified_risks: List[Dict[str, Any]]
    critical_issues: List[str]
    warnings: List[str]
    recommendations: List[str]
    
    def __post_init__(self):
        # Ensure overall_risk_level is set for compatibility
        if not hasattr(self, 'overall_risk_level') or not self.overall_risk_level:
            self.overall_risk_level = self.overall_risk

@dataclass
class ExtractedEntities:
    """Container for extracted entities"""
    persons: List[str]
    organizations: List[str]
    locations: List[str]
    dates: List[str]
    monetary_amounts: List[str]
    other: List[str]

@dataclass
class ObligationsRights:
    """Container for extracted obligations and rights"""
    obligations: List[Dict[str, Any]]
    rights: List[Dict[str, Any]]
    deadlines: List[str]
    payments: List[str]

@dataclass
class NormsBenchmarking:
    """Container for norms benchmarking results"""
    compliance_score: float
    deviations: List[Dict[str, Any]]
    industry_standards: List[str]
    recommendations: List[str]
    document_type: str

@dataclass
class Recommendations:
    """Container for generated recommendations"""
    action_items: List[Dict[str, Any]]
    priority_items: List[str]
    warnings: List[str]
    next_steps: List[str]

@dataclass
class AnalysisResult:
    """Complete analysis result container"""
    document_id: str
    summary: str
    detailed_summary: str
    risk_summary: str
    entities: Optional[ExtractedEntities]
    clauses: List[ClauseAnalysis]
    risk_assessment: Optional[RiskAssessment]
    obligations: Optional[ObligationsRights]
    benchmarking: Optional[NormsBenchmarking]
    recommendations: Optional[Recommendations]
    metadata: Dict[str, Any]

@dataclass
class UserProfile:
    """User profile for personalized analysis"""
    role: str = "individual"  # individual, business, legal_professional
    risk_tolerance: str = "medium"  # low, medium, high
    industry: str = "general"
    experience_level: str = "beginner"  # beginner, intermediate, expert
    preferences: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.preferences is None:
            self.preferences = {}

class DocumentAnalyzer:
    """AI-powered legal document analysis engine"""
    
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Legal clause patterns and risk indicators
        self.clause_patterns = {
            'termination': [r'terminat\w+', r'end this agreement', r'dissolve'],
            'liability': [r'liabilit\w+', r'responsible for', r'damages'],
            'indemnity': [r'indemnif\w+', r'hold harmless', r'defend'],
            'payment': [r'payment', r'fee\w*', r'cost\w*', r'amount'],
            'confidentiality': [r'confidential\w*', r'non-disclosure', r'proprietary'],
            'renewal': [r'renew\w*', r'extend\w*', r'automatic'],
            'governing_law': [r'governing law', r'jurisdiction', r'courts'],
            'dispute_resolution': [r'dispute\w*', r'arbitration', r'mediation']
        }
        
        # Risk indicators
        self.risk_indicators = {
            'high': [
                'unlimited liability', 'no limitation of liability', 'personal guarantee',
                'automatic renewal', 'perpetual license', 'irrevocable',
                'sole discretion', 'may terminate without cause'
            ],
            'medium': [
                'reasonable efforts', 'best efforts', 'material breach',
                'cure period', 'written notice', 'good faith'
            ],
            'critical': [
                'waive all rights', 'forfeit all claims', 'hold harmless for all',
                'unlimited damages', 'criminal liability'
            ]
        }

    async def analyze_document(self, text: str, document_type: str = "contract", 
                             user_profile: str = "individual") -> Dict[str, Any]:
        """
        Comprehensive document analysis including summarization, entity extraction,
        risk assessment, and clause analysis
        """
        try:
            # 1. Document Summarization
            summary = await self._generate_summary(text, user_profile)
            
            # 2. Entity Extraction
            entities = await self._extract_entities(text)
            
            # 3. Clause Segmentation and Classification
            clauses = await self._segment_and_classify_clauses(text)
            
            # 4. Risk Assessment
            risk_assessment = await self._assess_risks(text, clauses, user_profile)
            
            # 5. Key Obligations and Rights
            obligations = await self._extract_obligations_rights(text)
            
            # 6. Norm Benchmarking
            benchmarking = await self._benchmark_against_norms(text, document_type)
            
            # 7. Generate Recommendations
            recommendations = await self._generate_recommendations(
                text, risk_assessment, clauses, user_profile
            )
            
            return {
                'analysis_id': self._generate_analysis_id(),
                'document_type': document_type,
                'user_profile': user_profile,
                'timestamp': datetime.utcnow().isoformat(),
                'summary': summary,
                'entities': entities,
                'clauses': clauses,
                'risk_assessment': risk_assessment.__dict__,
                'obligations_rights': obligations,
                'benchmarking': benchmarking,
                'recommendations': recommendations,
                'confidence_score': self._calculate_overall_confidence(clauses)
            }
            
        except Exception as e:
            logger.error(f"Document analysis failed: {str(e)}")
            raise

    async def _generate_summary(self, text: str, user_profile: str) -> Dict[str, str]:
        """Generate comprehensive document summaries"""
        prompts = {
            'executive': f"""
            Analyze this legal document and provide a clear, executive-level summary.
            User Profile: {user_profile}
            
            Document Text: {text[:4000]}...
            
            Please provide:
            1. One-sentence overview
            2. Key points (3-5 bullets)
            3. Main obligations for each party
            4. Important deadlines or dates
            5. Financial implications
            6. Potential risks or concerns
            
            Use clear, business-friendly language avoiding legal jargon.
            """,
            
            'detailed': f"""
            Provide a detailed analysis of this legal document in simple terms.
            User Profile: {user_profile}
            
            Document: {text[:4000]}...
            
            Explain:
            1. What this document is and its purpose
            2. Who are the parties and their roles
            3. What each party must do (obligations)
            4. What each party gets (rights/benefits)
            5. When things happen (timeline)
            6. Money matters (payments, fees, penalties)
            7. What happens if something goes wrong
            8. How to get out of this agreement
            
            Write as if explaining to someone without legal background.
            """,
            
            'risk_focused': f"""
            Focus on potential risks and concerns in this document.
            User Profile: {user_profile}
            
            Document: {text[:4000]}...
            
            Identify:
            1. Major risks and potential problems
            2. Unfair or one-sided terms
            3. Hidden costs or fees
            4. Difficult exit conditions
            5. Liability exposures
            6. Things that could go wrong
            
            Prioritize risks from most to least concerning.
            """
        }
        
        summaries = {}
        for summary_type, prompt in prompts.items():
            try:
                response = await self.model.generate_content_async(prompt)
                summaries[summary_type] = response.text
            except Exception as e:
                logger.error(f"Summary generation failed for {summary_type}: {str(e)}")
                summaries[summary_type] = "Summary generation failed"
        
        return summaries

    async def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract key entities like parties, dates, amounts, etc."""
        prompt = f"""
        Extract key information from this legal document:
        
        {text[:4000]}...
        
        Find and extract:
        1. Party names and roles (who is involved)
        2. Important dates (deadlines, start/end dates, renewal dates)
        3. Monetary amounts (fees, penalties, limits)
        4. Key terms and definitions
        5. Contact information
        6. Locations and jurisdictions
        7. Document references
        
        Return as JSON format with entity type, value, and context.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            # Parse the response and structure it
            entities_text = response.text
            
            # Also use regex patterns for backup extraction
            regex_entities = self._extract_entities_regex(text)
            
            return {
                'ai_extracted': entities_text,
                'pattern_extracted': regex_entities
            }
        except Exception as e:
            logger.error(f"Entity extraction failed: {str(e)}")
            return {'ai_extracted': "Extraction failed", 'pattern_extracted': []}

    def _extract_entities_regex(self, text: str) -> List[Dict[str, Any]]:
        """Backup entity extraction using regex patterns"""
        entities = []
        
        # Date patterns
        date_patterns = [
            r'\b\d{1,2}/\d{1,2}/\d{4}\b',
            r'\b\d{4}-\d{2}-\d{2}\b',
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b'
        ]
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities.append({
                    'type': 'date',
                    'value': match.group(),
                    'position': match.start(),
                    'confidence': 0.8
                })
        
        # Money patterns
        money_patterns = [
            r'\$[\d,]+\.?\d*',
            r'\b\d+\.\d{2}\s*dollars?\b',
            r'\b\d+\s*USD\b'
        ]
        
        for pattern in money_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entities.append({
                    'type': 'monetary_amount',
                    'value': match.group(),
                    'position': match.start(),
                    'confidence': 0.9
                })
        
        return entities

    async def _segment_and_classify_clauses(self, text: str) -> List[Dict[str, Any]]:
        """Segment document into clauses and classify each one"""
        # First, segment the text into logical sections
        sections = self._segment_text(text)
        
        clauses = []
        for i, section in enumerate(sections):
            # Classify the clause type using AI
            classification = await self._classify_clause(section)
            
            # Assess risk level for this clause
            risk_analysis = await self._analyze_clause_risk(section)
            
            clause = {
                'id': f"clause_{i+1}",
                'text': section[:500] + "..." if len(section) > 500 else section,
                'full_text': section,
                'classification': classification,
                'risk_analysis': risk_analysis,
                'position': i
            }
            clauses.append(clause)
        
        return clauses

    def _segment_text(self, text: str) -> List[str]:
        """Segment document text into logical sections/clauses"""
        # Split by common legal section indicators
        patterns = [
            r'\n\s*\d+\.\s*',  # Numbered sections
            r'\n\s*\([a-z]\)\s*',  # Lettered subsections
            r'\n\s*[A-Z][A-Z\s]+\n',  # ALL CAPS headings
            r'\n\s*SECTION\s+\d+',  # Section headers
            r'\n\s*Article\s+\d+',  # Article headers
        ]
        
        sections = []
        remaining_text = text
        
        for pattern in patterns:
            matches = list(re.finditer(pattern, remaining_text, re.MULTILINE | re.IGNORECASE))
            if matches:
                # Split based on this pattern
                current_pos = 0
                for match in matches:
                    if current_pos < match.start():
                        section = remaining_text[current_pos:match.start()].strip()
                        if section and len(section) > 50:  # Minimum section length
                            sections.append(section)
                    current_pos = match.start()
                
                # Add the last section
                if current_pos < len(remaining_text):
                    section = remaining_text[current_pos:].strip()
                    if section and len(section) > 50:
                        sections.append(section)
                break
        
        # If no patterns found, split by paragraphs
        if not sections:
            paragraphs = text.split('\n\n')
            sections = [p.strip() for p in paragraphs if p.strip() and len(p.strip()) > 100]
        
        return sections[:20]  # Limit to 20 sections for processing

    async def _classify_clause(self, clause_text: str) -> Dict[str, Any]:
        """Classify the type and purpose of a clause"""
        prompt = f"""
        Classify this legal clause and explain its purpose:
        
        Clause: {clause_text[:1000]}...
        
        Identify:
        1. Clause type (e.g., termination, liability, payment, confidentiality, etc.)
        2. Main purpose and function
        3. Who does this clause primarily benefit
        4. Key obligations or rights it creates
        5. Confidence level in classification (1-10)
        
        Respond in JSON format.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return {
                'ai_classification': response.text,
                'pattern_classification': self._classify_clause_patterns(clause_text)
            }
        except Exception as e:
            return {
                'ai_classification': "Classification failed",
                'pattern_classification': self._classify_clause_patterns(clause_text)
            }

    def _classify_clause_patterns(self, clause_text: str) -> Dict[str, Any]:
        """Pattern-based clause classification as backup"""
        clause_lower = clause_text.lower()
        matches = {}
        
        for clause_type, patterns in self.clause_patterns.items():
            for pattern in patterns:
                if re.search(pattern, clause_lower):
                    matches[clause_type] = matches.get(clause_type, 0) + 1
        
        if matches:
            primary_type = max(matches.items(), key=lambda x: x[1])
            return {
                'type': primary_type[0],
                'confidence': min(primary_type[1] * 0.2, 1.0),
                'all_matches': matches
            }
        
        return {'type': 'general', 'confidence': 0.3, 'all_matches': {}}

    async def _analyze_clause_risk(self, clause_text: str) -> Dict[str, Any]:
        """Analyze the risk level of a specific clause"""
        prompt = f"""
        Analyze this legal clause for potential risks and concerns:
        
        Clause: {clause_text[:800]}...
        
        Assess:
        1. Risk level (Low, Medium, High, Critical)
        2. Specific risks or concerns
        3. Who bears more risk (which party is disadvantaged)
        4. Potential negative consequences
        5. Red flags or unusual terms
        6. Suggestions for improvement
        
        Focus on practical implications and fairness.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            ai_risk = response.text
        except:
            ai_risk = "Risk analysis failed"
        
        # Pattern-based risk detection
        pattern_risk = self._detect_risk_patterns(clause_text)
        
        return {
            'ai_analysis': ai_risk,
            'pattern_analysis': pattern_risk,
            'combined_risk_level': self._calculate_combined_risk(ai_risk, pattern_risk)
        }

    def _detect_risk_patterns(self, text: str) -> Dict[str, Any]:
        """Pattern-based risk detection"""
        text_lower = text.lower()
        detected_risks = []
        risk_score = 0
        
        # Check for high-risk patterns
        for risk_phrase in self.risk_indicators['critical']:
            if risk_phrase.lower() in text_lower:
                detected_risks.append({
                    'type': 'critical',
                    'phrase': risk_phrase,
                    'concern': 'Critical risk detected'
                })
                risk_score += 0.4
        
        for risk_phrase in self.risk_indicators['high']:
            if risk_phrase.lower() in text_lower:
                detected_risks.append({
                    'type': 'high',
                    'phrase': risk_phrase,
                    'concern': 'High risk pattern found'
                })
                risk_score += 0.3
        
        for risk_phrase in self.risk_indicators['medium']:
            if risk_phrase.lower() in text_lower:
                detected_risks.append({
                    'type': 'medium',
                    'phrase': risk_phrase,
                    'concern': 'Moderate risk indicator'
                })
                risk_score += 0.1
        
        # Determine overall risk level
        if risk_score >= 0.4:
            risk_level = "Critical"
        elif risk_score >= 0.3:
            risk_level = "High"
        elif risk_score >= 0.1:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        return {
            'risk_level': risk_level,
            'risk_score': min(risk_score, 1.0),
            'detected_risks': detected_risks,
            'risk_count': len(detected_risks)
        }

    def _calculate_combined_risk(self, ai_risk: str, pattern_risk: Dict) -> str:
        """Combine AI and pattern-based risk assessments"""
        # Simple logic to combine risks
        pattern_level = pattern_risk['risk_level']
        
        # If pattern detected critical/high risk, prioritize it
        if pattern_level in ['Critical', 'High']:
            return pattern_level
        
        # Try to extract risk level from AI response
        ai_risk_lower = ai_risk.lower()
        if 'critical' in ai_risk_lower:
            return 'Critical'
        elif 'high' in ai_risk_lower:
            return 'High'
        elif 'medium' in ai_risk_lower:
            return 'Medium'
        else:
            return pattern_level

    async def _assess_risks(self, text: str, clauses: List[Dict], 
                          user_profile: str) -> RiskAssessment:
        """Comprehensive risk assessment of the entire document"""
        prompt = f"""
        Perform a comprehensive risk assessment of this legal document.
        User Profile: {user_profile}
        
        Document: {text[:3000]}...
        
        Provide:
        1. Overall risk level (Low/Medium/High/Critical)
        2. Risk score (0-100)
        3. Top 5 critical issues or concerns
        4. Important warnings for the user
        5. Key recommendations to mitigate risks
        6. Deal-breaker issues (if any)
        7. Fairness assessment (is this balanced?)
        
        Consider the user profile when assessing risks.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            ai_assessment = response.text
        except:
            ai_assessment = "Risk assessment failed"
        
        # Calculate risk based on clause analysis
        clause_risks = [c.get('risk_analysis', {}).get('pattern_analysis', {}).get('risk_score', 0) 
                       for c in clauses]
        avg_risk_score = sum(clause_risks) / len(clause_risks) if clause_risks else 0
        
        # Determine overall risk level
        if avg_risk_score >= 0.4:
            overall_risk = "Critical"
        elif avg_risk_score >= 0.3:
            overall_risk = "High"
        elif avg_risk_score >= 0.2:
            overall_risk = "Medium"
        else:
            overall_risk = "Low"
        
        return RiskAssessment(
            overall_risk=overall_risk,
            risk_score=avg_risk_score * 100,
            critical_issues=[],  # Will be parsed from AI response
            warnings=[],  # Will be parsed from AI response
            recommendations=[]  # Will be parsed from AI response
        )

    async def _extract_obligations_rights(self, text: str) -> Dict[str, List[str]]:
        """Extract obligations and rights for each party"""
        prompt = f"""
        Extract the key obligations and rights from this legal document:
        
        Document: {text[:3000]}...
        
        For each party identified, list:
        1. Their main obligations (what they must do)
        2. Their rights and benefits (what they get)
        3. Deadlines they must meet
        4. Payments they must make or receive
        
        Format as clear lists for each party.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return {'ai_extracted': response.text}
        except:
            return {'ai_extracted': "Extraction failed"}

    async def _benchmark_against_norms(self, text: str, document_type: str) -> Dict[str, Any]:
        """Compare document against standard norms and practices"""
        prompt = f"""
        Compare this {document_type} against standard industry norms and practices:
        
        Document: {text[:2000]}...
        
        Analyze:
        1. How does this compare to typical {document_type} terms?
        2. What terms are more favorable than usual?
        3. What terms are less favorable or unusual?
        4. Industry standard practices that are missing
        5. Terms that deviate significantly from norms
        6. Overall fairness compared to market standards
        
        Provide specific examples and comparisons.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return {
                'analysis': response.text,
                'document_type': document_type,
                'benchmark_date': datetime.utcnow().isoformat()
            }
        except:
            return {
                'analysis': "Benchmarking failed",
                'document_type': document_type,
                'benchmark_date': datetime.utcnow().isoformat()
            }

    async def _generate_recommendations(self, text: str, risk_assessment: RiskAssessment,
                                      clauses: List[Dict], user_profile: str) -> Dict[str, List[str]]:
        """Generate actionable recommendations"""
        prompt = f"""
        Based on this legal document analysis, provide actionable recommendations:
        
        Document excerpt: {text[:2000]}...
        User Profile: {user_profile}
        Overall Risk Level: {risk_assessment.overall_risk}
        
        Provide:
        1. Immediate actions to take before signing
        2. Terms to negotiate or request changes
        3. Questions to ask the other party
        4. Legal consultation recommendations
        5. Alternative approaches or solutions
        6. Red flags to watch out for
        
        Tailor recommendations to the user profile.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return {'recommendations': response.text}
        except:
            return {'recommendations': "Recommendation generation failed"}

    async def answer_question(self, document_text: str, analysis_data: Dict, 
                            question: str) -> str:
        """Answer specific questions about the document"""
        prompt = f"""
        Based on this legal document and its analysis, answer the user's question:
        
        Document: {document_text[:2000]}...
        
        Previous Analysis Summary: {json.dumps(analysis_data.get('summary', {}), indent=2)[:1000]}...
        
        User Question: {question}
        
        Provide a clear, helpful answer that:
        1. Directly addresses the question
        2. References specific parts of the document
        3. Explains implications in simple terms
        4. Suggests next steps if applicable
        5. Warns of any risks related to the question
        
        If the question can't be answered from the document, say so clearly.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            return f"I'm sorry, I couldn't answer your question due to a technical issue: {str(e)}"

    def _generate_analysis_id(self) -> str:
        """Generate unique analysis ID"""
        return f"analysis_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{id(self) % 10000}"

    def _calculate_overall_confidence(self, clauses: List[Dict]) -> float:
        """Calculate overall confidence score for the analysis"""
        if not clauses:
            return 0.5
        
        # Average confidence from clause classifications
        confidences = []
        for clause in clauses:
            classification = clause.get('classification', {})
            pattern_conf = classification.get('pattern_classification', {}).get('confidence', 0.5)
            confidences.append(pattern_conf)
        
        return sum(confidences) / len(confidences) if confidences else 0.5
    
    # New methods for workflow integration
    async def generate_summary(self, text: str, summary_type: str = "executive") -> str:
        """Generate a single summary of the specified type"""
        summaries = await self._generate_summary(text, "user")
        return summaries.get(summary_type, "Summary generation failed")
    
    async def extract_entities(self, text: str) -> ExtractedEntities:
        """Extract entities and return structured result"""
        entities_result = await self._extract_entities(text)
        
        # Parse the AI response to extract structured entities
        # For now, return a basic structure with regex-extracted entities
        regex_entities = entities_result.get('pattern_extracted', [])
        
        persons = []
        organizations = []
        locations = []
        dates = []
        monetary_amounts = []
        other = []
        
        for entity in regex_entities:
            entity_type = entity.get('type')
            value = entity.get('value', '')
            
            if entity_type == 'date':
                dates.append(value)
            elif entity_type == 'monetary_amount':
                monetary_amounts.append(value)
            else:
                other.append(value)
        
        return ExtractedEntities(
            persons=persons,
            organizations=organizations,
            locations=locations,
            dates=dates,
            monetary_amounts=monetary_amounts,
            other=other
        )
    
    async def analyze_clauses(self, text: str) -> List[ClauseAnalysis]:
        """Analyze clauses and return structured results"""
        clauses_data = await self._segment_and_classify_clauses(text)
        
        clause_analyses = []
        for clause_data in clauses_data:
            classification = clause_data.get('classification', {})
            risk_analysis = clause_data.get('risk_analysis', {})
            
            # Extract classification info
            pattern_class = classification.get('pattern_classification', {})
            clause_type = pattern_class.get('type', 'general')
            confidence = pattern_class.get('confidence', 0.5)
            
            # Extract risk info
            pattern_risk = risk_analysis.get('pattern_analysis', {})
            risk_level = pattern_risk.get('risk_level', 'Medium')
            
            clause_analysis = ClauseAnalysis(
                clause_id=clause_data.get('id', ''),
                text=clause_data.get('text', ''),
                type=clause_type,
                risk_level=risk_level.lower(),
                confidence=confidence,
                explanation=f"Classified as {clause_type} clause with {risk_level} risk",
                suggestions=["Review with legal counsel if high risk"],
                legal_implications=f"This {clause_type} clause has {risk_level} risk implications"
            )
            clause_analyses.append(clause_analysis)
        
        return clause_analyses
    
    async def assess_risks(self, text: str) -> RiskAssessment:
        """Assess overall document risks"""
        clauses = await self._segment_and_classify_clauses(text)
        risk_assessment = await self._assess_risks(text, clauses, "user")
        
        # Convert to new format
        return RiskAssessment(
            overall_risk=risk_assessment.overall_risk,
            overall_risk_level=risk_assessment.overall_risk,
            risk_score=risk_assessment.risk_score,
            identified_risks=[
                {'type': 'general', 'severity': risk_assessment.overall_risk.lower(), 'description': 'Overall document risk'}
            ],
            critical_issues=risk_assessment.critical_issues,
            warnings=risk_assessment.warnings,
            recommendations=risk_assessment.recommendations
        )
    
    async def extract_obligations(self, text: str) -> ObligationsRights:
        """Extract obligations and rights"""
        obligations_data = await self._extract_obligations_rights(text)
        
        # Parse AI response (simplified for now)
        return ObligationsRights(
            obligations=[{'party': 'Party 1', 'description': 'General obligations from document analysis'}],
            rights=[{'party': 'Party 1', 'description': 'General rights from document analysis'}],
            deadlines=['As specified in the document'],
            payments=['As specified in the document']
        )
    
    async def benchmark_against_norms(self, text: str, document_type: str) -> NormsBenchmarking:
        """Benchmark document against industry norms"""
        benchmark_data = await self._benchmark_against_norms(text, document_type)
        
        return NormsBenchmarking(
            compliance_score=0.75,  # Default score
            deviations=[{'section': 'General', 'deviation': 'Analysis completed', 'severity': 'low'}],
            industry_standards=['Standard practices for ' + document_type],
            recommendations=['Review against industry standards'],
            document_type=document_type
        )
    
    async def generate_recommendations(self, text: str, user_profile: Dict[str, Any]) -> Recommendations:
        """Generate personalized recommendations"""
        recommendations_data = await self._generate_recommendations(text, RiskAssessment(
            overall_risk="Medium",
            overall_risk_level="Medium", 
            risk_score=50.0,
            identified_risks=[],
            critical_issues=[],
            warnings=[],
            recommendations=[]
        ), [], user_profile.get('role', 'individual'))
        
        return Recommendations(
            action_items=[
                {'priority': 'high', 'action': 'Review document thoroughly', 'timeline': 'Before signing'},
                {'priority': 'medium', 'action': 'Consider legal consultation', 'timeline': 'If complex terms found'}
            ],
            priority_items=['Review all terms', 'Understand obligations'],
            warnings=['Ensure understanding of all clauses'],
            next_steps=['Complete review', 'Seek advice if needed']
        )
    
    async def answer_question(self, document_text: str, question: str, analysis_data: Optional[AnalysisResult] = None) -> str:
        """Answer question about document with optional analysis context"""
        # Call the existing answer_question method from the base implementation
        analysis_dict = analysis_data.__dict__ if analysis_data else {}
        prompt = f"""
        Based on this legal document and its analysis, answer the user's question:
        
        Document: {document_text[:2000]}...
        
        Previous Analysis Summary: {json.dumps(analysis_dict, indent=2)[:1000] if analysis_dict else 'No analysis available'}...
        
        User Question: {question}
        
        Provide a clear, helpful answer that:
        1. Directly addresses the question
        2. References specific parts of the document
        3. Explains implications in simple terms
        4. Suggests next steps if applicable
        5. Warns of any risks related to the question
        
        If the question can't be answered from the document, say so clearly.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            return f"I'm sorry, I couldn't answer your question due to a technical issue: {str(e)}"

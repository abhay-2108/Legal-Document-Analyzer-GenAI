import asyncio
import logging
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime, timedelta
import json
import uuid

from .document_analyzer import DocumentAnalyzer, AnalysisResult
from .document_processor import DocumentProcessor, ProcessedDocument

logger = logging.getLogger(__name__)

class WorkflowStatus(Enum):
    """Workflow execution status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class StepStatus(Enum):
    """Individual step status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

@dataclass
class WorkflowStep:
    """Represents a single step in the workflow"""
    id: str
    name: str
    description: str
    status: StepStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    progress: float = 0.0
    dependencies: List[str] = None

    def __post_init__(self):
        if self.dependencies is None:
            self.dependencies = []

@dataclass
class WorkflowResult:
    """Complete workflow execution result"""
    workflow_id: str
    status: WorkflowStatus
    processed_document: Optional[ProcessedDocument]
    analysis_result: Optional[AnalysisResult]
    steps: List[WorkflowStep]
    start_time: datetime
    end_time: Optional[datetime]
    total_duration: Optional[timedelta]
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}

class DocumentAnalysisWorkflow:
    """
    Orchestrates the complete document analysis workflow
    """
    
    def __init__(self, gemini_api_key: str):
        self.document_processor = DocumentProcessor()
        self.document_analyzer = DocumentAnalyzer(gemini_api_key)
        self.active_workflows: Dict[str, WorkflowResult] = {}
        self.step_registry: Dict[str, Callable] = {}
        self._register_default_steps()

    def _register_default_steps(self):
        """Register default workflow steps"""
        self.step_registry.update({
            'document_processing': self._step_document_processing,
            'pii_redaction': self._step_pii_redaction,
            'document_validation': self._step_document_validation,
            'structure_analysis': self._step_structure_analysis,
            'ai_analysis': self._step_ai_analysis,
            'summary_generation': self._step_summary_generation,
            'entity_extraction': self._step_entity_extraction,
            'clause_analysis': self._step_clause_analysis,
            'risk_assessment': self._step_risk_assessment,
            'obligation_extraction': self._step_obligation_extraction,
            'norms_benchmarking': self._step_norms_benchmarking,
            'recommendation_generation': self._step_recommendation_generation,
            'final_compilation': self._step_final_compilation
        })

    async def execute_workflow(
        self,
        file_content: bytes,
        filename: str,
        user_profile: Optional[Dict[str, Any]] = None,
        workflow_options: Optional[Dict[str, Any]] = None
    ) -> WorkflowResult:
        """
        Execute the complete document analysis workflow
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            user_profile: User preferences and profile information
            workflow_options: Workflow configuration options
        
        Returns:
            WorkflowResult with complete analysis
        """
        workflow_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        # Parse workflow options
        options = workflow_options or {}
        redaction_level = options.get('redaction_level', 'partial')
        analysis_depth = options.get('analysis_depth', 'comprehensive')
        enable_benchmarking = options.get('enable_benchmarking', True)
        
        # Initialize workflow steps
        steps = self._create_workflow_steps(options)
        
        # Create workflow result
        workflow_result = WorkflowResult(
            workflow_id=workflow_id,
            status=WorkflowStatus.PROCESSING,
            processed_document=None,
            analysis_result=None,
            steps=steps,
            start_time=start_time,
            end_time=None,
            total_duration=None,
            metadata={
                'filename': filename,
                'user_profile': user_profile,
                'workflow_options': options
            }
        )
        
        self.active_workflows[workflow_id] = workflow_result
        
        try:
            # Execute workflow steps
            context = {
                'file_content': file_content,
                'filename': filename,
                'user_profile': user_profile,
                'redaction_level': redaction_level,
                'analysis_depth': analysis_depth,
                'enable_benchmarking': enable_benchmarking,
                'workflow_id': workflow_id
            }
            
            await self._execute_workflow_steps(workflow_result, context)
            
            # Mark as completed
            workflow_result.status = WorkflowStatus.COMPLETED
            workflow_result.end_time = datetime.utcnow()
            workflow_result.total_duration = workflow_result.end_time - workflow_result.start_time
            
            logger.info(f"Workflow {workflow_id} completed successfully in {workflow_result.total_duration}")
            
        except Exception as e:
            workflow_result.status = WorkflowStatus.FAILED
            workflow_result.error_message = str(e)
            workflow_result.end_time = datetime.utcnow()
            
            logger.error(f"Workflow {workflow_id} failed: {str(e)}")
            raise
        
        return workflow_result

    def _create_workflow_steps(self, options: Dict[str, Any]) -> List[WorkflowStep]:
        """Create workflow steps based on options"""
        steps = [
            WorkflowStep(
                id="document_processing",
                name="Document Processing",
                description="Extract text and metadata from uploaded document",
                status=StepStatus.PENDING
            ),
            WorkflowStep(
                id="pii_redaction",
                name="PII Redaction",
                description="Identify and redact personally identifiable information",
                status=StepStatus.PENDING,
                dependencies=["document_processing"]
            ),
            WorkflowStep(
                id="document_validation",
                name="Document Validation",
                description="Validate document format and identify document type",
                status=StepStatus.PENDING,
                dependencies=["document_processing"]
            ),
            WorkflowStep(
                id="structure_analysis",
                name="Structure Analysis",
                description="Analyze document structure and extract key sections",
                status=StepStatus.PENDING,
                dependencies=["document_processing"]
            ),
            WorkflowStep(
                id="ai_analysis",
                name="AI Analysis Initialization",
                description="Initialize AI analysis with document content",
                status=StepStatus.PENDING,
                dependencies=["pii_redaction", "document_validation"]
            ),
            WorkflowStep(
                id="summary_generation",
                name="Summary Generation",
                description="Generate executive and detailed summaries",
                status=StepStatus.PENDING,
                dependencies=["ai_analysis"]
            ),
            WorkflowStep(
                id="entity_extraction",
                name="Entity Extraction",
                description="Extract key entities and parties",
                status=StepStatus.PENDING,
                dependencies=["ai_analysis"]
            ),
            WorkflowStep(
                id="clause_analysis",
                name="Clause Analysis",
                description="Analyze and classify document clauses",
                status=StepStatus.PENDING,
                dependencies=["structure_analysis", "ai_analysis"]
            ),
            WorkflowStep(
                id="risk_assessment",
                name="Risk Assessment",
                description="Assess document risks and compliance issues",
                status=StepStatus.PENDING,
                dependencies=["clause_analysis", "entity_extraction"]
            ),
            WorkflowStep(
                id="obligation_extraction",
                name="Obligation Extraction",
                description="Extract key obligations and rights",
                status=StepStatus.PENDING,
                dependencies=["clause_analysis"]
            )
        ]
        
        # Add optional steps based on configuration
        if options.get('enable_benchmarking', True):
            steps.append(WorkflowStep(
                id="norms_benchmarking",
                name="Norms Benchmarking",
                description="Benchmark against industry norms and standards",
                status=StepStatus.PENDING,
                dependencies=["risk_assessment", "obligation_extraction"]
            ))
        
        steps.append(WorkflowStep(
            id="recommendation_generation",
            name="Recommendation Generation",
            description="Generate personalized recommendations",
            status=StepStatus.PENDING,
            dependencies=["risk_assessment", "obligation_extraction"]
        ))
        
        steps.append(WorkflowStep(
            id="final_compilation",
            name="Final Compilation",
            description="Compile final analysis results",
            status=StepStatus.PENDING,
            dependencies=["recommendation_generation"]
        ))
        
        return steps

    async def _execute_workflow_steps(self, workflow_result: WorkflowResult, context: Dict[str, Any]):
        """Execute workflow steps in dependency order"""
        steps_by_id = {step.id: step for step in workflow_result.steps}
        completed_steps = set()
        
        while len(completed_steps) < len(workflow_result.steps):
            # Find steps ready to execute
            ready_steps = []
            for step in workflow_result.steps:
                if (step.status == StepStatus.PENDING and 
                    all(dep_id in completed_steps for dep_id in step.dependencies)):
                    ready_steps.append(step)
            
            if not ready_steps:
                failed_steps = [s for s in workflow_result.steps if s.status == StepStatus.FAILED]
                if failed_steps:
                    raise Exception(f"Workflow blocked by failed steps: {[s.id for s in failed_steps]}")
                else:
                    raise Exception("Workflow deadlock detected")
            
            # Execute ready steps (can be parallelized)
            tasks = []
            for step in ready_steps:
                task = self._execute_step(step, context)
                tasks.append(task)
            
            # Wait for all ready steps to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for step, result in zip(ready_steps, results):
                if isinstance(result, Exception):
                    step.status = StepStatus.FAILED
                    step.error_message = str(result)
                    step.end_time = datetime.utcnow()
                    
                    # Check if this is a critical step
                    if step.id in ['document_processing', 'ai_analysis']:
                        raise result
                    else:
                        logger.warning(f"Non-critical step {step.id} failed: {str(result)}")
                else:
                    step.status = StepStatus.COMPLETED
                    step.result = result
                    step.end_time = datetime.utcnow()
                    step.progress = 100.0
                    completed_steps.add(step.id)
                    
                    # Update context with step results
                    context[f"{step.id}_result"] = result

    async def _execute_step(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single workflow step"""
        step.status = StepStatus.RUNNING
        step.start_time = datetime.utcnow()
        step.progress = 0.0
        
        logger.info(f"Executing step: {step.name}")
        
        try:
            if step.id in self.step_registry:
                result = await self.step_registry[step.id](step, context)
                return result or {}
            else:
                raise ValueError(f"Unknown step: {step.id}")
                
        except Exception as e:
            step.status = StepStatus.FAILED
            step.error_message = str(e)
            raise

    # Step implementations
    async def _step_document_processing(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process document and extract text"""
        step.progress = 10.0
        
        processed_doc = self.document_processor.extract_text_from_file(
            context['file_content'], 
            context['filename']
        )
        
        step.progress = 50.0
        
        # Get processing statistics
        stats = self.document_processor.get_processing_statistics(processed_doc)
        
        step.progress = 100.0
        
        # Update workflow result
        workflow_result = self.active_workflows[context['workflow_id']]
        workflow_result.processed_document = processed_doc
        
        return {
            'processed_document': processed_doc,
            'statistics': stats
        }

    async def _step_pii_redaction(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Redact PII from document"""
        step.progress = 20.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        
        if not processed_doc:
            raise ValueError("No processed document available for PII redaction")
        
        redacted_text, redactions = self.document_processor.redact_pii(
            processed_doc.content,
            context['redaction_level']
        )
        
        step.progress = 80.0
        
        # Update processed document
        processed_doc.redacted_content = redacted_text
        
        step.progress = 100.0
        
        return {
            'redacted_text': redacted_text,
            'redactions': redactions,
            'redaction_count': len(redactions)
        }

    async def _step_document_validation(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate document format and type"""
        step.progress = 30.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        
        validation = self.document_processor.validate_document_format(processed_doc.content)
        
        step.progress = 100.0
        
        return {
            'validation': validation,
            'is_legal_document': validation['is_legal_document'],
            'confidence_score': validation['confidence_score'],
            'document_type_hints': validation['document_type_hints']
        }

    async def _step_structure_analysis(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze document structure"""
        step.progress = 25.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        
        structure = self.document_processor.identify_document_structure(processed_doc.content)
        step.progress = 60.0
        
        key_sections = self.document_processor.extract_key_sections(processed_doc.content)
        step.progress = 100.0
        
        return {
            'structure': structure,
            'key_sections': key_sections,
            'section_count': len(key_sections)
        }

    async def _step_ai_analysis(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Initialize AI analysis"""
        step.progress = 30.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        
        # Use redacted content if available
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        step.progress = 100.0
        
        return {
            'analysis_ready': True,
            'text_length': len(text_to_analyze),
            'using_redacted': processed_doc.redacted_content is not None
        }

    async def _step_summary_generation(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate document summaries"""
        step.progress = 20.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        # Generate executive summary
        executive_summary = await self.document_analyzer.generate_summary(
            text_to_analyze, "executive"
        )
        step.progress = 50.0
        
        # Generate detailed summary
        detailed_summary = await self.document_analyzer.generate_summary(
            text_to_analyze, "detailed"
        )
        step.progress = 80.0
        
        # Generate risk-focused summary
        risk_summary = await self.document_analyzer.generate_summary(
            text_to_analyze, "risk_focused"
        )
        step.progress = 100.0
        
        return {
            'executive_summary': executive_summary,
            'detailed_summary': detailed_summary,
            'risk_summary': risk_summary
        }

    async def _step_entity_extraction(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract entities from document"""
        step.progress = 30.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        entities = await self.document_analyzer.extract_entities(text_to_analyze)
        step.progress = 100.0
        
        return {
            'entities': entities,
            'entity_count': len(entities.persons) + len(entities.organizations) + len(entities.locations) + len(entities.dates) + len(entities.monetary_amounts)
        }

    async def _step_clause_analysis(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze document clauses"""
        step.progress = 30.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        clauses = await self.document_analyzer.analyze_clauses(text_to_analyze)
        step.progress = 100.0
        
        return {
            'clauses': clauses,
            'clause_count': len(clauses),
            'high_risk_clauses': len([c for c in clauses if c.risk_level == 'high'])
        }

    async def _step_risk_assessment(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Assess document risks"""
        step.progress = 40.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        risk_assessment = await self.document_analyzer.assess_risks(text_to_analyze)
        step.progress = 100.0
        
        return {
            'risk_assessment': risk_assessment,
            'overall_risk': risk_assessment.overall_risk_level,
            'critical_risks': len([r for r in risk_assessment.identified_risks if r['severity'] == 'critical'])
        }

    async def _step_obligation_extraction(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Extract obligations and rights"""
        step.progress = 40.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        obligations = await self.document_analyzer.extract_obligations(text_to_analyze)
        step.progress = 100.0
        
        return {
            'obligations': obligations,
            'obligation_count': len(obligations.obligations),
            'rights_count': len(obligations.rights)
        }

    async def _step_norms_benchmarking(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Benchmark against norms"""
        step.progress = 50.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        # Get document type from validation step
        validation_result = context.get('document_validation_result', {})
        document_type = validation_result.get('document_type_hints', ['general_contract'])[0]
        
        benchmarking = await self.document_analyzer.benchmark_against_norms(
            text_to_analyze, document_type
        )
        step.progress = 100.0
        
        return {
            'benchmarking': benchmarking,
            'compliance_score': benchmarking.compliance_score,
            'deviations_count': len(benchmarking.deviations)
        }

    async def _step_recommendation_generation(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate recommendations"""
        step.progress = 40.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        processed_doc = workflow_result.processed_document
        text_to_analyze = processed_doc.redacted_content or processed_doc.content
        
        user_profile = context.get('user_profile', {})
        
        recommendations = await self.document_analyzer.generate_recommendations(
            text_to_analyze, user_profile
        )
        step.progress = 100.0
        
        return {
            'recommendations': recommendations,
            'recommendation_count': len(recommendations.action_items),
            'high_priority_count': len([r for r in recommendations.action_items if r['priority'] == 'high'])
        }

    async def _step_final_compilation(self, step: WorkflowStep, context: Dict[str, Any]) -> Dict[str, Any]:
        """Compile final analysis results"""
        step.progress = 20.0
        
        workflow_result = self.active_workflows[context['workflow_id']]
        
        # Compile all results into final AnalysisResult
        analysis_result = AnalysisResult(
            document_id=str(uuid.uuid4()),
            summary=context.get('summary_generation_result', {}).get('executive_summary', ''),
            detailed_summary=context.get('summary_generation_result', {}).get('detailed_summary', ''),
            risk_summary=context.get('summary_generation_result', {}).get('risk_summary', ''),
            entities=context.get('entity_extraction_result', {}).get('entities'),
            clauses=context.get('clause_analysis_result', {}).get('clauses', []),
            risk_assessment=context.get('risk_assessment_result', {}).get('risk_assessment'),
            obligations=context.get('obligation_extraction_result', {}).get('obligations'),
            benchmarking=context.get('norms_benchmarking_result', {}).get('benchmarking'),
            recommendations=context.get('recommendation_generation_result', {}).get('recommendations'),
            metadata={
                'processing_time': str(datetime.utcnow() - workflow_result.start_time),
                'redaction_applied': context.get('pii_redaction_result', {}).get('redaction_count', 0) > 0,
                'confidence_scores': {
                    'legal_document': context.get('document_validation_result', {}).get('confidence_score', 0.0),
                    'analysis_quality': 0.85  # TODO: Implement quality scoring
                }
            }
        )
        
        step.progress = 80.0
        
        # Update workflow result
        workflow_result.analysis_result = analysis_result
        
        step.progress = 100.0
        
        return {
            'analysis_result': analysis_result,
            'compilation_complete': True
        }

    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a workflow"""
        if workflow_id not in self.active_workflows:
            return None
        
        workflow_result = self.active_workflows[workflow_id]
        
        return {
            'workflow_id': workflow_id,
            'status': workflow_result.status.value,
            'progress': self._calculate_overall_progress(workflow_result),
            'steps': [
                {
                    'id': step.id,
                    'name': step.name,
                    'status': step.status.value,
                    'progress': step.progress,
                    'error_message': step.error_message
                }
                for step in workflow_result.steps
            ],
            'start_time': workflow_result.start_time.isoformat(),
            'current_step': self._get_current_step(workflow_result),
            'estimated_completion': self._estimate_completion_time(workflow_result)
        }

    def _calculate_overall_progress(self, workflow_result: WorkflowResult) -> float:
        """Calculate overall workflow progress"""
        if not workflow_result.steps:
            return 0.0
        
        total_progress = sum(step.progress for step in workflow_result.steps)
        return total_progress / len(workflow_result.steps)

    def _get_current_step(self, workflow_result: WorkflowResult) -> Optional[str]:
        """Get currently executing step"""
        for step in workflow_result.steps:
            if step.status == StepStatus.RUNNING:
                return step.name
        return None

    def _estimate_completion_time(self, workflow_result: WorkflowResult) -> Optional[str]:
        """Estimate workflow completion time"""
        completed_steps = [s for s in workflow_result.steps if s.status == StepStatus.COMPLETED]
        running_steps = [s for s in workflow_result.steps if s.status == StepStatus.RUNNING]
        
        if not completed_steps and not running_steps:
            return None
        
        # Simple estimation based on average step time
        if completed_steps:
            avg_step_time = sum(
                (s.end_time - s.start_time).total_seconds() 
                for s in completed_steps if s.end_time and s.start_time
            ) / len(completed_steps)
            
            remaining_steps = len([s for s in workflow_result.steps if s.status == StepStatus.PENDING])
            estimated_seconds = remaining_steps * avg_step_time
            
            estimated_completion = datetime.utcnow() + timedelta(seconds=estimated_seconds)
            return estimated_completion.isoformat()
        
        return None

    async def cancel_workflow(self, workflow_id: str) -> bool:
        """Cancel a running workflow"""
        if workflow_id not in self.active_workflows:
            return False
        
        workflow_result = self.active_workflows[workflow_id]
        if workflow_result.status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED]:
            return False
        
        workflow_result.status = WorkflowStatus.CANCELLED
        workflow_result.end_time = datetime.utcnow()
        
        # Mark pending/running steps as cancelled
        for step in workflow_result.steps:
            if step.status in [StepStatus.PENDING, StepStatus.RUNNING]:
                step.status = StepStatus.SKIPPED
                step.end_time = datetime.utcnow()
        
        logger.info(f"Workflow {workflow_id} cancelled")
        return True

    def cleanup_completed_workflows(self, max_age_hours: int = 24):
        """Clean up old completed workflows"""
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        workflows_to_remove = []
        for workflow_id, workflow_result in self.active_workflows.items():
            if (workflow_result.status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED] and
                workflow_result.end_time and workflow_result.end_time < cutoff_time):
                workflows_to_remove.append(workflow_id)
        
        for workflow_id in workflows_to_remove:
            del self.active_workflows[workflow_id]
        
        logger.info(f"Cleaned up {len(workflows_to_remove)} old workflows")
        
    def to_dict(self, workflow_result: WorkflowResult) -> Dict[str, Any]:
        """Convert WorkflowResult to dictionary for API response"""
        return {
            'workflow_id': workflow_result.workflow_id,
            'status': workflow_result.status.value,
            'processed_document': asdict(workflow_result.processed_document) if workflow_result.processed_document else None,
            'analysis_result': asdict(workflow_result.analysis_result) if workflow_result.analysis_result else None,
            'steps': [
                {
                    'id': step.id,
                    'name': step.name,
                    'description': step.description,
                    'status': step.status.value,
                    'progress': step.progress,
                    'start_time': step.start_time.isoformat() if step.start_time else None,
                    'end_time': step.end_time.isoformat() if step.end_time else None,
                    'error_message': step.error_message,
                    'result': step.result
                }
                for step in workflow_result.steps
            ],
            'start_time': workflow_result.start_time.isoformat(),
            'end_time': workflow_result.end_time.isoformat() if workflow_result.end_time else None,
            'total_duration': str(workflow_result.total_duration) if workflow_result.total_duration else None,
            'error_message': workflow_result.error_message,
            'metadata': workflow_result.metadata
        }

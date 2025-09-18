import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';
import { useParams } from 'react-router-dom';

const WorkflowStatus = () => {
  const { workflowId } = useParams();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          Workflow Status
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Track the progress of your document analysis workflow.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Workflow ID: {workflowId}
          </Typography>
          <Typography color="textSecondary">
            This feature will show real-time workflow progress, analysis results, and detailed insights.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default WorkflowStatus;

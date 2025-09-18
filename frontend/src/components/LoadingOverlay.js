import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  Fade,
  LinearProgress,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const StyledBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(3),
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  animation: `${float} 3s ease-in-out infinite`,
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  animation: `${pulse} 2s ease-in-out infinite`,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 600,
}));

const LoadingOverlay = ({
  open = false,
  message = 'Loading...',
  progress = null,
  fullScreen = true,
  transparent = false,
}) => {
  const content = (
    <StyledBox>
      <CircularProgress
        size={60}
        thickness={4}
        sx={{
          color: 'primary.main',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      
      <LoadingText variant="h6" align="center">
        {message}
      </LoadingText>
      
      {progress !== null && (
        <Box sx={{ width: '100%', maxWidth: 300 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(45deg, #1976d2, #9c27b0)',
              },
            }}
          />
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{ mt: 1 }}
          >
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </StyledBox>
  );

  if (fullScreen) {
    return (
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: transparent ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        open={open}
      >
        <Fade in={open} timeout={300}>
          <div>{content}</div>
        </Fade>
      </Backdrop>
    );
  }

  return (
    <Fade in={open} timeout={300}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: transparent ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      >
        {content}
      </Box>
    </Fade>
  );
};

export default LoadingOverlay;

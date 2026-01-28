import React from 'react';
import { Typography, Box } from '@mui/material';

const InlineContentRenderer = ({ content }) => {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Function to render formatted content
  const renderFormattedContent = (text) => {
    // Split content into paragraphs and process each one
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      // Handle headers (lines starting with #)
      if (trimmed.startsWith('#')) {
        const headerLevel = trimmed.match(/^#+/)?.[0].length || 1;
        const headerText = trimmed.replace(/^#+\s*/, '');
        const headerVariant = headerLevel === 1 ? 'h5' : headerLevel === 2 ? 'h6' : 'subtitle1';
        
        return (
          <Typography 
            key={index} 
            variant={headerVariant} 
            fontWeight="bold" 
            color="primary.main"
            sx={{ mt: index > 0 ? 3 : 0, mb: 1.5 }}
          >
            {headerText}
          </Typography>
        );
      }

      // Handle bullet points (lines starting with -, *, or •)
      if (trimmed.match(/^[-*•]\s+/)) {
        const listItems = trimmed.split('\n').filter(line => line.trim().match(/^[-*•]\s+/));
        return (
          <Box key={index} component="ul" sx={{ mt: index > 0 ? 2 : 0, mb: 2, pl: 2 }}>
            {listItems.map((item, itemIndex) => (
              <Typography 
                key={itemIndex} 
                component="li" 
                variant="body1" 
                sx={{ mb: 0.5, lineHeight: 1.7 }}
              >
                {item.replace(/^[-*•]\s+/, '')}
              </Typography>
            ))}
          </Box>
        );
      }

      // Handle numbered lists (lines starting with numbers)
      if (trimmed.match(/^\d+\.\s+/)) {
        const listItems = trimmed.split('\n').filter(line => line.trim().match(/^\d+\.\s+/));
        return (
          <Box key={index} component="ol" sx={{ mt: index > 0 ? 2 : 0, mb: 2, pl: 2 }}>
            {listItems.map((item, itemIndex) => (
              <Typography 
                key={itemIndex} 
                component="li" 
                variant="body1" 
                sx={{ mb: 0.5, lineHeight: 1.7 }}
              >
                {item.replace(/^\d+\.\s+/, '')}
              </Typography>
            ))}
          </Box>
        );
      }

      // Handle regular paragraphs
      return (
        <Typography 
          key={index} 
          variant="body1" 
          sx={{ 
            mt: index > 0 ? 2 : 0,
            mb: 1,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap'
          }}
        >
          {trimmed}
        </Typography>
      );
    }).filter(Boolean); // Remove null entries
  };

  return (
    <Box sx={{ width: '100%' }}>
      {renderFormattedContent(content)}
    </Box>
  );
};

export default InlineContentRenderer;
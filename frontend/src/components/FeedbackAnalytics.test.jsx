import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedbackAnalytics from './FeedbackAnalytics';

test('renders FeedbackAnalytics', () => {
  render(<FeedbackAnalytics />);
  expect(screen.getByText(/feedback/i)).toBeInTheDocument();
}); 
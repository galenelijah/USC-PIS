import React from 'react';
import { render, screen } from '@testing-library/react';
import FeedbackForm from './FeedbackForm';

test('renders submit button', () => {
  render(<FeedbackForm />);
  const button = screen.getByRole('button', { name: /submit/i });
  expect(button).toBeInTheDocument();
}); 
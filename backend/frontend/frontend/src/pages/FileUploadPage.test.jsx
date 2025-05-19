import React from 'react';
import { render, screen } from '@testing-library/react';
import FileUploadPage from './FileUploadPage';

test('renders upload button or area', () => {
  render(<FileUploadPage />);
  const upload = screen.getByText(/upload/i);
  expect(upload).toBeInTheDocument();
}); 
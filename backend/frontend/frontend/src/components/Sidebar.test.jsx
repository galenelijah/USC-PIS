import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

test('renders Sidebar or navigation', () => {
  render(<Sidebar />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
}); 
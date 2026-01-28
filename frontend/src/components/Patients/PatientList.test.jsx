import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientList from './PatientList';

const mockPatients = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    gender: 'M',
    email: 'john.doe@example.com',
    phone_number: '123-456-7890',
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    date_of_birth: '1985-05-15',
    gender: 'F',
    email: 'jane.smith@example.com',
    phone_number: '098-765-4321',
    created_at: '2023-01-02T00:00:00Z',
  },
];

describe('PatientList Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders patient list correctly', () => {
    render(
      <PatientList
        patients={mockPatients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('1990-01-01')).toBeInTheDocument();
    expect(screen.getByText('1985-05-15')).toBeInTheDocument();
  });

  it('renders add new patient button', () => {
    render(
      <PatientList
        patients={mockPatients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Add New Patient')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <PatientList
        patients={mockPatients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButtons = screen.getAllByTestId('EditIcon');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <PatientList
        patients={mockPatients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByTestId('DeleteIcon');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockPatients[0].id);
  });

  it('renders empty list when no patients provided', () => {
    render(
      <PatientList
        patients={[]}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('handles null patients prop gracefully', () => {
    render(
      <PatientList
        patients={null}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Add New Patient')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    render(
      <PatientList
        patients={mockPatients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('sorts patients by creation date (newest first)', () => {
    const unsortedPatients = [
      { ...mockPatients[0], created_at: '2023-01-01T00:00:00Z' },
      { ...mockPatients[1], created_at: '2023-01-03T00:00:00Z' },
    ];

    render(
      <PatientList
        patients={unsortedPatients}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const rows = screen.getAllByRole('row');
    // Skip header row, first data row should be Jane Smith (newer)
    expect(rows[1]).toHaveTextContent('Jane Smith');
    expect(rows[2]).toHaveTextContent('John Doe');
  });
});
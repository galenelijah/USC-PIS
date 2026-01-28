import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { authService } from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  authService: {
    getDashboardStats: jest.fn(),
  },
}));

const mockStore = configureStore({
  reducer: {
    auth: (state = { user: null, isAuthenticated: false }) => state,
  },
});

const renderWithProviders = (ui, { user = null, ...renderOptions } = {}) => {
  const Wrapper = ({ children }) => (
    <Provider store={mockStore}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    const mockUser = { role: 'ADMIN', completeSetup: true };
    authService.getDashboardStats.mockResolvedValue({
      data: {
        total_patients: 10,
        total_records: 25,
        recent_patients: [],
        visits_by_month: [],
        appointments_today: 2,
        pending_requests: 3,
      },
    });

    renderWithProviders(<Dashboard user={mockUser} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders admin dashboard for admin user', async () => {
    const mockUser = { role: 'ADMIN', completeSetup: true };
    authService.getDashboardStats.mockResolvedValue({
      data: {
        total_patients: 10,
        total_records: 25,
        recent_patients: [],
        visits_by_month: [],
        appointments_today: 2,
        pending_requests: 3,
      },
    });

    renderWithProviders(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, admin/i)).toBeInTheDocument();
    });
  });

  it('renders student dashboard for student user', async () => {
    const mockUser = { role: 'STUDENT', completeSetup: true };
    authService.getDashboardStats.mockResolvedValue({
      data: {
        next_appointment: null,
        recent_health_info: 'COVID-19 Vaccination Drive',
        profile_completion: 80,
      },
    });

    renderWithProviders(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText(/welcome back, student/i)).toBeInTheDocument();
    });
  });

  it('shows warning when profile setup is incomplete', async () => {
    const mockUser = { role: 'STUDENT', completeSetup: false };
    authService.getDashboardStats.mockResolvedValue({
      data: {
        next_appointment: null,
        recent_health_info: 'COVID-19 Vaccination Drive',
        profile_completion: 50,
      },
    });

    renderWithProviders(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText(/profile setup is not complete/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    const mockUser = { role: 'ADMIN', completeSetup: true };
    authService.getDashboardStats.mockRejectedValue(new Error('API Error'));

    renderWithProviders(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
    });
  });

  it('renders statistics cards correctly', async () => {
    const mockUser = { role: 'ADMIN', completeSetup: true };
    authService.getDashboardStats.mockResolvedValue({
      data: {
        total_patients: 150,
        total_records: 300,
        recent_patients: [],
        visits_by_month: [],
        appointments_today: 5,
        pending_requests: 2,
      },
    });

    renderWithProviders(<Dashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // Total patients
      expect(screen.getByText('300')).toBeInTheDocument(); // Total records
      expect(screen.getByText('5')).toBeInTheDocument(); // Appointments today
      expect(screen.getByText('2')).toBeInTheDocument(); // Pending requests
    });
  });
});
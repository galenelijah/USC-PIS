import { api, handleApiError } from './api';

export const medicalCertificateService = {
  getAll: async () => {
    try {
      return await api.get('/medical-certificates/certificates/');
    } catch (error) {
      handleApiError(error);
    }
  },

  getById: async (id) => {
    try {
      return await api.get(`/medical-certificates/certificates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  create: async (data) => {
    try {
      return await api.post('/medical-certificates/certificates/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  update: async (id, data) => {
    try {
      return await api.put(`/medical-certificates/certificates/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },

  delete: async (id) => {
    try {
      return await api.delete(`/medical-certificates/certificates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Workflow actions
  submit: async (id) => {
    try {
      return await api.post(`/medical-certificates/certificates/${id}/submit/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  approve: async (id) => {
    try {
      return await api.post(`/medical-certificates/certificates/${id}/approve/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  reject: async (id) => {
    try {
      return await api.post(`/medical-certificates/certificates/${id}/reject/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Template operations
  getAllTemplates: async () => {
    try {
      return await api.get('/medical-certificates/templates/');
    } catch (error) {
      handleApiError(error);
    }
  },

  getTemplateById: async (id) => {
    try {
      return await api.get(`/medical-certificates/templates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  createTemplate: async (data) => {
    try {
      return await api.post('/medical-certificates/templates/', data);
    } catch (error) {
      handleApiError(error);
    }
  },

  updateTemplate: async (id, data) => {
    try {
      return await api.put(`/medical-certificates/templates/${id}/`, data);
    } catch (error) {
      handleApiError(error);
    }
  },

  deleteTemplate: async (id) => {
    try {
      return await api.delete(`/medical-certificates/templates/${id}/`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Additional helper methods
  getByPatient: async (patientId) => {
    try {
      return await api.get(`/medical-certificates/certificates/?patient=${patientId}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  getByStatus: async (status) => {
    try {
      return await api.get(`/medical-certificates/certificates/?status=${status}`);
    } catch (error) {
      handleApiError(error);
    }
  }
}; 
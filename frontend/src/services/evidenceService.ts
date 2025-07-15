import axiosInstance from '../config/axiosConfig';

export const getPendingEvidence = async () => {
  const { data } = await axiosInstance.get('/api/v1/evidence');
  return data;
};

export const approveEvidence = async (id: string) => {
  const { data } = await axiosInstance.post(`/api/v1/evidence/${id}/approve`);
  return data;
};

export const rejectEvidence = async (id: string) => {
  const { data } = await axiosInstance.post(`/api/v1/evidence/${id}/reject`);
  return data;
};

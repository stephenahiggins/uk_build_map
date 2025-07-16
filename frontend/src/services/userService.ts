import axiosInstance from '../config/axiosConfig';

export const update_profile = async (payload: { user_name?: string; user_email?: string }) => {
  const { data } = await axiosInstance.put('/api/v1/auth/update', payload);
  return data;
};


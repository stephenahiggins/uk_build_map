import axiosInstance from '../config/axiosConfig';

// Define types for the expected responses
export interface Region {
  id: string;
  name: string;
}

export interface LocalAuthority {
  id: string;
  name: string;
  regionId: string;
}

const BASE_URL = process.env.REACT_APP_METADATA_API_URL || '';

const metadataService = {
  async getRegions(): Promise<Region[]> {
    const response = await axiosInstance.get(`${BASE_URL}/regions`);
    return response.data;
  },

  async getLocalAuthorities(regionId?: string): Promise<LocalAuthority[]> {
    let url = `${BASE_URL}/local-authorities`;
    if (regionId) {
      url += `?regionId=${regionId}`;
    }
    const response = await axiosInstance.get(url);
    return response.data;
  },
};

export default metadataService;

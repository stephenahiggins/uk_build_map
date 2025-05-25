import axiosInstance from '../config/axiosConfig';
import sortBy from 'lodash/sortBy';

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

const metadataService = {
  async getRegions(): Promise<Region[]> {
    const response = await axiosInstance.get(`/api/v1/regions`);
    return response.data;
  },

  async getLocalAuthorities(regionId?: string): Promise<LocalAuthority[]> {
    let url = `/api/v1/local-authorities`;
    if (regionId) {
      url += `?regionId=${regionId}`;
    }
    const response = await axiosInstance.get(url);
    // Sort alphabetically by 'name' property
    return sortBy(response.data, 'name');
  },
};

export default metadataService;

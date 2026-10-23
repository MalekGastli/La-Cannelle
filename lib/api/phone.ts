import { apiClient } from '../api';

export interface PhoneCountryFlagItem {
  iso2: string;
  name: string;
  flagEmoji: string;
  flagPng?: string;
  flagSvg?: string;
  flagAlt?: string;
}

export interface PhoneCountryFlagResponse {
  callingCode: string;
  countries: PhoneCountryFlagItem[];
}

export const phoneApi = {
  async getCountryFlagByPhone(phone: string): Promise<PhoneCountryFlagResponse> {
    const endpoint = `/phone/country-flag?phone=${encodeURIComponent(phone)}`;
    const response = await apiClient.get<PhoneCountryFlagResponse>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to resolve phone country flag');
  },

  async getCountryFlagByCallingCode(callingCode: string): Promise<PhoneCountryFlagResponse> {
    const endpoint = `/phone/country-flag?callingCode=${encodeURIComponent(callingCode)}`;
    const response = await apiClient.get<PhoneCountryFlagResponse>(endpoint);
    if (response.data) {
      return response.data;
    }
    throw new Error(response.error || 'Failed to resolve calling code flag');
  },
};


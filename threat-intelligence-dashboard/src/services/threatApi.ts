import axios from 'axios';
import { API_ENDPOINTS, APP_LIMITS } from '@/constants';

// API Configuration
const API_CONFIG = {
  abuseDB: {
    key: process.env.ABUSEIPDB_API_KEY,
    url: API_ENDPOINTS.ABUSEDB,
  },
  ipqs: {
    key: process.env.IPQS_API_KEY,
    url: API_ENDPOINTS.IPQS,
  },
  ipapi: {
    url: API_ENDPOINTS.IPAPI,
  },
} as const;

// Error handler
const handleError = (error: unknown): never => {
  if (!axios.isAxiosError(error) || !error.response) {
    throw new Error('An unknown API error occurred.');
  }

  const { status, data } = error.response;
  
  let message: string;
  if (data?.errors?.[0]?.detail) {
    message = data.errors[0].detail;
  } else if (status === 429) {
    message = 'Rate limit reached for the external API. Please try again later.';
  } else {
    message = `API returned status ${status}`;
  }

  const apiError = new Error(message) as Error & { status: number };
  apiError.status = status;
  throw apiError;
};

// AbuseIPDB
export const fetchAbuseIPDB = async (ip: string) => {
  if (!API_CONFIG.abuseDB.key) {
    throw new Error('ABUSEIPDB_API_KEY is not set.');
  }

  try {
    const { data } = await axios.get(API_CONFIG.abuseDB.url, {
      params: {
        ipAddress: ip,
        maxAgeInDays: APP_LIMITS.ABUSE_DB_MAX_AGE_DAYS,
        verbose: true,
      },
      headers: {
        Accept: 'application/json',
        Key: API_CONFIG.abuseDB.key,
      },
    });
    return data.data;
  } catch (error) {
    handleError(error);
  }
};

// IPQualityScore
export const fetchIPQualityScore = async (ip: string) => {
  if (!API_CONFIG.ipqs.key) {
    throw new Error('IPQS_API_KEY is not set.');
  }

  try {
    const url = `${API_CONFIG.ipqs.url}/${API_CONFIG.ipqs.key}/${ip}`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    handleError(error);
  }
};

// IPAPI
export const fetchIPAPI = async (ip: string) => {
  const url = `${API_CONFIG.ipapi.url}/${ip}/json/`;

  try {
    const { data } = await axios.get(url);

    if (data.error) {
      throw new Error(`IPAPI error: ${data.reason}`);
    }

    return data;
  } catch (error) {
    handleError(error);
  }
};
// API Endpoints
export const API_ENDPOINTS = {
  ABUSEDB: 'https://api.abuseipdb.com/api/v2/check',
  IPQS: 'https://www.ipqualityscore.com/api/json/ip',
  IPAPI: 'https://ipapi.co',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
} as const;

// Application Limits
export const APP_LIMITS = {
  MAX_HISTORY_SIZE: 10,
  ABUSE_DB_MAX_AGE_DAYS: 90,
} as const;

// Risk Thresholds
export const RISK_THRESHOLDS = {
  ABUSE_HIGH: 75,
  ABUSE_MEDIUM: 30,
  FRAUD_HIGH: 50,
  FRAUD_MEDIUM: 30,
} as const;

// Validation
export const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[1-9]|0)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[1-9]|0)){3}$/;
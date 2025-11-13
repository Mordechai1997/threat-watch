import { IPV4_REGEX } from '@/constants';

export const validateIp = (ip: string): boolean => {
  if (!ip) return false;
  return IPV4_REGEX.test(ip.trim());
};
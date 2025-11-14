import { aggregateThreatData, calculateRiskLevel } from '@/utils/aggregator';
import { ThreatData, RiskLevel } from '@/types/threat';

// Mock Data Types
interface AbuseIPDBData {
  ipAddress: string;
  abuseConfidenceScore: number;
  totalReports: number;
  countryCode: string;
  hostnames: string[] | null;
  isp: string;
}

interface IPQSData {
  ip_address: string;
  country_code: string;
  host: string;
  vpn: boolean;
  proxy: boolean;
  fraud_score: number;
  abuse_velocity: string;
  bot_status: boolean;
}

interface IPAPIData {
  ip: string;
  country_name: string;
  isp: string;
  hostname: string;
  org: string;
}

// Mocking the constants required for calculateRiskLevel based on assumed values
const RISK_THRESHOLDS = {
  ABUSE_HIGH: 75,
  FRAUD_HIGH: 50,
  ABUSE_MEDIUM: 30,
  FRAUD_MEDIUM: 30,
};

// Defining the expected ThreatData structure for base data setup
interface MockedThreatData extends ThreatData {
  threatScore: number;
}

describe('aggregateThreatData', () => {
  const TEST_IP = '8.8.8.8';

  const mockAbuseDB: AbuseIPDBData = {
    ipAddress: TEST_IP,
    abuseConfidenceScore: 45,
    countryCode: 'US',
    hostnames: ['google-dns.com'],
    isp: 'Google LLC (AbuseDB)',
    totalReports: 100,
  };

  const mockIPQS: IPQSData = {
    ip_address: TEST_IP,
    host: 'dns-host-ipqs.net',
    vpn: false,
    proxy: false,
    fraud_score: 25,
    country_code: 'US',
    abuse_velocity: 'low',
    bot_status: false,
  };

  const mockIPAPI: IPAPIData = {
    ip: TEST_IP,
    country_name: 'United States',
    isp: 'Google LLC',
    hostname: 'dns.google',
    org: 'GOOGLE-ORG',
  };

  describe('with all sources available', () => {
    it('should prioritize IPAPI for geolocation data', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: mockIPQS,
        ipapi: mockIPAPI,
      });

      expect(result.ipAddress).toBe(TEST_IP);
      expect(result.hostname).toBe(mockIPAPI.hostname);
      expect(result.isp).toBe(mockIPAPI.isp);
      expect(result.country).toBe(mockIPAPI.country_name);
    });

    it('should aggregate threat scores correctly', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: mockIPQS,
        ipapi: mockIPAPI,
      });

      expect(result.abuseScore).toBe(45);
      expect(result.totalReports).toBe(100);
      // Updated to threatScore
      expect(result.threatScore).toBe(25);
      expect(result.vpnProxyDetected).toBe(false);
    });
  });

  describe('fallback behavior', () => {
    it('should fallback to AbuseDB when IPAPI is null', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: mockIPQS,
        ipapi: null,
      });

      expect(result.hostname).toBe(mockAbuseDB.hostnames![0]);
      expect(result.isp).toBe(mockAbuseDB.isp);
      expect(result.country).toBe(mockAbuseDB.countryCode);
    });

    it('should fallback to IPQS hostname when others are null', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: { ...mockAbuseDB, hostnames: null },
        ipqs: mockIPQS,
        ipapi: { ...mockIPAPI, hostname: '' },
      });

      expect(result.hostname).toBe(mockIPQS.host);
    });

    it('should return null when all sources are null', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: null,
        ipqs: null,
        ipapi: null,
      });

      expect(result.hostname).toBeNull();
      expect(result.isp).toBeNull();
      expect(result.country).toBeNull();
      expect(result.abuseScore).toBe(0);
      expect(result.totalReports).toBe(0);
      // Updated to threatScore
      expect(result.threatScore).toBe(0);
    });
  });

  describe('VPN/Proxy detection', () => {
    it('should detect VPN when vpn flag is true', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: { ...mockIPQS, vpn: true, proxy: false },
        ipapi: mockIPAPI,
      });

      expect(result.vpnProxyDetected).toBe(true);
    });

    it('should detect Proxy when proxy flag is true', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: { ...mockIPQS, vpn: false, proxy: true },
        ipapi: mockIPAPI,
      });

      expect(result.vpnProxyDetected).toBe(true);
    });

    it('should detect when both VPN and Proxy are true', () => {
      const result = aggregateThreatData({
        ipAddress: TEST_IP,
        abuseDB: mockAbuseDB,
        ipqs: { ...mockIPQS, vpn: true, proxy: true },
        ipapi: mockIPAPI,
      });

      expect(result.vpnProxyDetected).toBe(true);
    });
  });
});

describe('calculateRiskLevel', () => {
  // Using MockedThreatData to reflect the actual aggregated structure
  const baseData: MockedThreatData = {
    ipAddress: '1.1.1.1',
    hostname: null,
    isp: 'ISP',
    country: 'XX',
    totalReports: 1,
    abuseScore: 0,
    threatScore: 0, // Updated from fraudScore
    vpnProxyDetected: false,
  };

  const THRESHOLDS = RISK_THRESHOLDS;

  describe('HIGH risk scenarios', () => {
    it(`should return HIGH when abuse score >= ${THRESHOLDS.ABUSE_HIGH}`, () => {
      const data = { ...baseData, abuseScore: THRESHOLDS.ABUSE_HIGH };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it(`should return HIGH when threat score >= ${THRESHOLDS.FRAUD_HIGH}`, () => {
      const data = {
        ...baseData,
        threatScore: THRESHOLDS.FRAUD_HIGH,
        abuseScore: THRESHOLDS.ABUSE_MEDIUM - 1
      };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });

    it('should return HIGH when both are high', () => {
      const data = {
        ...baseData,
        abuseScore: 90,
        threatScore: 75
      };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });
  });

  describe('MEDIUM risk scenarios', () => {
    it(`should return MEDIUM when abuse score is between ${THRESHOLDS.ABUSE_MEDIUM} and ${THRESHOLDS.ABUSE_HIGH - 1}`, () => {
      const data = { ...baseData, abuseScore: 35, threatScore: 0 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it(`should return MEDIUM when threat score is between ${THRESHOLDS.FRAUD_MEDIUM} and ${THRESHOLDS.FRAUD_HIGH - 1}`, () => {
      const data = { ...baseData, threatScore: 40, abuseScore: 0 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it(`should return MEDIUM at abuse score boundary (${THRESHOLDS.ABUSE_MEDIUM})`, () => {
      const data = { ...baseData, abuseScore: THRESHOLDS.ABUSE_MEDIUM, threatScore: 0 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it(`should return MEDIUM at threat score boundary (${THRESHOLDS.FRAUD_MEDIUM})`, () => {
      const data = { ...baseData, threatScore: THRESHOLDS.FRAUD_MEDIUM, abuseScore: 0 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });
  });

  describe('LOW risk scenarios', () => {
    it(`should return LOW when all scores are below ${THRESHOLDS.ABUSE_MEDIUM}`, () => {
      const data = {
        ...baseData,
        abuseScore: THRESHOLDS.ABUSE_MEDIUM - 1,
        threatScore: THRESHOLDS.FRAUD_MEDIUM - 1,
        vpnProxyDetected: false
      };
      expect(calculateRiskLevel(data)).toBe('LOW');
    });

    it('should return LOW with zero scores', () => {
      const data = { ...baseData };
      expect(calculateRiskLevel(data)).toBe('LOW');
    });
  });

  describe('edge cases', () => {
    it(`should handle abuse score just below HIGH boundary (${THRESHOLDS.ABUSE_HIGH - 1})`, () => {
      const data = { ...baseData, abuseScore: THRESHOLDS.ABUSE_HIGH - 1 };
      expect(calculateRiskLevel(data)).toBe('MEDIUM');
    });

    it('should prioritize HIGH over MEDIUM', () => {
      const data = {
        ...baseData,
        abuseScore: THRESHOLDS.ABUSE_HIGH + 5,
        threatScore: THRESHOLDS.FRAUD_MEDIUM + 5
      };
      expect(calculateRiskLevel(data)).toBe('HIGH');
    });
  });
});
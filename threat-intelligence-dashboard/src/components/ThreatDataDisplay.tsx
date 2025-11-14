'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { ThreatState } from '@/types/threat';
import { ThreatData, RiskLevel } from '@/types/threat';
import { APP_STRINGS } from '@/utils/strings';

// Assuming the correct calculation is performed in the aggregator file
const calculateRiskLevel = (data: ThreatData): RiskLevel => {
  // Placeholder logic if the original aggregator fails to import
  if (data.threatScore > 50 || data.abuseScore > 75) return 'HIGH';
  if (data.threatScore > 10 || data.abuseScore > 20) return 'MEDIUM';
  return 'LOW';
};


// Styles
const styles = {
  container: 'w-full max-w-lg mx-auto mt-8 p-6 bg-white shadow-2xl rounded-xl border border-gray-100',
  title: 'text-2xl font-bold mb-4 text-gray-800 border-b pb-2',
  loader: {
    wrapper: 'text-center py-10 text-lg font-medium text-blue-500 flex items-center justify-center space-x-2',
    spinner: 'animate-spin h-5 w-5 text-blue-500',
  },
  error: 'text-center py-8 text-lg font-semibold text-red-600 bg-red-50 border border-red-300 rounded-lg',
  noData: 'text-center py-8 text-lg text-gray-500 bg-gray-50 border border-gray-200 rounded-lg',
  riskSection: {
    wrapper: 'flex justify-between items-center mb-6 pt-2',
    label: 'text-sm font-semibold text-gray-600',
    badge: {
      base: 'text-lg font-bold p-2 rounded-full inline-block text-white',
      LOW: 'bg-green-500',
      MEDIUM: 'bg-yellow-500',
      HIGH: 'bg-red-600',
      UNKNOWN: 'bg-gray-400',
    },
  },
  grid: 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-6',
  field: {
    wrapper: 'space-y-1',
    label: 'text-sm font-semibold text-gray-600',
    value: 'text-base font-medium text-gray-800 break-words',
  },
};

type FieldConfig = {
  label: string;
  key: keyof ThreatData;
  format?: (val: any) => string;
};

// ✅ UPDATED FIELDS LIST - NOW INCLUDES ALL 8 REQUIRED COLUMNS
const FIELDS: FieldConfig[] = [
  { label: 'IP Address', key: 'ipAddress' },
  { label: 'Hostname', key: 'hostname' },
  { label: 'ISP', key: 'isp' },
  { label: 'Country', key: 'country' },
  // Required 1: Abuse Score (from AbuseIPDB)
  { label: 'Abuse Score (0-100)', key: 'abuseScore' },
  // Required 2: Recent Reports (totalReports in our interface, based on 90 days)
  { label: 'Recent Abuse Reports (90 Days)', key: 'totalReports' },
  // Required 3: VPN/Proxy Detected (from IPQualityScore)
  { label: 'VPN/Proxy Detected', key: 'vpnProxyDetected', format: (val: boolean) => val ? 'Yes' : 'No' },
  // Required 4: Threat Score (mapped from Fraud Score)
  { label: 'Threat Score (0-100)', key: 'threatScore' },
];

const LoadingSpinner = () => (
  <svg className={styles.loader.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ThreatDataDisplay = () => {
  // Using a type assertion to satisfy Redux type checking
  const { data, loading, error } = useSelector((state: RootState) => state.threats as ThreatState);

  if (loading === 'pending') {
    return (
      <div className={styles.container}>
        <div className={styles.loader.wrapper}>
          <LoadingSpinner />
          <span>{APP_STRINGS.LOADING_MESSAGE}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!data || !data.ipAddress) {
    return (
      <div className={styles.container}>
        <p className={styles.noData}>{APP_STRINGS.NO_DATA_AVAILABLE}</p>
      </div>
    );
  }

  const threatData: ThreatData = data as ThreatData;
  // Overall Risk Level - Bonus Field
  const riskLevel: RiskLevel = calculateRiskLevel(threatData);
  const riskBadgeClass = styles.riskSection.badge[riskLevel];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Threat Intelligence for <span className="text-blue-600">{threatData.ipAddress}</span>
      </h2>

      <div className={styles.riskSection.wrapper}>
        <span className={styles.riskSection.label}>Overall Risk Level :</span>
        <span className={`${styles.riskSection.badge.base} ${riskBadgeClass}`}>
          {riskLevel}
        </span>
      </div>

      <div className={styles.grid}>
        {FIELDS.map(({ label, key, format }) => {
          const value = threatData[key as keyof ThreatData];
          const displayValue = format
            ? format(value as boolean)
            // If value is null, 0, or empty string (only for non-IP fields), show N/A
            : (value !== null && value !== 0 && value !== '') || key === 'ipAddress'
              ? value
              : 'N/A';

          return (
            <div key={key} className={styles.field.wrapper}>
              <span className={styles.field.label}>{label}:</span>
              <p className={styles.field.value}>{displayValue}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreatDataDisplay;
'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { fetchThreatData } from '@/redux/threatsSlice';
import { ThreatData } from '@/types/threat';
import { APP_STRINGS } from '@/utils/strings';
import { calculateRiskLevel } from '@/utils/aggregator';

// Styles
const styles = {
    container: 'w-full max-w-lg mx-auto mt-6 p-4 bg-gray-50 shadow-inner rounded-xl',
    header: 'text-lg font-semibold text-gray-700 mb-3 border-b pb-2',
    list: 'space-y-2',
    item: {
        base: 'p-3 mb-2 rounded-lg cursor-pointer transition-colors border border-gray-200 hover:bg-blue-50 hover:border-blue-300',
        content: 'flex justify-between items-center',
    },
    ip: 'font-mono font-medium text-blue-800',
    risk: {
        base: 'text-sm font-semibold',
        high: 'text-red-600',
        medium: 'text-yellow-600',
        low: 'text-green-600',
    },
    metadata: 'text-xs text-gray-500 mt-1',
    empty: 'text-gray-500 italic text-center py-4',
};

const SearchHistory = () => {
    const dispatch = useDispatch<AppDispatch>();
    const history: ThreatData[] = useSelector((state: RootState) => state.threats.history);

    const handleHistoryClick = (ip: string) => {
        dispatch(fetchThreatData(ip));
    };

    if (history.length === 0) {
        return (
            <div className={styles.container}>
                <h3 className={styles.header}>{APP_STRINGS.HISTORY_HEADER}</h3>
                <p className={styles.empty}>{APP_STRINGS.HISTORY_EMPTY}</p>
            </div>
        );
    }

    const recentHistory = history.slice(-5).reverse();

    const getRiskColorClass = (riskLevel: string) => {
        switch (riskLevel) {
            case 'HIGH':
                return styles.risk.high;
            case 'MEDIUM':
                return styles.risk.medium;
            default:
                return styles.risk.low;
        }
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.header}>
                {APP_STRINGS.HISTORY_HEADER} ({recentHistory.length})
            </h3>

            <ul className={styles.list}>
                {recentHistory.map((item, index) => {
                    const riskLevel = calculateRiskLevel(item);
                    const riskColorClass = getRiskColorClass(riskLevel);

                    return (
                        <li
                            key={item.ipAddress || index}
                            className={styles.item.base}
                            onClick={() => handleHistoryClick(item.ipAddress)}
                        >
                            <div className={styles.item.content}>
                                <span className={styles.ip}>{item.ipAddress}</span>
                                <span className={`${styles.risk.base} ${riskColorClass}`}>
                                    Risk: {riskLevel}
                                </span>
                            </div>
                            <p className={styles.metadata}>
                                {item.isp} - {item.country}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default SearchHistory;
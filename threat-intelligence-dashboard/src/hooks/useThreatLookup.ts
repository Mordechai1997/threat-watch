import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { ThreatData } from '@/types/threat';
import { fetchThreatData } from '@/redux/threatsSlice';

export const useThreatLookup = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { data, loading, error, history } = useSelector(
        (state: RootState) => state.threats
    );

    const lookupThreat = (ip: string) => {
        dispatch(fetchThreatData(ip));
    };

    return {
        threatData: data as ThreatData | null,
        isLoading: loading === 'pending',
        lookupError: error,
        searchHistory: history,
        lookupThreat,
    };
};
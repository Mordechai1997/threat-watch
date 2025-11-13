import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { ThreatData } from '@/types/threat';
import { APP_STRINGS } from '@/utils/strings';

const MAX_HISTORY_SIZE = 10;

// Types
export interface ThreatsState {
  data: ThreatData | null;
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
  history: ThreatData[];
}

// Helper: Extract error message from Axios error
const getErrorMessage = (err: unknown): string => {
  if (!axios.isAxiosError(err) || !err.response) {
    return APP_STRINGS.ERROR_GENERIC_FETCH;
  }

  const { status, data } = err.response;

  if (status === 429) return APP_STRINGS.ERROR_RATE_LIMIT;
  if (status === 400 && data?.error) return data.error;
  
  return data?.error || APP_STRINGS.ERROR_GENERIC_FETCH;
};

// Async Thunk
export const fetchThreatData = createAsyncThunk<
  ThreatData,
  string,
  { rejectValue: string }
>(
  'threats/fetchThreatData',
  async (ipAddress: string, { rejectWithValue }) => {
    try {
      const { data } = await axios.get<ThreatData>(`/api/threats?ip=${ipAddress}`);

      if (!data?.ipAddress) {
        return rejectWithValue(APP_STRINGS.ERROR_GENERIC_FETCH);
      }

      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// Helper: Update history with new data
const updateHistory = (history: ThreatData[], newData: ThreatData): ThreatData[] => {
  const filtered = history.filter(item => item.ipAddress !== newData.ipAddress);
  const updated = [...filtered, newData];
  
  return updated.length > MAX_HISTORY_SIZE
    ? updated.slice(-MAX_HISTORY_SIZE)
    : updated;
};

// Slice
const threatsSlice = createSlice({
  name: 'threats',
  initialState: {
    data: null,
    loading: 'idle',
    error: null,
    history: [],
  } as ThreatsState,
  reducers: {
    clearThreatState: (state) => {
      state.data = null;
      state.error = null;
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreatData.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchThreatData.fulfilled, (state, action: PayloadAction<ThreatData>) => {
        state.loading = 'succeeded';
        state.error = null;
        state.data = action.payload;
        state.history = updateHistory(state.history, action.payload);
      })
      .addCase(fetchThreatData.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload || APP_STRINGS.ERROR_GENERIC_FETCH;
        state.data = null;
      })
      .addCase('RESTORE_STATE' as any, (state, action: any) => {
        if (action.payload?.threats) {
          return { ...state, ...action.payload.threats };
        }
      });
  },
});

export const { clearThreatState, clearHistory } = threatsSlice.actions;
export default threatsSlice.reducer;
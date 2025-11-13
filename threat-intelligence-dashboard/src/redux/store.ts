import { configureStore } from '@reduxjs/toolkit';
import threatsReducer, { ThreatsState } from './threatsSlice';

export interface RootPreloadedState {
  threats: ThreatsState;
}

// Helper functions
const saveState = (state: RootPreloadedState) => {
  try {
    if (typeof window === 'undefined') return;
    const serializedState = JSON.stringify(state);
    localStorage.setItem('threatState', serializedState);
  } catch (err) {
    console.warn('Failed to save state to localStorage:', err);
  }
};

const loadState = (): RootPreloadedState | undefined => {
  try {
    if (typeof window === 'undefined') return undefined;
    const serializedState = localStorage.getItem('threatState');
    if (!serializedState) return undefined;
    return JSON.parse(serializedState) as RootPreloadedState;
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
    return undefined;
  }
};

// Create store WITHOUT preloadedState initially
export const store = configureStore({
  reducer: {
    threats: threatsReducer,
  },
});

// Load state from localStorage ONLY on client side, AFTER store creation
if (typeof window !== 'undefined') {
  const persistedState = loadState();
  if (persistedState) {
    // Manually dispatch an action to restore the state after hydration
    store.dispatch({ type: 'RESTORE_STATE', payload: persistedState });
  }
}

// Persist state changes to localStorage
store.subscribe(() => {
  const state = store.getState();
  const toSave: RootPreloadedState = {
    threats: {
      ...state.threats,
      error: null,
    },
  };
  saveState(toSave);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
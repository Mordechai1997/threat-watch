'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';

interface ReduxProviderProps {
    children: React.ReactNode;
}

/**
 * Client Component that wraps the application tree with the Redux store Provider.
 * This is necessary for Next.js App Router compatibility.
 */
const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    );
};

export default ReduxProvider;
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IpInputForm from '../components/IpInputForm'; // נתיב יחסי
import { useThreatLookup } from '../hooks/useThreatLookup'; // נתיב יחסי
import { APP_STRINGS } from '../utils/strings'; // נתיב יחסי

// Mock the Custom Hook
const mockLookupThreat = jest.fn();

// נתיב יחסי ל-mock
jest.mock('../hooks/useThreatLookup', () => ({ 
  useThreatLookup: () => ({
    lookupThreat: mockLookupThreat,
  }),
}));

// Mock the validation utility
jest.mock('../utils/validation', () => ({
    validateIp: jest.fn(),
}));

import { validateIp } from '../utils/validation';

describe('IpInputForm', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = () => render(<IpInputForm />);


    // ------------------------------------
    // RENDERING AND INITIAL STATE TESTS
    // ------------------------------------
    
    it('should render the input field and the check button', () => {
        renderComponent();
        
        const inputElement = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
        const buttonElement = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
        
        expect(inputElement).toBeTruthy();
        expect(buttonElement).toBeTruthy();
    });
    
    // ------------------------------------
    // CLIENT-SIDE VALIDATION TESTS
    // ------------------------------------

    it('should show an error when the input is empty', async () => {
        renderComponent();
        
        fireEvent.click(screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON }));

        await waitFor(() => {
            expect(screen.getByText(APP_STRINGS.ERROR_IP_EMPTY)).toBeTruthy();
        });
        
        expect(mockLookupThreat).not.toHaveBeenCalled();
    });

    it('should show an error when the IP format is invalid', async () => {
        (validateIp as jest.Mock).mockReturnValue(false);
        renderComponent();
        
        const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
        fireEvent.change(input, { target: { value: 'not-an-ip' } });
        fireEvent.click(screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON }));

        await waitFor(() => {
            expect(screen.getByText(APP_STRINGS.ERROR_IP_FORMAT)).toBeTruthy();
        });
        
        expect(mockLookupThreat).not.toHaveBeenCalled();
    });
    
    it('should clear the error message when the user starts typing again', async () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON }));
        await waitFor(() => {
            expect(screen.getByText(APP_STRINGS.ERROR_IP_EMPTY)).toBeTruthy();
        });
        
        const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
        fireEvent.change(input, { target: { value: '1' } });

        expect(screen.queryByText(APP_STRINGS.ERROR_IP_EMPTY)).toBeNull();
    });

    // ------------------------------------
    // SUCCESS SCENARIO TEST
    // ------------------------------------

    it('should call lookupThreat with the trimmed IP upon valid submission', async () => {
        (validateIp as jest.Mock).mockReturnValue(true);
        renderComponent();
        
        const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
        const validIp = ' 10.0.0.1 ';
        const trimmedIp = '10.0.0.1'; 

        fireEvent.change(input, { target: { value: validIp } });
        fireEvent.click(screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON }));

        await waitFor(() => {
            expect(mockLookupThreat).toHaveBeenCalledTimes(1);
            expect(mockLookupThreat).toHaveBeenCalledWith(trimmedIp);
        });
        
        expect(screen.queryByText(APP_STRINGS.ERROR_IP_FORMAT)).toBeNull();
    });

});
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IpInputForm from '@/components/IpInputForm';
import { validateIp } from '@/utils/validation';
import { APP_STRINGS } from '@/utils/strings';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';

const mockStore = configureStore({
    reducer: (state) => state, 
    preloadedState: {}
});

const renderWithRedux = (ui: React.ReactElement) => {
    return rtlRender(<Provider store={mockStore}>{ui}</Provider>);
};

const mockLookupThreat = jest.fn(() => Promise.resolve()); 

jest.mock('@/hooks/useThreatLookup', () => ({
    useThreatLookup: () => ({
        lookupThreat: mockLookupThreat,
    }),
}));

jest.mock('@/utils/validation', () => ({
    validateIp: jest.fn(),
}));

const mockedValidateIp = validateIp as jest.MockedFunction<typeof validateIp>;

describe('IpInputForm', () => {
    beforeEach(() => {
        userEvent.setup(); 
        jest.clearAllMocks();
    });

    describe('rendering', () => {
        it('should render input field with correct placeholder', () => {
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            expect(input).toBeInTheDocument();
        });

        it('should render check button with correct text', () => {
            renderWithRedux(<IpInputForm />);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            expect(button).toBeInTheDocument();
        });

        it('should not display error message initially', () => {
            renderWithRedux(<IpInputForm />);
            
            expect(screen.queryByText(APP_STRINGS.ERROR_IP_EMPTY)).not.toBeInTheDocument();
            expect(screen.queryByText(APP_STRINGS.ERROR_IP_FORMAT)).not.toBeInTheDocument();
        });
    });

    describe('validation - empty input', () => {
        it('should show error when submitting empty input', async () => {
            renderWithRedux(<IpInputForm />);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_EMPTY)).toBeInTheDocument();
            });
            
            expect(mockLookupThreat).not.toHaveBeenCalled();
        });

        it('should show error when submitting whitespace-only input', async () => {
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, '    ');
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_EMPTY)).toBeInTheDocument();
            });
            
            expect(mockLookupThreat).not.toHaveBeenCalled();
        });
    });

    describe('validation - invalid format', () => {
        it('should show error for invalid IP format', async () => {
            mockedValidateIp.mockReturnValue(false);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, 'not-an-ip');
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_FORMAT)).toBeInTheDocument();
            });
            
            expect(mockLookupThreat).not.toHaveBeenCalled();
        });

        it('should show error for partial IP address', async () => {
            mockedValidateIp.mockReturnValue(false);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, '192.168.1');
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_FORMAT)).toBeInTheDocument();
            });
        });

        it('should show error for IP with invalid octet', async () => {
            mockedValidateIp.mockReturnValue(false);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, '256.1.1.1');
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_FORMAT)).toBeInTheDocument();
            });
        });
    });

    describe('error clearing', () => {
        it('should clear error when user starts typing after empty error', async () => {
            renderWithRedux(<IpInputForm />);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);
            
            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_EMPTY)).toBeInTheDocument();
            });
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, '1'); 

            expect(screen.queryByText(APP_STRINGS.ERROR_IP_EMPTY)).not.toBeInTheDocument();
        });

        it('should clear error when user starts typing after format error', async () => {
            mockedValidateIp.mockReturnValue(false);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, 'invalid');
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);
            
            await waitFor(() => {
                expect(screen.getByText(APP_STRINGS.ERROR_IP_FORMAT)).toBeInTheDocument();
            });
            
            await userEvent.type(input, '{backspace}{backspace}{backspace}192');

            expect(screen.queryByText(APP_STRINGS.ERROR_IP_FORMAT)).not.toBeInTheDocument();
        });
    });

    describe('successful submission', () => {
        it('should call lookupThreat with valid IP', async () => {
            mockedValidateIp.mockReturnValue(true);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            const validIp = '8.8.8.8';
            
            await userEvent.type(input, validIp);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(mockLookupThreat).toHaveBeenCalledTimes(1);
                expect(mockLookupThreat).toHaveBeenCalledWith(validIp);
            });
        });

        it('should trim whitespace before calling lookupThreat', async () => {
            mockedValidateIp.mockReturnValue(true);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            const ipWithSpaces = ' 10.0.0.1 ';
            const trimmedIp = '10.0.0.1';
            
            await userEvent.type(input, ipWithSpaces);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(mockLookupThreat).toHaveBeenCalledWith(trimmedIp);
            });
        });

        it('should not display error after successful submission', async () => {
            mockedValidateIp.mockReturnValue(true);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, '192.168.1.1');
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                expect(mockLookupThreat).toHaveBeenCalled();
            });
            
            expect(screen.queryByText(APP_STRINGS.ERROR_IP_FORMAT)).not.toBeInTheDocument();
            expect(screen.queryByText(APP_STRINGS.ERROR_IP_EMPTY)).not.toBeInTheDocument();
        });
    });

    describe('form submission', () => {
        it('should submit when pressing Enter key', async () => {
            mockedValidateIp.mockReturnValue(true);
            renderWithRedux(<IpInputForm />);
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            await userEvent.type(input, '1.1.1.1{enter}');

            await waitFor(() => {
                expect(mockLookupThreat).toHaveBeenCalledWith('1.1.1.1');
            });
        });

        it('should prevent default form submission', async () => {
            mockedValidateIp.mockReturnValue(true);
            renderWithRedux(<IpInputForm />);
            
            const form = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON }).closest('form')!;
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');
            
            const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
            fireEvent.change(input, { target: { value: '8.8.8.8' } });
            
            form.dispatchEvent(submitEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have aria-invalid when there is an error', async () => {
            renderWithRedux(<IpInputForm />);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
                expect(input).toHaveAttribute('aria-invalid', 'true');
            });
        });

        it('should have aria-describedby linking to error message', async () => {
            renderWithRedux(<IpInputForm />);
            
            const button = screen.getByRole('button', { name: APP_STRINGS.CHECK_BUTTON });
            await userEvent.click(button);

            await waitFor(() => {
                const input = screen.getByPlaceholderText(APP_STRINGS.INPUT_PLACEHOLDER);
                const errorId = input.getAttribute('aria-describedby');
                expect(errorId).toBeTruthy();
                expect(screen.getByText(APP_STRINGS.ERROR_IP_EMPTY)).toHaveAttribute('id', errorId!);
            });
        });
    });
});
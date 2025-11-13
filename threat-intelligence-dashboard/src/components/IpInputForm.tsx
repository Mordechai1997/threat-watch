'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useDispatch } from 'react-redux';
import { validateIp } from '@/utils/validation';
import { fetchThreatData } from '@/redux/threatsSlice';
import { APP_STRINGS } from '@/utils/strings';
import type { AppDispatch } from '@/redux/store';

// Styles
const styles = {
    container: 'w-full max-w-lg mx-auto p-4 bg-white shadow-xl rounded-xl',
    form: 'space-y-4',
    inputWrapper: '',
    input: {
        base: 'w-full p-3 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2',
        valid: 'border-gray-300 focus:ring-blue-500',
        invalid: 'border-red-500 focus:ring-red-500',
    },
    error: 'mt-2 text-sm text-red-600 font-medium',
    button: 'w-full sm:w-32 p-3 text-white font-semibold rounded-lg shadow-md bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300',
};

const IpInputForm = () => {
    const [ipInput, setIpInput] = useState('');
    const [error, setError] = useState('');
    const dispatch = useDispatch<AppDispatch>();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const ip = ipInput.trim();

        if (!ip) {
            setError(APP_STRINGS.ERROR_IP_EMPTY);
            return;
        }

        if (!validateIp(ip)) {
            setError(APP_STRINGS.ERROR_IP_FORMAT);
            return;
        }

        dispatch(fetchThreatData(ip));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setIpInput(e.target.value);
        if (error) setError('');
    };

    const inputClassName = `${styles.input.base} ${error ? styles.input.invalid : styles.input.valid}`;

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        placeholder={APP_STRINGS.INPUT_PLACEHOLDER}
                        value={ipInput}
                        onChange={handleChange}
                        className={inputClassName}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'ip-error' : undefined}
                    />
                    {error && (
                        <p id="ip-error" className={styles.error}>
                            {error}
                        </p>
                    )}
                </div>

                <button type="submit" className={styles.button}>
                    {APP_STRINGS.CHECK_BUTTON}
                </button>
            </form>
        </div>
    );
};

export default IpInputForm;
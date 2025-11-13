import { validateIp } from '../utils/validation'; // נתיב יחסי

describe('IP Validation Utility', () => {

    // ------------------------------------
    // VALID IPv4 TESTS
    // ------------------------------------

    it('should return true for a valid standard IPv4 address', () => {
        expect(validateIp('8.8.8.8')).toBe(true);
        expect(validateIp('192.168.1.1')).toBe(true);
        expect(validateIp('255.255.255.255')).toBe(true);
    });

    it('should return true for a valid loopback address', () => {
        expect(validateIp('127.0.0.1')).toBe(true);
    });

    it('should return true for an address with leading/trailing spaces (should be trimmed)', () => {
        expect(validateIp(' 1.1.1.1 ')).toBe(true);
    });

    // ------------------------------------
    // INVALID IPv4 TESTS
    // ------------------------------------

    it('should return false for an empty string or null input', () => {
        expect(validateIp('')).toBe(false);
        expect(validateIp(null as any)).toBe(false);
        expect(validateIp(undefined as any)).toBe(false);
    });

    it('should return false for addresses with non-numeric characters', () => {
        expect(validateIp('a.b.c.d')).toBe(false);
        expect(validateIp('1.2.3.4x')).toBe(false);
    });

    it('should return false for addresses with too few or too many octets', () => {
        expect(validateIp('1.2.3')).toBe(false);
        expect(validateIp('1.2.3.4.5')).toBe(false);
    });

    it('should return false for octets greater than 255', () => {
        expect(validateIp('256.0.0.0')).toBe(false);
        expect(validateIp('1.2.3.256')).toBe(false);
    });

    it('should return false for addresses containing leading zeros in octets (if strict)', () => {
        // רוב ה-Validators מחשיבים זאת כלא תקין
        expect(validateIp('192.168.01.1')).toBe(false);
    });

});
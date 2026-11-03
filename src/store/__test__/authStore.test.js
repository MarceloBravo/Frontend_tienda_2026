import { selectIsAuthenticated } from '../authStore';

describe('selectIsAuthenticated', () => {
    it('returns true when isLoggedIn is true and the user exists', () => {
        const state = { userSession: { isLoggedIn: true, user: { username: 'ana' } } };

        expect(selectIsAuthenticated(state)).toBe(true);
    });

    it('returns false when isLoggedIn is false (edge case)', () => {
        const state = { userSession: { isLoggedIn: false, user: { username: 'ana' } } };

        expect(selectIsAuthenticated(state)).toBe(false);
    });

    it('returns false when the user is missing (inconsistent state)', () => {
        const state = { userSession: { isLoggedIn: true, user: null } };

        expect(selectIsAuthenticated(state)).toBe(false);
    });

    it('returns false when userSession is missing (null safety)', () => {
        expect(selectIsAuthenticated({ userSession: null })).toBe(false);
        expect(selectIsAuthenticated({})).toBe(false);
    });
});

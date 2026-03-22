import { render, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import SignupPage from '@/app/(auth)/signup/page';

const replaceMock = jest.fn();
const authState = {
  user: null as { uid: string } | null,
  isLoading: false,
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signUpWithEmail: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

describe('auth pages', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    authState.user = null;
    authState.isLoading = false;
    authState.signInWithEmail.mockReset();
    authState.signInWithGoogle.mockReset();
    authState.signUpWithEmail.mockReset();
  });

  it('redirects authenticated users away from login', async () => {
    authState.user = { uid: 'user-1' };

    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects authenticated users away from signup', async () => {
    authState.user = { uid: 'user-1' };

    render(<SignupPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});

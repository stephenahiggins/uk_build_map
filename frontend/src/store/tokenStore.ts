import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface TokenStore {
  token: string;
  setToken: (data: string) => void;
  logout: () => void;
}

const useTokenStore = create<TokenStore>()(
  devtools(
    persist(
      (set) => ({
        token: '',
        setToken: (data: string) => set(() => ({ token: data })),
        logout: () => set(() => ({ token: '' })),
      }),
      { name: 'token-store' }
    )
  )
);

export default useTokenStore;

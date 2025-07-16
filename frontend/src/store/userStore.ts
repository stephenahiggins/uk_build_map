import { create } from 'zustand';

export const USER_TYPE_ADMIN = 'ADMIN';
export const USER_TYPE_MODERATOR = 'MODERATOR';
export const USER_TYPE_USER = 'USER';
type UserType =
  | typeof USER_TYPE_ADMIN
  | typeof USER_TYPE_MODERATOR
  | typeof USER_TYPE_USER;
interface UserState {
  user: {
    user_id: number;
    user_name: string;
    user_email: string;
    user_active: boolean;
    user_created_at: string;
    user_updated_at: string;
    user_deleted: boolean;
    user_type: UserType;
  } | null;
  setUser: (user: {
    user_id: number;
    user_name: string;
    user_email: string;
    user_active: boolean;
    user_created_at: string;
    user_updated_at: string;
    user_deleted: boolean;
    user_type: UserType;
  }) => void;
  clearUser: () => void;
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export default useUserStore;

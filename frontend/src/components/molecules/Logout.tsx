import React from 'react';
import { logout } from '../../services/authService';
import Button from './Button';
import useTokenStore from '../../store/tokenStore';
import useUserStore from '../../store/userStore';
import { useNavigate } from 'react-router-dom';

const Logout: React.FC = () => {
  const navigate = useNavigate();
  const logoutFromStore = useTokenStore((state) => state.logout);
  const clearUser = useUserStore((state) => state.clearUser);

  async function reloadLogout(): Promise<void> {
    try {
      await logout();
    } catch (error) {
      console.log(error);
    }

    // Clear all client-side session data
    logoutFromStore(); // Use token store logout method
    clearUser(); // Clear user state

    // Explicitly clear any remaining browser storage to ensure complete cleanup
    localStorage.removeItem('token-store');
    sessionStorage.clear();

    // Navigate to Projects page after logout
    navigate('/project/list');
  }
  return (
    <>
      <Button text="Logout" onClick={reloadLogout} size="small" />
    </>
  );
};

export default Logout;

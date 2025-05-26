import React, { useEffect } from 'react';
import useAuth from '../../../hooks/useAuth';
import useUserStore from '../../../store/userStore';

const HomePage: React.FC = () => {
  const { data, error, isLoading } = useAuth();
  const { user, setUser, clearUser } = useUserStore();

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    console.log(user);
  }, [user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">When will it get built?</h1>
      <h2 className="text-1xl mb-4">UK National Infrastructure Tracker</h2>
    </div>
  );
};

export default HomePage;

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
      <h2 className="text-1xl mb-4">
        Track the progress of national infrastructure projects
      </h2>
    </div>
  );
};

export default HomePage;

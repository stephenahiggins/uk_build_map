import React from 'react';
import { Link } from 'react-router-dom';
import Logout from '../molecules/Logout';
import useUserStore from '../../store/userStore';

const Navbar: React.FC = () => {
  const { user } = useUserStore();
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow">
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard/home"
          className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
        >
          Home
        </Link>
      <Link
        to="/project/list"
        className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
      >
        Projects
      </Link>
      <Link
        to="/project/add"
        className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
      >
        Add Project
      </Link>
        <Link
          to="/dashboard/profile"
          className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
        >
          Profile
        </Link>
        {(user?.user_type === 'ADMIN' || user?.user_type === 'MODERATOR') && (
          <Link
            to="/dashboard/moderation"
            className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
          >
            Moderation
          </Link>
        )}
      </div>
      <div className="flex items-center">
        <Logout />
      </div>
    </nav>
  );
};

export default Navbar;

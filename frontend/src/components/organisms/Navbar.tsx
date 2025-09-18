import React from 'react';
import { Link } from 'react-router-dom';
import Logout from '../molecules/Logout';
import useUserStore, {
  USER_TYPE_ADMIN,
  USER_TYPE_MODERATOR,
} from '../../store/userStore';

const Navbar: React.FC = () => {
  const { user } = useUserStore();
  console.log('FOO', user);
  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow">
      <div className="flex items-center gap-4">
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

        {(user?.user_type === USER_TYPE_ADMIN ||
          user?.user_type === USER_TYPE_MODERATOR) && (
          <Link
            to="/dashboard/moderation"
            className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
          >
            Moderation
          </Link>
        )}
        <Link
          to="/dashboard/profile"
          className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
        >
          Profile
        </Link>
      </div>
      <div className="flex items-center">
        <Logout />
      </div>
    </nav>
  );
};

export default Navbar;

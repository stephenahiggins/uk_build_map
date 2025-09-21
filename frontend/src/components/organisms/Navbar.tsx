import React from 'react';
import { Link } from 'react-router-dom';
import Logout from '../molecules/Logout';
import Button from '../molecules/Button';
import useUserStore, {
  USER_TYPE_ADMIN,
  USER_TYPE_MODERATOR,
} from '../../store/userStore';

const Navbar: React.FC = () => {
  const { user } = useUserStore();
  const isLoggedIn = !!user;
  const canModerate =
    user?.user_type === USER_TYPE_ADMIN ||
    user?.user_type === USER_TYPE_MODERATOR;

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
        {canModerate && (
          <Link
            to="/dashboard/moderation"
            className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
          >
            Moderation
          </Link>
        )}
        {isLoggedIn && (
          <Link
            to="/dashboard/profile"
            className="font-semibold text-lg text-neutral-800 hover:text-neutral-600"
          >
            Profile
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              Welcome, {user.user_name}
            </span>
            <Logout />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/auth/login">
              <Button text="Login" variant="link" size="small" />
            </Link>
            <Link to="/auth/register">
              <Button text="Register" variant="primary" size="small" />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useAuth from '../../../hooks/useAuth';
import useUserStore from '../../../store/userStore';
import Input from '../../atoms/Input';
import Button from '../../molecules/Button';
import { update_profile } from '../../../services/userService';
import { toast } from 'react-toastify';

interface ProfileForm {
  user_name: string;
  user_email: string;
}

const ProfilePage: React.FC = () => {
  const { data } = useAuth();
  const { user, setUser } = useUserStore();
  const { register, handleSubmit, setValue } = useForm<ProfileForm>();

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (user) {
      setValue('user_name', user.user_name);
      setValue('user_email', user.user_email);
    }
  }, [user, setValue]);

  const onSubmit = async (formData: ProfileForm) => {
    try {
      await update_profile(formData);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Name</label>
          <Input reactHookFormRegister={{ ...register('user_name') }} />
        </div>
        <div>
          <label className="block font-medium mb-1">Email</label>
          <Input type="email" reactHookFormRegister={{ ...register('user_email') }} />
        </div>
        <Button type="submit" text="Save" className="w-full" />
      </form>
      <div className="mt-4 text-center">
        <Button
          text="Reset Password"
          variant="secondary"
          onClick={() => (window.location.href = '/auth/forgot-password')}
        />
      </div>
    </div>
  );
};

export default ProfilePage;

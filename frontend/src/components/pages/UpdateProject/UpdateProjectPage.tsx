import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../config/axiosConfig';
import Button from '../../molecules/Button';

interface ProjectForm {
  status: 'RED' | 'AMBER' | 'GREEN';
  statusRationale?: string;
  expectedCompletion?: string;
}

interface Project {
  id: string;
  status: 'RED' | 'AMBER' | 'GREEN';
  statusRationale?: string;
  expectedCompletion?: string | null;
}

const UpdateProjectPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm<ProjectForm>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      const res = await axiosInstance.get(`/api/v1/projects/${id}`);
      const project: Project = res.data;
      setValue('status', project.status);
      if (project.statusRationale)
        setValue('statusRationale', project.statusRationale);
      if (project.expectedCompletion) {
        setValue(
          'expectedCompletion',
          project.expectedCompletion.split('T')[0]
        );
      }
      setLoading(false);
    };
    fetchProject();
  }, [id, setValue]);

  const onSubmit = async (data: ProjectForm) => {
    if (!id) return;
    if (data.expectedCompletion && !data.expectedCompletion.includes('T')) {
      data.expectedCompletion = new Date(data.expectedCompletion).toISOString();
    }
    await axiosInstance.post(`/api/v1/projects/${id}`, data);
    navigate(`/project/${id}`);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <>
      <div className="p-4 pb-0 flex items-center">
        <button
          onClick={() => navigate(`/project/${id}`)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
          aria-label="Back to Project"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Project
        </button>
      </div>
      <div className="max-w-xl mx-auto p-8 bg-white rounded shadow mt-4">
        <h1 className="text-2xl font-bold mb-6">Update Project</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block font-medium">Status</label>
            <select
              {...register('status', { required: true })}
              className="input input-bordered w-full"
            >
              <option value="RED">Red</option>
              <option value="AMBER">Amber</option>
              <option value="GREEN">Green</option>
            </select>
          </div>
          <div>
            <label className="block font-medium">Status Rationale</label>
            <textarea
              {...register('statusRationale')}
              className="input input-bordered w-full h-24"
            />
          </div>
          <div>
            <label className="block font-medium">Expected Completion</label>
            <input
              type="date"
              {...register('expectedCompletion')}
              className="input input-bordered w-full"
            />
          </div>
          <Button type="submit" text="Save" className="w-full" />
        </form>
      </div>
    </>
  );
};

export default UpdateProjectPage;

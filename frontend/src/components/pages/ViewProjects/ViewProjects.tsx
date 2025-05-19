import React, { useEffect, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import Logout from '../../molecules/Logout';
import useUserStore from '../../../store/userStore';
import axiosInstance from '../../../config/axiosConfig';

// ProjectType options
const PROJECT_TYPES = [
  { label: 'All', value: '' },
  { label: 'Local Government', value: 'LOCAL_GOV' },
  { label: 'National Government', value: 'NATIONAL_GOV' },
  { label: 'Regional Government', value: 'REGIONAL_GOV' },
];

interface Project {
  id: string;
  title: string;
  description?: string;
  type: string;
  regionId: string;
  localAuthorityId?: string;
  expectedCompletion?: string;
  status: string;
  statusRationale?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

const ListProjects: React.FC = () => {
  const { data } = useAuth();
  const { user, setUser } = useUserStore();

  const [projectType, setProjectType] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, [projectType]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/v1/projects${projectType ? `?type=${projectType}` : ''}`;
      const response = await axiosInstance.get(url);
      setProjects(response.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 p-0 m-0 flex flex-col">
      <div className="w-full bg-white shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Projects</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="projectType" className="font-medium">Filter by Type:</label>
          <select
            id="projectType"
            className="border rounded px-3 py-2 focus:outline-none focus:ring"
            value={projectType}
            onChange={e => setProjectType(e.target.value)}
          >
            {PROJECT_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-auto">
        {loading && <div>Loading projects...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && projects.length === 0 && (
          <div>No projects found.</div>
        )}
        {!loading && !error && projects.length > 0 && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <div key={project.id} className="bg-white shadow rounded p-4 flex flex-col">
                <div className="font-semibold text-lg mb-1">{project.title}</div>
                <div className="text-sm text-gray-600 mb-2">{project.type.replace('_', ' ')}</div>
                <div className="mb-2">{project.description}</div>
                <div className="text-xs text-gray-400 mt-auto">Created: {new Date(project.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListProjects;

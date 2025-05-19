import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import Header from '../../organisms/Header';
import useAuth from '../../../hooks/useAuth';
import Logout from '../../molecules/Logout';
import useUserStore from '../../../store/userStore';
import { Link } from 'react-router-dom';
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
      <Header title="Projects">
        <div className="flex items-center space-x-4">
          <div className="flex w-full space-x-4">
            {[
              { label: 'National', value: 'NATIONAL_GOV' },
              { label: 'Regional', value: 'REGIONAL_GOV' },
              { label: 'Local', value: 'LOCAL_GOV' },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() =>
                  setProjectType(projectType === btn.value ? '' : btn.value)
                }
                className={classNames(
                  'sub-page-header',
                  'flex items-center justify-between flex-1 min-w-0 px-6 py-4 border-2 rounded-2xl sketchy-outline transition-colors duration-150 hover:bg-blue-50',
                  {
                    'bg-blue-100 border-blue-400': projectType === btn.value,
                    'bg-white border-gray-400': projectType !== btn.value,
                  }
                )}
                style={{
                  fontFamily: 'Handwritten, sans-serif',
                  fontSize: '1.25rem',
                }}
              >
                <span className="text-left">{btn.label}</span>
                <span className="ml-4 w-8 h-8 flex items-center">
                  {/* Simple UK outline SVG */}
                  <svg
                    viewBox="0 0 40 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8"
                  >
                    <path
                      d="M10 2 L30 8 L28 18 L36 24 L32 38 L22 46 L12 40 L8 28 L14 20 L10 10 Z"
                      stroke="#222"
                      strokeWidth="2"
                      fill="none"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </Header>
      <div className="flex-1 p-6 overflow-auto">
        {loading && <div>Loading projects...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && projects.length === 0 && (
          <div>No projects found.</div>
        )}
        {!loading && !error && projects.length > 0 && (
          <div className="project-list__card grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              let statusClass = '';
              switch (project.status) {
                case 'RED':
                  statusClass = 'red';
                  break;
                case 'AMBER':
                  statusClass = 'amber';
                  break;
                case 'GREEN':
                  statusClass = 'green';
                  break;
                default:
                  statusClass = '';
              }
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="bg-white shadow rounded p-4 flex flex-col relative hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* RAG status icon */}
                  <span
                    className={`project-list__card-rag-status absolute top-4 right-4 ${statusClass}`}
                    title={project.status}
                    style={{ zIndex: 2 }}
                  >
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 36 36"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="18" cy="18" r="15" />
                    </svg>
                  </span>
                  <div className="font-semibold text-lg mb-1">
                    {project.title}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {project.type.replace('_', ' ')}
                  </div>
                  <div className="mb-2">{project.description}</div>
                  <div className="text-xs text-gray-400 mt-auto">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListProjects;

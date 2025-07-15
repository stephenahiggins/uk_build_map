import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { sortBy } from 'lodash';
import Header from '../../organisms/Header';
import { NationalMapIcon } from '../../atoms/NationalMapIcon';
import { RegionalMapIcon } from '../../atoms/RegionalMapIcon';
import { LocalMapIcon } from '../../atoms/LocalMapIcon';
import { SearchBar } from '../../molecules/SearchBar';
import useAuth from '../../../hooks/useAuth';
import useUserStore from '../../../store/userStore';
import { ListProjectsMap } from '../../atoms/ListProjectsMap';
import axiosInstance from '../../../config/axiosConfig';
import { Link } from 'react-router-dom';
import { projectStatusToSentenceCase } from '../../../utils/projectStatusHelpers';
import { Pagination } from '../../molecules/Pagination';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectType, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projectType]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(sortBy(allProjects, 'title'));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allProjects.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query))
      );
      setFilteredProjects(sortBy(filtered, 'title'));
    }
  }, [searchQuery, allProjects]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectType) params.append('type', projectType);
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      const url = `/api/v1/projects?${params.toString()}`;
      const response = await axiosInstance.get(url);
      const projects = response.data.data;
      setTotalPages(response.data.totalPages || 1);
      setAllProjects(projects);
      setFilteredProjects(sortBy(projects, 'title'));
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // For responsive hiding of map on mobile
  const hasMapProjects = filteredProjects.some(
    (p) => p.latitude != null && p.longitude != null
  );

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
                className={clsx(
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
                  {btn.value === 'NATIONAL_GOV' && (
                    <NationalMapIcon className="w-8 h-8" />
                  )}
                  {btn.value === 'REGIONAL_GOV' && (
                    <RegionalMapIcon className="w-8 h-8" />
                  )}
                  {btn.value === 'LOCAL_GOV' && (
                    <LocalMapIcon className="w-8 h-8" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Header>
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <SearchBar
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-6"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full">
          {/* Project List */}
          <div className={hasMapProjects ? 'w-full md:w-2/3' : 'w-full'}>
            {loading && <div>Loading projects...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading && !error && filteredProjects.length === 0 && (
              <div>
                No projects found.{' '}
                {searchQuery && 'Try a different search term.'}
              </div>
            )}
            {!loading && !error && filteredProjects.length > 0 && (
              <div className="project-list__card grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
                {filteredProjects.map((project) => {
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
                      className="project-card bg-white shadow rounded p-4 flex hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 pr-4">
                        <div className="font-semibold text-lg mb-1">
                          {project.title}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {project.type.replace('_', ' ')}
                        </div>
                        <div className="mb-2 text-gray-700">
                          {project.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-auto">
                          Created:{' '}
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-start justify-center w-12">
                        <div
                          className={`project-card__rag-status ${statusClass}`}
                          title={projectStatusToSentenceCase(project.status)}
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
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          {/* Map Section */}
          {hasMapProjects && (
            <div className="hidden md:block md:w-1/3">
              <ListProjectsMap projects={filteredProjects} />
            </div>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ListProjects;

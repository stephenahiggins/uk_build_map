import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { sortBy } from 'lodash';
import Header from '../../organisms/Header';
import Banner from '../../molecules/Banner';
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
  const [availableTypes, setAvailableTypes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [mapProjects, setMapProjects] = useState<Project[]>([]); // Projects for the map view
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false); // Separate loading state for map projects
  const [error, setError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null); // Separate error state for map projects
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allProjectsForSearch, setAllProjectsForSearch] = useState<Project[]>(
    []
  );

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    fetchProjects();
    fetchAllProjectsForMap(); // Fetch all projects for map separately
  }, [projectType]);

  useEffect(() => {
    fetchProjects();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projectType]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(sortBy(allProjects, 'title'));
      setCurrentPage(1);
    } else {
      // When search query is entered, fetch all projects for search
      fetchAllProjectsForSearch();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(sortBy(allProjects, 'title'));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allProjectsForSearch.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query))
      );
      setFilteredProjects(sortBy(filtered, 'title'));
    }
  }, [searchQuery, allProjects, allProjectsForSearch]);

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
      // Track available types for conditional buttons
      const types = new Set<string>();
      projects.forEach((p: Project) => {
        if (p.type) types.add(p.type);
      });
      setAvailableTypes(types);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all projects for search without pagination
  const fetchAllProjectsForSearch = async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectType) params.append('type', projectType);
      params.append('limit', '1000'); // Request a high limit to get all projects for search

      const url = `/api/v1/projects?${params.toString()}`;
      const response = await axiosInstance.get(url);
      const projects = response.data.data;
      setAllProjectsForSearch(projects);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading search data');
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch all projects for map without pagination
  const fetchAllProjectsForMap = async () => {
    setMapLoading(true);
    setMapError(null);
    try {
      const params = new URLSearchParams();
      if (projectType) params.append('type', projectType);
      params.append('limit', '1000'); // Request a high limit to get all projects
      params.append('mapOnly', 'true'); // Optional: backend could use this to return minimal data

      const url = `/api/v1/projects?${params.toString()}`;
      const response = await axiosInstance.get(url);
      const projects = response.data.data;
      setMapProjects(projects);
    } catch (err: any) {
      setMapError(err.message || 'An error occurred loading map data');
    } finally {
      setMapLoading(false);
    }
  };

  // For responsive hiding of map on mobile
  const hasMapProjects = mapProjects.some(
    (p) => p.latitude != null && p.longitude != null
  );

  // Determine if we should show type filter buttons
  const showTypeFilters = (() => {
    if (availableTypes.size < 2) return false; // Need at least 2 categories to matter
    // If only local present, already covered by size < 2 logic but explicit guard kept for clarity
    if (availableTypes.size === 1 && availableTypes.has('LOCAL_GOV'))
      return false;
    return true;
  })();

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 p-0 m-0 flex flex-col">
      <Header
        title="Growth Spots 🚀"
        callout="This catalogue uses nationally available data to bring together national infrastructure and civic improvement projects across governance levels. Data will expand over time and may currently focus on specific regions."
      >
        {showTypeFilters && (
          <div className="flex items-center space-x-4">
            <div className="flex w-full space-x-4">
              {[
                { label: 'National', value: 'NATIONAL_GOV' },
                { label: 'Regional', value: 'REGIONAL_GOV' },
                { label: 'Local', value: 'LOCAL_GOV' },
              ]
                .filter((btn) => availableTypes.has(btn.value))
                .map((btn) => (
                  <button
                    key={btn.value}
                    onClick={() =>
                      setProjectType(projectType === btn.value ? '' : btn.value)
                    }
                    className={clsx(
                      'sub-page-header',
                      'flex items-center justify-between flex-1 min-w-0 px-6 py-4 border-2 rounded-2xl sketchy-outline transition-colors duration-150 hover:bg-blue-50',
                      {
                        'bg-blue-100 border-blue-400':
                          projectType === btn.value,
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
        )}
      </Header>

      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-1">
          <SearchBar
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-1"
          />
        </div>
        <div className="mb-1">
          <Banner className="banner banner-info">
            Can't find a project, or something not right?{' '}
            <a href="/project/add" className="underline font-medium">
              Let us know or add it.
            </a>
          </Banner>
        </div>
        <div className="mb-1">
          <Banner
            className="banner banner-highlight text-xs"
            githubUrl="https://github.com/stephenahiggins/lfg_build_map"
          >
            The data available is currently for the{' '}
            <strong>West Yorkshire</strong> region. We will be progressively
            adding more data. If you know your way around TypeScript, you can
            help by pulling the GitHub repo.
          </Banner>
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full mt-3">
          {/* Project List */}
          <div className={hasMapProjects ? 'w-full md:w-2/3' : 'w-full'}>
            {(loading || searchLoading) && <div>Loading projects...</div>}
            {error && <div className="text-red-600">{error}</div>}
            {!loading &&
              !searchLoading &&
              !error &&
              filteredProjects.length === 0 && (
                <div>
                  No projects found.{' '}
                  {searchQuery && 'Try a different search term.'}
                </div>
              )}
            {!loading &&
              !searchLoading &&
              !error &&
              filteredProjects.length > 0 && (
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
          {/* Map Section - Using mapProjects instead of filteredProjects */}
          {hasMapProjects && (
            <div className="hidden md:block md:w-1/3">
              {mapLoading ? (
                <div>Loading map data...</div>
              ) : mapError ? (
                <div className="text-red-600">{mapError}</div>
              ) : (
                <ListProjectsMap projects={mapProjects} />
              )}
            </div>
          )}
        </div>
        {!searchQuery.trim() && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default ListProjects;

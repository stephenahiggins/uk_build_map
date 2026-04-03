import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { sortBy } from 'lodash';
import Header from '../../organisms/Header';
import Banner from '../../molecules/Banner';
import Callout from '../../molecules/Callout';
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
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

const ListProjects: React.FC = () => {
  const { data } = useAuth();
  const { user, setUser } = useUserStore();

  const [projectType, setProjectType] = useState<string>('');
  const [ragStatuses, setRagStatuses] = useState<Set<string>>(new Set());
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
  const [summary, setSummary] = useState<{
    projectCount: number;
    evidenceCount: number;
    localAuthorityCount: number;
  } | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    fetchProjects();
    fetchAllProjectsForMap(); // Fetch all projects for map separately
    fetchProjectSummary();
  }, [projectType, ragStatuses]);

  useEffect(() => {
    fetchProjects();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projectType, ragStatuses]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(sortBy(allProjects, 'title'));
      setCurrentPage(1);
    } else {
      // When search query is entered, fetch all projects for search
      fetchAllProjectsForSearch();
    }
  }, [searchQuery, projectType, ragStatuses]);

  useEffect(() => {
    const ragFiltered =
      ragStatuses.size === 0
        ? allProjectsForSearch
        : allProjectsForSearch.filter((p) => ragStatuses.has(p.status));
    if (searchQuery.trim() === '') {
      setFilteredProjects(sortBy(allProjects, 'title'));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = ragFiltered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          (project.description &&
            project.description.toLowerCase().includes(query))
      );
      setFilteredProjects(sortBy(filtered, 'title'));
    }
  }, [searchQuery, allProjects, allProjectsForSearch, ragStatuses]);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (projectType) params.append('type', projectType);
      const ragStatusList = Array.from(ragStatuses);
      const useServerRagFilter = ragStatusList.length <= 1;
      if (useServerRagFilter && ragStatusList.length === 1) {
        params.append('status', ragStatusList[0]);
      }
      if (useServerRagFilter) {
        params.append('page', currentPage.toString());
        params.append('limit', '10');
      } else {
        params.append('limit', '1000');
      }
      const url = `/api/v1/projects?${params.toString()}`;
      const response = await axiosInstance.get(url);
      const projects = response.data.data;
      if (useServerRagFilter) {
        setTotalPages(response.data.totalPages || 1);
      } else {
        setTotalPages(1);
      }
      setAllProjects(projects);
      const filteredByRag =
        ragStatusList.length === 0
          ? projects
          : projects.filter((p: Project) => ragStatuses.has(p.status));
      setFilteredProjects(sortBy(filteredByRag, 'title'));
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

  const fetchProjectSummary = async () => {
    setSummaryError(null);
    try {
      const params = new URLSearchParams();
      if (projectType) params.append('type', projectType);
      const ragStatusList = Array.from(ragStatuses);
      if (ragStatusList.length <= 1 && ragStatusList.length === 1) {
        params.append('status', ragStatusList[0]);
      }

      const url = `/api/v1/projects/summary?${params.toString()}`;
      const response = await axiosInstance.get(url);
      setSummary(response.data);
    } catch (err: any) {
      setSummaryError(err.message || 'An error occurred loading summary data');
    }
  };

  // Fetch all projects for search without pagination
  const fetchAllProjectsForSearch = async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectType) params.append('type', projectType);
      const ragStatusList = Array.from(ragStatuses);
      if (ragStatusList.length <= 1 && ragStatusList.length === 1) {
        params.append('status', ragStatusList[0]);
      }
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
      const ragStatusList = Array.from(ragStatuses);
      if (ragStatusList.length <= 1 && ragStatusList.length === 1) {
        params.append('status', ragStatusList[0]);
      }
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

  const filteredMapProjects =
    ragStatuses.size === 0
      ? mapProjects
      : mapProjects.filter((p) => ragStatuses.has(p.status));

  // For responsive hiding of map on mobile
  const hasMapProjects = filteredMapProjects.some(
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

  const totalProjectsCount = summary?.projectCount ?? 0;
  const totalEvidenceCount = summary?.evidenceCount ?? 0;
  const localAuthoritiesCount = summary?.localAuthorityCount ?? 0;

  return (
    <div className="w-full h-full min-h-screen bg-gray-50 p-0 m-0 flex flex-col">
      <div className="relative">
        <Header
          title="Growth Spots 🇬🇧"
          callout={
            <div className="flex flex-col gap-1">
              <div>
                Growth Spots shows you where the UK government is investing in
                local growth.
              </div>
              {!summaryError && summary && (
                <div className="text-sm text-gray-500">
                  Showing {totalProjectsCount} projects with{' '}
                  {totalEvidenceCount} evidence items across{' '}
                  {localAuthoritiesCount} local authorities in this view
                </div>
              )}
              {!summaryError && !summary && (
                <div className="text-sm text-gray-500">Loading counts...</div>
              )}
            </div>
          }
          calloutTextSize="text-base"
          calloutComponent={
            <Callout
              variant="info"
              size="lg"
              fontSize="base"
              className="max-w-sm -ml-2"
            >
              <div>
                <span>
                  Limited data is currently available. We will progressively add
                  more data as we go.
                </span>{' '}
                <a
                  href="https://github.com/stephenahiggins/uk_build_map"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-blue-600 transition-colors"
                >
                  Contribute on GitHub
                </a>
              </div>
            </Callout>
          }
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
                        setProjectType(
                          projectType === btn.value ? '' : btn.value
                        )
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
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-1 flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-1"
            />
          </div>
          <div className="w-full md:w-auto md:h-12">
            <div className="inline-flex flex-wrap gap-2 h-full items-stretch">
              {[
                { label: 'Red', value: 'RED', statusClass: 'red' },
                { label: 'Amber', value: 'AMBER', statusClass: 'amber' },
                { label: 'Green', value: 'GREEN', statusClass: 'green' },
              ].map((option) => {
                const isActive = ragStatuses.has(option.value);
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setRagStatuses((prev) => {
                        const next = new Set(prev);
                        if (next.has(option.value)) {
                          next.delete(option.value);
                        } else {
                          next.add(option.value);
                        }
                        return next;
                      });
                    }}
                    aria-pressed={isActive}
                    className={clsx(
                      'flex items-center gap-2 rounded-full border px-3 py-3 text-sm transition-colors h-full',
                      isActive
                        ? 'border-gray-700 bg-gray-100 text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <span
                      className={`project-card__rag-status ${option.statusClass}`}
                      title={option.label}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 36 36"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="18" cy="18" r="15" />
                      </svg>
                    </span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
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
                <ListProjectsMap projects={filteredMapProjects} />
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

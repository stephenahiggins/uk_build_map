import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axiosConfig';

import Header from '../../organisms/Header';
import { projectStatusToSentenceCase } from '../../../utils/projectStatusHelpers';
import ProjectMap from '../../atoms/ProjectMap';
import Button from '../../molecules/Button';
import { Plus, Megaphone, Pencil } from 'lucide-react';
import useUserStore, {
  USER_TYPE_ADMIN,
  USER_TYPE_MODERATOR,
  USER_TYPE_USER,
} from '../../../store/userStore';

interface Evidence {
  id: string;
  projectId: string;
  submittedById: number;
  type: string;
  title: string;
  url?: string;
  description?: string;
  summary?: string;
  source?: string;
  datePublished?: string;
  createdAt: string;
  moderationState?: string;
  latitude?: number | null;
  longitude?: number | null;
}

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
  evidence?: Evidence[];
}

const ViewProject: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useUserStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribeChecked, setSubscribeChecked] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/api/v1/projects/${id}`);
        setProject(response.data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={project ? project.title : 'Loading...'}>
        {(user?.user_type === USER_TYPE_USER ||
          user?.user_type === USER_TYPE_ADMIN ||
          user?.user_type === USER_TYPE_MODERATOR) && (
          <Button
            text="Add Evidence"
            icon={<Plus size={18} />}
            className="highlight"
            variant="primary"
            onClick={() => navigate(`/project/${id}/add-evidence`)}
          />
        )}
      </Header>
      <div className="p-4 pb-0 flex items-center">
        <button
          onClick={() => navigate('/project/list')}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium focus:outline-none"
          aria-label="Back to Projects"
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
          Back to Projects
        </button>
      </div>
      <main className="flex flex-1 flex-col gap-6 p-6">
        {loading && <div>Loading project...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && project && (
          <div className="flex flex-col lg:flex-row gap-6 w-full">
            {/* Left: Details/Scorecard (9/12) */}
            <div className="flex-1 lg:w-9/12 space-y-6">
              <section className="bg-white rounded shadow p-6 mb-4">
                <div className="flex flex-row items-center justify-between gap-6">
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold mb-2 flex items-center">
                      Details
                    </h2>
                    <div className="mb-2">{project.description}</div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <div>
                        <strong>Type:</strong> {project.type.replace('_', ' ')}
                      </div>
                      <div>
                        <strong>Status:</strong>{' '}
                        {projectStatusToSentenceCase(project.status)}
                      </div>
                      <div>
                        <strong>Expected Completion:</strong>{' '}
                        {project.expectedCompletion
                          ? new Date(
                              project.expectedCompletion
                            ).toLocaleDateString()
                          : '-'}
                      </div>
                      <div>
                        <strong>Created:</strong>{' '}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {/* Right: RAG Marker */}
                  <div className="flex items-center justify-center min-w-[70px]">
                    <span
                      className={`relative -top-9 -right-2 project-card__rag-status ${project.status?.toLowerCase()}`}
                      title={projectStatusToSentenceCase(project.status)}
                    >
                      <svg
                        width="55"
                        height="55"
                        viewBox="0 0 36 36"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="18" cy="18" r="15" />
                      </svg>
                    </span>
                  </div>
                </div>
              </section>
              <section className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold mb-2">Timeline</h2>
                {project.evidence && project.evidence.length > 0 ? (
                  <ol className="relative border-l border-gray-200 dark:border-gray-700">
                    {project.evidence
                      .slice()
                      .sort((a, b) => {
                        if (!a.datePublished) return 1;
                        if (!b.datePublished) return -1;
                        return (
                          new Date(b.datePublished).getTime() -
                          new Date(a.datePublished).getTime()
                        );
                      })
                      .map((ev, idx) => (
                        <li className="mb-10 ml-4" key={ev.id}>
                          <div className="absolute w-3 h-3 bg-blue-200 rounded-full mt-1.5 -left-1.5 border border-blue-400" />
                          <time className="mb-1 text-xs font-normal leading-none text-gray-400">
                            {ev.datePublished
                              ? new Date(ev.datePublished).toLocaleDateString()
                              : 'No publish date'}
                          </time>
                          <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                            {ev.title}
                          </h3>
                          {ev.summary && (
                            <p className="mb-1 text-sm text-gray-800">
                              <span className="font-medium">Summary:</span>{' '}
                              {ev.summary}
                            </p>
                          )}
                          {ev.description && (
                            <p className="mb-1 text-sm text-gray-500">
                              <span className="font-medium">Description:</span>{' '}
                              {ev.description}
                            </p>
                          )}
                          {ev.source && (
                            <p className="mb-1 text-sm text-gray-700">
                              <span className="font-medium">Source:</span>{' '}
                              {ev.source}
                            </p>
                          )}
                          {ev.url && (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:underline mt-1"
                            >
                              {ev.source || ev.url}
                            </a>
                          )}
                        </li>
                      ))}
                  </ol>
                ) : (
                  <div className="italic text-gray-400">No evidence yet.</div>
                )}
              </section>
            </div>
            {/* Right: Map (3/12) and Similar Projects */}
            <div className="flex flex-col gap-6 lg:w-3/12 min-w-[260px]">
              {/* New section: Subscribe & Actions */}
              <section className="bg-white rounded shadow p-6 flex flex-col items-center justify-center gap-4">
                <Button
                  checked={!subscribeChecked}
                  text={
                    !subscribeChecked
                      ? 'Subscribe to updates'
                      : 'Unsubscribe from updates'
                  }
                  onClick={() => {
                    setSubscribeChecked((prev) => {
                      const next = !prev;
                      console.log('Subscribe checked:', next);
                      return next;
                    });
                  }}
                  className={`w-full justify-center ${subscribeChecked ? 'highlight' : 'secondary'}`}
                />
                <Button
                  text="Make a difference"
                  icon={<Megaphone size={18} />}
                  className="secondary w-full"
                  variant="secondary"
                  onClick={() => {}}
                />
                {
                  <Button
                    text="Add Evidence"
                    icon={<Plus size={18} />}
                    className="highlight w-full"
                    variant="primary"
                    onClick={() => navigate(`/project/${id}/add-evidence`)}
                  />
                }
                {(user?.user_type === USER_TYPE_ADMIN ||
                  user?.user_type === USER_TYPE_MODERATOR) && (
                  <Button
                    text="Edit Project"
                    icon={<Pencil size={18} />}
                    className="highlight w-full"
                    variant="primary"
                    onClick={() => navigate(`/project/${id}/edit`)}
                  />
                )}
              </section>
              <section className="bg-white rounded shadow p-6 flex flex-col items-center justify-center min-h-[180px]">
                <h2 className="text-lg font-semibold mb-2">Location</h2>
                <div className="w-full">
                  <ProjectMap
                    latitude={project.latitude}
                    longitude={project.longitude}
                    title={project.title}
                  />
                </div>
              </section>
              <section className="bg-white rounded shadow p-6 flex flex-col items-center justify-center min-h-[100px]">
                <h2 className="text-lg font-semibold mb-2">Similar projects</h2>
                <div className="italic text-gray-400">
                  (Similar projects placeholder)
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ViewProject;

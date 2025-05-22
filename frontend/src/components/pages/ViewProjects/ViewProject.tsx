import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axiosConfig';

import Header from '../../organisms/Header';

interface Evidence {
  id: string;
  projectId: string;
  submittedById: number;
  type: string;
  title: string;
  urlOrBlobId?: string;
  description?: string;
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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <Header title={project ? project.title : 'Loading...'} />
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
                <h2 className="text-xl font-semibold mb-2">
                  Details / Scorecard
                </h2>
                <div className="mb-2">{project.description}</div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                  <div>
                    <strong>Type:</strong> {project.type.replace('_', ' ')}
                  </div>
                  <div>
                    <strong>Status:</strong> {project.status}
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
              </section>
              <section className="bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold mb-2">Timeline</h2>
                {project.evidence && project.evidence.length > 0 ? (
                  <ol className="relative border-l border-gray-200 dark:border-gray-700">
                    {project.evidence
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(a.createdAt).getTime() -
                          new Date(b.createdAt).getTime()
                      )
                      .map((ev, idx) => (
                        <li className="mb-10 ml-4" key={ev.id}>
                          <div className="absolute w-3 h-3 bg-blue-200 rounded-full mt-1.5 -left-1.5 border border-blue-400" />
                          <time className="mb-1 text-xs font-normal leading-none text-gray-400">
                            {new Date(ev.createdAt).toLocaleDateString()}
                          </time>
                          <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                            {ev.title}
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                              {ev.type}
                            </span>
                          </h3>
                          {ev.description && (
                            <p className="mb-2 text-sm font-normal text-gray-500">
                              {ev.description}
                            </p>
                          )}
                          {ev.urlOrBlobId && (
                            <a
                              href={ev.urlOrBlobId}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:underline mt-1"
                            >
                              View Evidence
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
              <section className="bg-white rounded shadow p-6 flex flex-col items-center justify-center min-h-[180px]">
                <h2 className="text-lg font-semibold mb-2">
                  Map showing location
                </h2>
                <div className="italic text-gray-400 text-center">
                  (Map placeholder
                  <br />
                  Show other projects nearby)
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

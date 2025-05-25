import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import metadataService from '../../../services/metadataService';
import axiosInstance from '../../../config/axiosConfig';
import useUserStore from '../../../store/userStore';
import Button from '../../molecules/Button';
import { FiUpload, FiX } from 'react-icons/fi';

interface ProjectForm {
  title: string;
  description: string;
  type: 'LOCAL_GOV' | 'NATIONAL_GOV' | 'REGIONAL_GOV';
  regionId: string;
  localAuthorityId: string;
  expectedCompletion: string;
  status: 'AMBER' | 'GREEN' | 'RED';
  image?: FileList;
}

interface Region {
  id: string;
  name: string;
}
interface LocalAuthority {
  id: string;
  name: string;
}

const AddProjectPage: React.FC = () => {
  const user = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProjectForm>();
  const [regions, setRegions] = useState<Region[]>([]);
  const [localAuthorities, setLocalAuthorities] = useState<LocalAuthority[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch regions and local authorities
    async function fetchData() {
      try {
        const [regionsRes, localAuthRes] = await Promise.all([
          metadataService.getRegions(),
          metadataService.getLocalAuthorities(),
        ]);
        setRegions(regionsRes);
        setLocalAuthorities(localAuthRes);
      } catch (e) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    },
    []
  );

  const removeImage = useCallback((): void => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreviewUrl(null);
  }, []);

  const onSubmit = useCallback(
    async (data: ProjectForm): Promise<void> => {
      // Convert expectedCompletion to ISO-8601 if only a date is provided
      if (data.expectedCompletion && !data.expectedCompletion.includes('T')) {
        data.expectedCompletion = new Date(
          data.expectedCompletion
        ).toISOString();
      }

      try {
        const formData = new FormData();

        // Add all form fields to FormData
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string | Blob);
          }
        });

        // Add the image file if it exists
        if (fileInputRef.current?.files?.[0]) {
          formData.append('image', fileInputRef.current.files[0]);
        }

        await axiosInstance.post('/api/v1/projects', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setPreviewUrl(null);
        reset();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to add project';
        setError(errorMessage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [reset]
  );

  // Memoize the form submission handler
  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>): void => {
      e.preventDefault();
      void handleSubmit(onSubmit)(e);
    },
    [handleSubmit, onSubmit]
  );

  if (loading) return <div className="p-8">Loading...</div>;
  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-6">Add Project</h1>
      {success && (
        <div className="mb-4 text-green-600">
          Project tracking added successfully!
        </div>
      )}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input
            {...register('title', { required: true })}
            className="input input-bordered w-full"
            id="title"
          />
          {errors.title && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>
        <div>
          <label htmlFor="description" className="block font-medium">
            Description
          </label>
          <textarea
            {...register('description')}
            className="input input-bordered w-full h-24"
            id="description"
          />
        </div>
        <div>
          <label htmlFor="type" className="block font-medium">
            Type
          </label>
          <select
            {...register('type', { required: true })}
            className="input input-bordered w-full"
            id="type"
          >
            <option value="">Select region level</option>
            <option value="LOCAL_GOV">Local Government</option>
            <option value="NATIONAL_GOV">National Government</option>
            <option value="REGIONAL_GOV">Regional Government</option>
          </select>
          {errors.type && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>{' '}
        <div>
          <label htmlFor="regionId" className="block font-medium">
            Region
          </label>
          <select
            {...register('regionId', { required: true })}
            className="input input-bordered w-full"
            id="regionId"
          >
            <option value="">Select region</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {errors.regionId && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>
        <div>
          <label htmlFor="localAuthorityId" className="block font-medium">
            Local Authority
          </label>
          <select
            {...register('localAuthorityId')}
            className="input input-bordered w-full"
            id="localAuthorityId"
          >
            <option value="">Select local authority (optional)</option>
            {localAuthorities.map((la) => (
              <option key={la.id} value={la.id}>
                {la.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="expectedCompletion" className="block font-medium">
            Expected Completion
          </label>
          <input
            type="date"
            {...register('expectedCompletion')}
            className="input input-bordered w-full"
            id="expectedCompletion"
          />
        </div>
        <div>
          <label htmlFor="status" className="block font-medium">
            Status
          </label>
          <select
            {...register('status', { required: true })}
            className="input input-bordered w-full"
            id="status"
          >
            <option value="">Select status</option>
            <option value="RED">Red</option>
            <option value="AMBER">Amber</option>
            <option value="GREEN">Green</option>
          </select>
          {errors.status && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="image" className="block font-medium mb-2">
              Project Image (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="image"
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg border border-gray-300 flex items-center"
              >
                <FiUpload /> <span>Choose File(s)</span>
                <input
                  type="file"
                  {...register('image')}
                  accept="image/*"
                  className="sr-only"
                  id="image"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    aria-label="Remove image"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Upload a cover image for your project (JPG, PNG, GIF, max 5MB)
            </p>
          </div>

          <Button
            type="submit"
            className="btn btn-primary w-full"
            text="Add project"
          />
        </div>
      </form>
    </div>
  );
};

export default AddProjectPage;

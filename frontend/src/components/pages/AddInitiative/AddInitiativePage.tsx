import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import metadataService from '../../../services/metadataService';
import axiosInstance from '../../../config/axiosConfig';
import useUserStore from '../../../store/userStore';

interface InitiativeForm {
  title: string;
  description: string;
  type: 'LOCAL_GOV' | 'NATIONAL_GOV' | 'REGIONAL_GOV';
  ownerOrg: string;
  regionId: string;
  localAuthorityId: string;
  expectedCompletion: string;
  status: 'AMBER' | 'GREEN';
}

interface Region {
  id: string;
  name: string;
}
interface LocalAuthority {
  id: string;
  name: string;
}

const AddInitiativePage: React.FC = () => {
  const { user, setUser, clearUser } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InitiativeForm>();
  const [regions, setRegions] = useState<Region[]>([]);
  const [localAuthorities, setLocalAuthorities] = useState<LocalAuthority[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (data: InitiativeForm) => {
    setError(null);
    setSuccess(false);
    try {
      await axiosInstance.post('/api/v1/initiatives', data);
      setSuccess(true);
      reset();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add initiative');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-6">Add Initiative</h1>
      {success && (
        <div className="mb-4 text-green-600">
          Initiative added successfully!
        </div>
      )}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input
            {...register('title', { required: true })}
            className="input input-bordered w-full"
          />
          {errors.title && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            {...register('description')}
            className="input input-bordered w-full h-24"
          />
        </div>
        <div>
          <label className="block font-medium">Type</label>
          <select
            {...register('type', { required: true })}
            className="input input-bordered w-full"
          >
            <option value="">Select region level</option>
            <option value="LOCAL_GOV">Local Government</option>
            <option value="NATIONAL_GOV">National Government</option>
            <option value="REGIONAL_GOV">Regional Government</option>
          </select>
          {errors.type && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>
        <div>
          <label className="block font-medium">Owner Organisation</label>
          <input
            {...register('ownerOrg', { required: true })}
            className="input input-bordered w-full"
          />
          {errors.ownerOrg && (
            <span className="text-red-500">This field is required</span>
          )}
        </div>
        <div>
          <label className="block font-medium">Region</label>
          <select
            {...register('regionId', { required: true })}
            className="input input-bordered w-full"
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
          <label className="block font-medium">Local Authority</label>
          <select
            {...register('localAuthorityId')}
            className="input input-bordered w-full"
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
          <label className="block font-medium">Expected Completion</label>
          <input
            type="date"
            {...register('expectedCompletion')}
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Status</label>
          <select
            {...register('status', { required: true })}
            className="input input-bordered w-full"
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
        <button type="submit" className="btn btn-primary w-full">
          Add Initiative
        </button>
      </form>
    </div>
  );
};

export default AddInitiativePage;

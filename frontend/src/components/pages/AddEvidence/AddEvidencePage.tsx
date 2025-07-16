import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../../config/axiosConfig';
import Button from '../../molecules/Button';

interface EvidenceForm {
  type: 'PDF' | 'URL' | 'TEXT' | 'DATE';
  title: string;
  summary?: string;
  source?: string;
  url?: string;
  datePublished?: string;
  description?: string;
}

const AddEvidencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<EvidenceForm>();

  const onSubmit = async (data: EvidenceForm) => {
    if (!id) return;
    try {
      await axiosInstance.post(`/api/v1/projects/${id}/evidence`, data);
      navigate(`/project/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-6">Add Evidence</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block font-medium">Title</label>
          <input {...register('title', { required: true })} className="input input-bordered w-full" />
          {errors.title && <span className="text-red-500">This field is required</span>}
        </div>
        <div>
          <label className="block font-medium">Type</label>
          <select {...register('type', { required: true })} className="input input-bordered w-full">
            <option value="">Select type</option>
            <option value="PDF">PDF</option>
            <option value="URL">URL</option>
            <option value="TEXT">TEXT</option>
            <option value="DATE">DATE</option>
          </select>
          {errors.type && <span className="text-red-500">This field is required</span>}
        </div>
        <div>
          <label className="block font-medium">Summary</label>
          <textarea {...register('summary')} className="input input-bordered w-full h-24" />
        </div>
        <div>
          <label className="block font-medium">Source</label>
          <input {...register('source')} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-medium">URL</label>
          <input {...register('url')} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-medium">Date Published</label>
          <input type="date" {...register('datePublished')} className="input input-bordered w-full" />
        </div>
        <div>
          <label className="block font-medium">Description</label>
          <textarea {...register('description')} className="input input-bordered w-full h-24" />
        </div>
        <Button type="submit" text="Submit Evidence" className="w-full" />
      </form>
    </div>
  );
};

export default AddEvidencePage;

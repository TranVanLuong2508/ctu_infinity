import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
  ICriteria,
  ICriteriaData,
  ICriteriaTreeData,
  ICreateCriteriaPayload,
  IUpdateCriteriaPayload,
  IDeleteCriteriaResponse,
} from '@/types/criteria.type';

export const CriteriaService = {
  CallFetchCriteriaList: (
    frameworkId?: string,
  ): Promise<IBackendRes<ICriteriaData>> => {
    const params = frameworkId ? { frameworkId } : {};
    return privateAxios.get(`/criterias`, { params });
  },

  CallFetchCriteriaTree: (
    frameworkId?: string,
  ): Promise<IBackendRes<ICriteriaTreeData>> => {
    const params = frameworkId ? { frameworkId } : {};
    return privateAxios.get(`/criterias/tree`, { params });
  },

  CallGetCriteriaDetail: (
    criteriaId: string,
  ): Promise<IBackendRes<ICriteria>> => {
    return privateAxios.get(`/criterias/${criteriaId}`);
  },

  CallCreateCriteria: (
    payload: ICreateCriteriaPayload,
  ): Promise<IBackendRes<ICriteria>> => {
    return privateAxios.post('/criterias', payload);
  },

  CallUpdateCriteria: (
    criteriaId: string,
    payload: IUpdateCriteriaPayload,
  ): Promise<IBackendRes<{ criteriaId: string }>> => {
    return privateAxios.patch(`/criterias/${criteriaId}`, payload);
  },

  CallDeleteCriteria: (
    criteriaId: string,
  ): Promise<IBackendRes<IDeleteCriteriaResponse>> => {
    return privateAxios.delete(`/criterias/${criteriaId}`);
  },
};

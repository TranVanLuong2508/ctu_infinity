import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';
import {
    ICriteriaFramework,
    ICriteriaFrameworkData,
    ICreateFrameworkPayload,
    IUpdateFrameworkPayload,
    ICloneFrameworkPayload,
    IApproveFrameworkResponse,
    IArchiveFrameworkResponse,
    ICloneFrameworkResponse,
} from '@/types/criteria-framework.type';

export const CriteriaFrameworkService = {
    /**
     * Fetch all criteria frameworks
     */
    CallFetchFrameworks: (): Promise<IBackendRes<ICriteriaFrameworkData>> => {
        return privateAxios.get('/criteria-frame');
    },

    /**
     * Get currently active framework
     */
    CallGetActiveFramework: (): Promise<IBackendRes<ICriteriaFramework>> => {
        return privateAxios.get('/criteria-frame/active');
    },

    /**
     * Get framework detail by ID
     */
    CallGetFrameworkDetail: (frameworkId: string): Promise<IBackendRes<ICriteriaFramework>> => {
        return privateAxios.get(`/criteria-frame/${frameworkId}`);
    },

    /**
     * Create new framework (DRAFT status)
     */
    CallCreateFramework: (
        payload: ICreateFrameworkPayload
    ): Promise<IBackendRes<ICriteriaFramework>> => {
        return privateAxios.post('/criteria-frame', payload);
    },

    /**
     * Update framework (only if DRAFT)
     */
    CallUpdateFramework: (
        frameworkId: string,
        payload: IUpdateFrameworkPayload
    ): Promise<IBackendRes<ICriteriaFramework>> => {
        return privateAxios.patch(`/criteria-frame/${frameworkId}`, payload);
    },

    /**
     * Delete framework (only if DRAFT, cascade delete criteria)
     */
    CallDeleteFramework: (
        frameworkId: string
    ): Promise<IBackendRes<{ frameworkId: string; criteriaDeleted: number }>> => {
        return privateAxios.delete(`/criteria-frame/${frameworkId}`);
    },

    /**
     * Approve framework (DRAFT → ACTIVE, auto-archive previous active)
     */
    CallApproveFramework: (
        frameworkId: string
    ): Promise<IBackendRes<IApproveFrameworkResponse>> => {
        return privateAxios.post(`/criteria-frame/${frameworkId}/approve`);
    },

    /**
     * Archive framework (ACTIVE → ARCHIVED)
     */
    CallArchiveFramework: (
        frameworkId: string
    ): Promise<IBackendRes<IArchiveFrameworkResponse>> => {
        return privateAxios.post(`/criteria-frame/${frameworkId}/archive`);
    },

    /**
     * Clone framework with entire criteria tree
     */
    CallCloneFramework: (
        sourceFrameworkId: string,
        payload: ICloneFrameworkPayload
    ): Promise<IBackendRes<ICloneFrameworkResponse>> => {
        return privateAxios.post(`/criteria-frame/${sourceFrameworkId}/clone`, payload);
    },
};

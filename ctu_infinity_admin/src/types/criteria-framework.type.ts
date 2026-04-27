import { IBackendRes } from '@/types/backend.type';

export enum FrameworkStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
}

export interface ICriteriaFramework {
    frameworkId: string;
    frameworkName: string;
    version: string;
    startDate: string;
    endDate: string | null;
    status: FrameworkStatus;
    isActive: boolean;
    description: string | null;
    criteriaCount: number;
    createdBy: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ICriteriaFrameworkData {
    frameworks: ICriteriaFramework[];
}

export interface ICreateFrameworkPayload {
    frameworkName: string;
    version: string;
    startDate: string;
    description?: string;
}

export interface IUpdateFrameworkPayload {
    frameworkName?: string;
    version?: string;
    startDate?: string;
    description?: string;
}

export interface ICloneFrameworkPayload {
    frameworkName: string;
    version: string;
    startDate: string;
    description?: string;
}

export interface IApproveFrameworkResponse {
    frameworkId: string;
    previousActiveId: string | null;
}

export interface IArchiveFrameworkResponse {
    frameworkId: string;
    endDate: string;
}

export interface ICloneFrameworkResponse {
    newFrameworkId: string;
    criteriaCount: number;
}

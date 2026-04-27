import { IBackendRes } from '@/types/backend.type';

export interface ICriteria {
    criteriaId: string;
    criteriaCode: string;
    criteriaName: string;
    description: string | null;
    maxScore: number | null;
    parentId: string | null;
    frameworkId: string;
    displayOrder: number;
    level: number;
    isLeaf: boolean;
    children?: ICriteria[];
    createdAt: string;
    updatedAt: string;
    parent?: ICriteria | null;
}

export interface ICriteriaData {
    criterias: ICriteria[];
}

export interface ICriteriaTreeData {
    tree: ICriteria[];
}

export interface ICreateCriteriaPayload {
    criteriaName: string;
    description?: string;
    maxScore?: number;
    parentId?: string;
    frameworkId: string;
}

export interface IUpdateCriteriaPayload {
    criteriaName?: string;
    description?: string;
    maxScore?: number;
}

export interface IDeleteCriteriaResponse {
    criteriaId: string;
    totalDeleted: number;
    siblingsUpdated: number;
}

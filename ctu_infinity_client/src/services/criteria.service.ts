import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export interface ICriteriaItem {
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  description?: string;
  maxScore?: number | null;
  parentId?: string | null;
  frameworkId: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  framework?: {
    frameworkId: string;
    frameworkName: string;
    status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  };
  isLeaf?: boolean;
  level?: number;
}

export const criteriaService = {
  /**
   * Lấy danh sách tất cả criteria
   * Note: Backend trả về { criterias: [] } và interceptor wrap vào data
   */
  getAllCriteria: (): Promise<IBackendRes<{ criterias: ICriteriaItem[] }>> => {
    return privateAxios.get('/criterias');
  },

  /**
   * Lấy danh sách criteria thuộc framework đang ACTIVE
   */
  getActiveCriteria: (): Promise<
    IBackendRes<{ criterias: ICriteriaItem[] }>
  > => {
    return privateAxios.get('/criterias', { params: { status: 'ACTIVE' } });
  },

  /**
   * Lấy danh sách criteria LÁ thuộc framework đang ACTIVE
   */
  getActiveLeafCriteria: (): Promise<
    IBackendRes<{ criterias: ICriteriaItem[] }>
  > => {
    return privateAxios.get('/criterias', {
      params: { status: 'ACTIVE', isLeaf: true },
    });
  },

  /**
   * Lấy danh sách criteria dạng cây thuộc framework đang ACTIVE
   */
  getActiveCriteriaTree: (): Promise<IBackendRes<{ tree: any[] }>> => {
    return privateAxios.get('/criterias/tree', {
      params: { status: 'ACTIVE' },
    });
  },

  /**
   * Lấy chi tiết một criteria theo ID
   */
  getCriteriaById: (
    criteriaId: string,
  ): Promise<IBackendRes<ICriteriaItem>> => {
    return privateAxios.get(`/criterias/${criteriaId}`);
  },
};

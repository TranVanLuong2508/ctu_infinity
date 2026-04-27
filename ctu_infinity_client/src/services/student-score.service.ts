import axios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export interface MyScoresFilter {
  /** Ưu tiên: lọc theo semesterId */
  semesterId?: string;
  /** Fallback: lọc theo date range (dùng khi không có semesterId) */
  startDate?: string;
  endDate?: string;
}

export interface IScoreRecord {
  id: string;
  studentId: string;
  eventId: string;
  criteriaId: string;
  scoreValue: number;
  createdAt: string;
  event?: any;
}

export interface IMyScoresResponse {
  scores: IScoreRecord[];
  totalsByCriteriaId: Record<string, number>;
}

export const studentScoreService = {
  /**
   * Lấy điểm rèn luyện của sinh viên hiện tại.
   * Ưu tiên lọc theo semesterId; nếu không có thì dùng date range.
   */
  getMyScores: async (filter?: MyScoresFilter): Promise<IBackendRes<IMyScoresResponse>> => {
    const queryParams = new URLSearchParams();
    if (filter?.semesterId) queryParams.append('semesterId', filter.semesterId);
    if (filter?.startDate) queryParams.append('startDate', filter.startDate);
    if (filter?.endDate) queryParams.append('endDate', filter.endDate);

    const queryString = queryParams.toString();
    const url = `/student-scores/my-scores${queryString ? `?${queryString}` : ''}`;

    return await axios.get(url);
  },
};

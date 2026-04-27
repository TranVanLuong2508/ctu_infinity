import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

export interface IRecommendationItem {
  eventId: string;
  eventName: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  criteriaId?: string | null;
  score: number;
  eventScore?: number | null;
  currentParticipants?: number;
  maxParticipants?: number | null;
  explanation?: {
    reasonType: 'DEFICIT' | 'SUBSCRIPTION' | 'HISTORY' | 'COMMUNITY';
    message: string;
  } | null;
  categories?: { categoryId: string; categoryName: string; slug?: string }[];
  organizer?: { organizerId: string; organizerName?: string } | null;
}

export interface IRecommendationParams {
  topK?: number;
  debug?: boolean;
}

export const recommendationService = {
  getHybridRecommendations: (
    params?: IRecommendationParams
  ): Promise<IBackendRes<{ recommendations: IRecommendationItem[] }>> => {
    return privateAxios.get('/recommendation/hybrid', { params });
  },

  getContentRecommendations: (
    params?: IRecommendationParams
  ): Promise<IBackendRes<{ recommendations: IRecommendationItem[] }>> => {
    return privateAxios.get('/recommendation/content', { params });
  },

  getCollabRecommendations: (
    params?: IRecommendationParams
  ): Promise<IBackendRes<{ recommendations: IRecommendationItem[] }>> => {
    return privateAxios.get('/recommendation/collab', { params });
  }
};

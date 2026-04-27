import { create } from 'zustand';
import { ICriteriaItem, criteriaService } from '@/services/criteria.service';
import { studentScoreService } from '@/services/student-score.service';
import { IEvent } from '@/types/event.type';
import { eventService } from '@/services/event.service';
import { eventRegistrationService } from '@/services/event-registration.service';
import { recommendationService } from '@/services/recommendation.service';

type SemesterFilterInput = {
  semesterId: string;
};
import { toast } from 'sonner';

interface CriteriaTreeNode {
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  maxScore: number | null;
  parentId: string | null;
  displayOrder: number;
  children: CriteriaTreeNode[];
}

interface DashboardState {
  criterias: ICriteriaItem[];
  criteriaTree: CriteriaTreeNode[];
  myScores: Record<string, number>;
  allEvents: IEvent[];
  upcomingEvents: IEvent[];
  hybridRecommendations: IEvent[];

  previousSemesterScore: number;

  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDashboardData: (filter: SemesterFilterInput) => Promise<void>;
  refreshRegistrationStatuses: () => Promise<void>;
  reset: () => void;
}

const initialState: DashboardState = {
  criterias: [],
  criteriaTree: [],
  myScores: {},
  allEvents: [],
  upcomingEvents: [],
  hybridRecommendations: [],
  previousSemesterScore: 0,
  isLoading: false,
  error: null,
};

export const useDashboardStore = create<DashboardState & DashboardActions>(
  (set, get) => ({
    ...initialState,

    fetchDashboardData: async (filter: SemesterFilterInput) => {
      set({ isLoading: true, error: null });
      try {
        const [criteriasRes, treeRes, scoresRes, eventsRes, myEventsRes, recommendRes] =
          await Promise.all([
            criteriaService.getActiveCriteria(),
            criteriaService.getActiveCriteriaTree(),
            studentScoreService.getMyScores({ semesterId: filter.semesterId }),
            eventService.getAllEvents('APPROVED'),
            eventRegistrationService.getMyEvents(),
            recommendationService
              .getHybridRecommendations({ topK: 10 })
              .catch((e: any) => {
                console.warn(
                  'Recommendation API failed, using fallback empty array:',
                  e,
                );
                return { data: [] };
              }),
          ]);

        const myRegistrations = myEventsRes.data?.registrations || [];
        const registrationMap = new Map();
        myRegistrations.forEach((reg: any) => {
          registrationMap.set(reg.eventId, reg.status);
        });

        let rootCriterias: ICriteriaItem[] = [];
        if (criteriasRes.data?.criterias) {
          rootCriterias = criteriasRes.data.criterias
            .filter((c: any) => !c.parentId)
            .sort((a: any, b: any) => a.displayOrder - b.displayOrder);
        }

        const criteriaTree: CriteriaTreeNode[] = treeRes.data?.tree || [];

        const totalsByCriteriaId: Record<string, number> =
          scoresRes.data?.totalsByCriteriaId || {};

        let allApprovedEvents: IEvent[] = [];
        if (eventsRes.data?.events) {
          allApprovedEvents = eventsRes.data.events.map((e: any) => ({
            ...e,
            userRegistrationStatus: registrationMap.get(e.eventId),
          }));
        }

        const now = new Date();
        const validUpcomingEvents = allApprovedEvents.filter((e: any) => {
          if (!e.startDate) return false;
          if (e.registrationDeadline) {
            if (new Date(e.registrationDeadline) < now) return false;
          } else {
            if (new Date(e.startDate) < now) return false;
          }
          return true;
        });

        let validRecommendations: IEvent[] = [];
        if (recommendRes.data) {
          const recData: any = recommendRes.data;
          const rawRec =
            recData?.data?.recommendations || recData?.recommendations || [];
          const recList = Array.isArray(rawRec) ? rawRec : [];
          validRecommendations = recList.map((e: any) => ({
            ...e,
            userRegistrationStatus: registrationMap.get(e.eventId),
          }));
        }

        set({
          criterias: rootCriterias,
          criteriaTree,
          myScores: totalsByCriteriaId,
          allEvents: allApprovedEvents,
          upcomingEvents: validUpcomingEvents,
          hybridRecommendations: validRecommendations,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Lỗi khi tải dữ liệu Dashboard:', error);
        const errorMessage =
          error?.response?.data?.message || 'Không thể tải dữ liệu Dashboard';
        set({ error: errorMessage, isLoading: false });
        toast.error(errorMessage);
      }
    },

    refreshRegistrationStatuses: async () => {
      try {
        const myEventsRes = await eventRegistrationService.getMyEvents();
        const myRegistrations = myEventsRes.data?.registrations || [];
        const registrationMap = new Map<string, string>();
        myRegistrations.forEach((reg: any) => {
          registrationMap.set(reg.eventId, reg.status);
        });

        const { allEvents, upcomingEvents, hybridRecommendations } =
          useDashboardStore.getState();

        const patchedAllEvents = allEvents.map((e) => ({
          ...e,
          userRegistrationStatus: registrationMap.get(e.eventId) ?? undefined,
        }));

        const patchedUpcoming = upcomingEvents.map((e) => ({
          ...e,
          userRegistrationStatus: registrationMap.get(e.eventId) ?? undefined,
        }));

        const patchedRecommendations = hybridRecommendations.map((e) => ({
          ...e,
          userRegistrationStatus: registrationMap.get(e.eventId) ?? undefined,
        }));

        set({
          allEvents: patchedAllEvents,
          upcomingEvents: patchedUpcoming,
          hybridRecommendations: patchedRecommendations,
        });
      } catch (error) {
        console.error(
          '[dashboardStore] refreshRegistrationStatuses error:',
          error,
        );
      }
    },

    reset: () => set(initialState),
  }),
);

export type { CriteriaTreeNode };
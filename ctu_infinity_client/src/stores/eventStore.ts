import { create } from 'zustand';
import { IEvent, EventStatus } from '@/types/event.type';
import { eventService } from '@/services/event.service';
import { eventRegistrationService } from '@/services/event-registration.service';
import { toast } from 'sonner';

interface IEventState {
  events: IEvent[];
  isLoading: boolean;
  isRegistering: boolean;
  isCancelling: boolean;
  error: string | null;
  selectedEvent: IEvent | null;
}

interface IEventActions {
  fetchEvents: (status?: EventStatus) => Promise<void>;
  fetchEventById: (eventId: string) => Promise<void>;
  registerEvent: (eventId: string) => Promise<boolean>;
  cancelRegistration: (eventId: string) => Promise<boolean>;
  /** Cập nhật ngay lập tức userRegistrationStatus của selectedEvent (optimistic update) */
  setSelectedEventStatus: (status: string | null) => void;
  setSelectedEvent: (event: IEvent | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: IEventState = {
  events: [],
  isLoading: false,
  isRegistering: false,
  isCancelling: false,
  error: null,
  selectedEvent: null,
};

export const useEventStore = create<IEventState & IEventActions>((set) => ({
  ...initialState,

  fetchEvents: async (status?: EventStatus) => {
    set({ isLoading: true, error: null });
    try {
      const res = await eventService.getAllEvents(status);

      if (res && res.data && res.data.events) {
        set({
          events: res.data.events,
          isLoading: false,
        });
      } else {
        set({
          events: [],
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError?.response?.data?.message ||
        'Không thể tải danh sách sự kiện';
      set({
        error: errorMessage,
        isLoading: false,
        events: [],
      });
      toast.error(errorMessage);
    }
  },

  fetchEventById: async (eventId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await eventService.getEventById(eventId);

      if (res && res.data) {
        set({
          selectedEvent: res.data,
          isLoading: false,
        });
      } else {
        set({
          selectedEvent: null,
          isLoading: false,
        });
      }
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError?.response?.data?.message ||
        'Không thể tải thông tin sự kiện';
      set({
        error: errorMessage,
        isLoading: false,
        selectedEvent: null,
      });
      toast.error(errorMessage);
    }
  },

  registerEvent: async (eventId: string): Promise<boolean> => {
    set({ isRegistering: true, error: null });
    try {
      const response = await eventService.registerEvent(eventId);
      if (response && (response.EC === 1 || response.statusCode === '200')) {
        toast.success(
          response.message || 'Đăng ký tham gia sự kiện thành công!',
        );
        return true;
      } else {
        toast.error(response?.message || 'Đăng ký thất bại!');
        set({ error: response?.message || 'Đăng ký thất bại!' });
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Đã xảy ra lỗi khi đăng ký sự kiện!';
      toast.error(errorMessage);
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isRegistering: false });
    }
  },

  cancelRegistration: async (eventId: string): Promise<boolean> => {
    set({ isCancelling: true, error: null });
    try {
      const response = await eventRegistrationService.cancelMyRegistration(eventId);
      if (response && (response.EC === 1 || response.statusCode === '200')) {
        toast.success(response.message || 'Hủy đăng ký thành công!');
        return true;
      } else {
        toast.error(response?.message || 'Hủy đăng ký thất bại!');
        set({ error: response?.message || 'Hủy đăng ký thất bại!' });
        return false;
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.EM ||
        error?.response?.data?.message ||
        error?.message ||
        'Đã xảy ra lỗi khi hủy đăng ký!';
      toast.error(errorMessage);
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isCancelling: false });
    }
  },

  setSelectedEventStatus: (status: string | null) => {
    set((s) =>
      s.selectedEvent
        ? { selectedEvent: { ...s.selectedEvent, userRegistrationStatus: status ?? undefined } }
        : {}
    );
  },

  setSelectedEvent: (event: IEvent | null) => {
    set({ selectedEvent: event });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

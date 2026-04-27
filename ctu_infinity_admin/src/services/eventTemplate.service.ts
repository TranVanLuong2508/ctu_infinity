import privateAxios from '@/lib/axios/privateAxios';
import { IBackendRes } from '@/types/backend.type';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventTemplate {
  id: string;
  name: string;
  type?: string;
  content: string;
  variables: string[];
  organizerId?: string;
  createdAt: string;
}

export interface ApplyTemplatePayload {
  templateId: string;
  eventName?: string;
  organizer?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  aiPrompt?: string;
}

export interface CreateEventPayload {
  eventName: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  organizerId?: string;
  categoryIds?: string[];
  posterUrl?: string;
  requiresApproval?: boolean;
  semesterId?: string;
}

// ─── Template API ─────────────────────────────────────────────────────────────

export const templateApi = {
  list: (
    organizerId?: string,
  ): Promise<IBackendRes<{ templates: EventTemplate[] }>> =>
    privateAxios.get('/event-templates', {
      params: organizerId ? { organizerId } : {},
    }),

  create: (data: {
    name: string;
    content: string;
    type?: string;
    organizerId?: string;
  }): Promise<IBackendRes<{ template: EventTemplate }>> =>
    privateAxios.post('/event-templates', data),

  importFile: (
    file: File,
    name: string,
    type?: string,
    organizerId?: string,
  ): Promise<IBackendRes<{ template: EventTemplate }>> => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    if (type) form.append('type', type);
    if (organizerId) form.append('organizerId', organizerId);
    return privateAxios.post('/event-templates/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (
    id: string,
    data: Partial<{ name: string; content: string; type: string }>,
  ): Promise<IBackendRes<{ updated: { id: string } }>> =>
    privateAxios.patch(`/event-templates/${id}`, data),

  remove: (id: string): Promise<IBackendRes<{ deleted: { id: string } }>> =>
    privateAxios.delete(`/event-templates/${id}`),

  apply: (
    data: ApplyTemplatePayload,
  ): Promise<IBackendRes<{ description: string; usedAI: boolean }>> =>
    privateAxios.post('/event-templates/apply', data),
};

// ─── Event API ────────────────────────────────────────────────────────────────

export const eventApi = {
  create: (data: CreateEventPayload): Promise<IBackendRes<{ id: string }>> =>
    privateAxios.post('/events', data),
};

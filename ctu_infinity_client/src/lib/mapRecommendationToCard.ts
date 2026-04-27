import { IRecommendationItem } from '@/services/recommendation.service';

export interface CriteriaData {
  id: string;
  name: string;
  [key: string]: any;
}

interface CriteriaTreeNode {
  criteriaId: string;
  criteriaCode?: string;
  criteriaName: string;
  children?: CriteriaTreeNode[];
  [key: string]: any;
}

function findCriteriaMeta(
  nodes: CriteriaTreeNode[],
  targetId: string,
): { code?: string; name?: string } {
  for (const node of nodes) {
    if (node.criteriaId === targetId) {
      return { code: node.criteriaCode, name: node.criteriaName };
    }
    const found = findCriteriaMeta(node.children || [], targetId);
    if (found.name) return found;
  }
  return {};
}

export function mapRecommendationToCard(
  rec: IRecommendationItem,
  criteriaData: CriteriaData[],
  criteriaTree: CriteriaTreeNode[] = [],
) {
  const meta = findCriteriaMeta(criteriaTree, rec.criteriaId || '');
  const criteria = criteriaData.find((c) => c.id === rec.criteriaId) || null;
  const criteriaCode = meta.code;
  const criteriaName = criteriaCode
    ? `${criteriaCode} ${meta.name || ''}`
    : meta.name || criteria?.name || 'Chưa phân loại';
  const startDate = new Date(rec.startDate);
  const endDate = new Date(rec.endDate);
  
  const startTime = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return {
    id: rec.eventId,
    title: rec.eventName,
    date: startDate.toISOString().split('T')[0],
    time: `${startTime} - ${endTime}`,
    fullObj: rec,
    location: rec.location || 'Chưa cập nhật',
    criteriaId: rec.criteriaId || '',
    criteriaName: criteriaName || criteria?.name || 'Chưa phân loại',
    points: rec.eventScore ?? rec.score ?? 0,
    
    // Fix: Provide strictly null if missing rather than fallback to 0/100
    participants: rec.currentParticipants ?? null,
    maxParticipants: rec.maxParticipants ?? null,
    
    status: 'upcoming' as const,
    userRegistrationStatus: 'NONE', // Mặc định recommendation không kèm theo userRegistrationStatus trong FastApi item
    registrationDeadline: rec.registrationDeadline,
    description: rec.description || '',
    organizer: rec.organizer?.organizerName || 'Ban tổ chức',
    
    isHighlyRecommend: rec.explanation?.reasonType === 'DEFICIT' || true, // Flag từ backend
    criteriaObj: criteria,

    // Giải thích lý do gợi ý từ recommendation system
    explanation: rec.explanation ?? null,
  };
}

import { useMemo } from 'react';
import { useDashboardStore, CriteriaTreeNode } from '@/stores/dashboardStore';
import { IRecommendationItem } from '@/services/recommendation.service';
import { BookOpen, Trophy, Heart, Users, Briefcase } from 'lucide-react';
import { calculateDrlRanking } from '@/lib/drl-ranking';
import { mapRecommendationToCard } from '@/lib/mapRecommendationToCard';
import { REGISTRATION_STATUS } from '@/services/event-registration.service';

const ICONS = [BookOpen, Trophy, Heart, Users, Briefcase];
const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-yellow-500',
];

// ── Logic tổng điểm y hệt useDrlAnalysisData ──────────────────────────────────

interface ProcessedCriterion {
  criteriaId: string;
  criteriaCode?: string;
  criteriaName: string;
  maxPoints: number;
  approvedPoints: number;
  children: ProcessedCriterion[];
}

/** Đệ quy tính điểm cho một node — giống hệt useDrlAnalysisData */
function processNode(
  node: CriteriaTreeNode,
  totals: Record<string, number>,
): ProcessedCriterion {
  const isLeaf = !node.children || node.children.length === 0;

  let maxP = node.maxScore !== null ? Number(node.maxScore) : 0;

  const childrenRows: ProcessedCriterion[] = isLeaf
    ? []
    : node.children
        .map((c) => processNode(c, totals))
        .sort((a, b) => a.maxPoints - b.maxPoints);

  if (!isLeaf && (maxP === 0 || isNaN(maxP))) {
    maxP = childrenRows.reduce((acc, curr) => acc + curr.maxPoints, 0);
  }

  let approvedP = 0;
  if (isLeaf) {
    approvedP = totals[node.criteriaId] || 0;
  } else {
    approvedP = childrenRows.reduce(
      (acc, curr) => acc + Math.min(curr.approvedPoints, curr.maxPoints || 100),
      0,
    );
  }

  if (maxP > 0) {
    approvedP = Math.min(approvedP, maxP);
  }

  return {
    criteriaId: node.criteriaId,
    criteriaCode: node.criteriaCode,
    criteriaName: node.criteriaName,
    maxPoints: maxP || 100,
    approvedPoints: approvedP,
    children: childrenRows,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export const useDashboardStats = () => {
  const {
    criterias,
    criteriaTree,
    myScores,
    allEvents,
    hybridRecommendations,
  } = useDashboardStore();

  // Tính điểm từ cây — giống useDrlAnalysisData
  const criteriaData = useMemo(() => {
    if (!criteriaTree.length) {
      // Fallback: dùng myScores trực tiếp
      return criterias.map((c, index) => {
        const maxPoints = c.maxScore || 100;
        const currentPoints = Math.min(myScores[c.criteriaId] || 0, maxPoints);
        return {
          id: c.criteriaId,
          code: c.criteriaCode,
          name: c.criteriaName,
          icon: ICONS[index % ICONS.length],
          maxPoints,
          currentPoints,
          lacking: maxPoints - currentPoints,
          percentComplete:
            maxPoints > 0 ? (currentPoints / maxPoints) * 100 : 0,
          description: c.description || '',
          color: COLORS[index % COLORS.length],
        };
      });
    }

    const totals: Record<string, number> = { ...myScores };
    const processed = criteriaTree
      .map((node) => processNode(node, totals))
      .sort((a, b) => a.maxPoints - b.maxPoints);

    return processed.map((c, index) => ({
      id: c.criteriaId,
      code: c.criteriaCode,
      name: c.criteriaName,
      icon: ICONS[index % ICONS.length],
      maxPoints: c.maxPoints,
      currentPoints: c.approvedPoints,
      lacking: c.maxPoints - c.approvedPoints,
      percentComplete:
        c.maxPoints > 0 ? (c.approvedPoints / c.maxPoints) * 100 : 0,
      description:
        criterias.find((cr) => cr.criteriaId === c.criteriaId)?.description ||
        '',
      color: COLORS[index % COLORS.length],
    }));
  }, [criterias, criteriaTree, myScores]);

  // Tổng điểm — giống useDrlAnalysisData: grandApproved = sum root approved, capped at 100
  const totalPoints = useMemo(() => {
    const sum = criteriaData.reduce((acc, c) => acc + c.currentPoints, 0);
    return Math.min(sum, 100);
  }, [criteriaData]);

  const maxTotalPoints = 100;
  const percentage = (totalPoints / maxTotalPoints) * 100;

  const currentRanking = useMemo(() => {
    return calculateDrlRanking(totalPoints);
  }, [totalPoints]);

  const lackingCriterias = useMemo(() => {
    return [...criteriaData]
      .sort((a, b) => b.lacking - a.lacking)
      .filter((c) => c.lacking > 0);
  }, [criteriaData]);

  const allMappedEvents = useMemo(() => {
    if (!allEvents.length) return [];

    const topLackingIds = lackingCriterias.slice(0, 3).map((c) => c.id);

    const findCriteriaMeta = (
      nodes: CriteriaTreeNode[],
      targetId: string,
    ): { code?: string; name?: string } => {
      for (const node of nodes) {
        if (node.criteriaId === targetId) {
          return { code: node.criteriaCode, name: node.criteriaName };
        }
        const found = findCriteriaMeta(node.children || [], targetId);
        if (found.name) return found;
      }
      return {};
    };

    return allEvents
      .map((event) => {
        const meta = findCriteriaMeta(criteriaTree, event.criteriaId || '');
        const criteria = criteriaData.find((c) => c.id === event.criteriaId);
        const criteriaCode = meta.code;
        const criteriaName = criteriaCode
          ? `${criteriaCode} ${meta.name || ''}`
          : meta.name || criteria?.name || 'Chưa phân loại';

        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const startTime = startDate.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const endTime = endDate.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          id: event.eventId,
          title: event.eventName,
          date: event.startDate.split('T')[0],
          time: `${startTime} - ${endTime}`,
          fullObj: event,
          location: event.location || 'Chưa cập nhật',
          criteriaId: event.criteriaId || '',
          criteriaName: criteriaName || criteria?.name || 'Chưa phân loại',
          points: event.score || 0,
          participants: event.currentParticipants ?? null,
          maxParticipants: event.maxParticipants ?? null,
          status: 'upcoming' as const,
          userRegistrationStatus: event.userRegistrationStatus,
          registrationDeadline: event.registrationDeadline,
          description: event.description || '',
          organizer: event.organizer?.organizerName || 'Ban tổ chức',
          isHighlyRecommend: topLackingIds.includes(event.criteriaId || ''),
          criteriaObj: criteria,
        };
      })
      .filter((e) => e.criteriaId);
  }, [allEvents, lackingCriterias, criteriaData, criteriaTree]);

  // Nhóm sự kiện theo tiêu chí gốc (root criteria) - hiển thị sự kiện thuộc tiêu chí lá con/cháu của root, tối đa 10 sự kiện
  const eventsByCriteria = useMemo(() => {
    type MappedEvent = (typeof allMappedEvents)[number];
    const map: Record<string, MappedEvent[]> = {};

    const now = new Date();

    // Thu thập tất cả tiêu chí lá (leaf) thuộc một root criteria
    const collectLeafIds = (
      nodes: CriteriaTreeNode[],
      rootId: string,
    ): string[] => {
      const leafIds: string[] = [];
      const traverse = (nodeList: CriteriaTreeNode[]) => {
        for (const node of nodeList) {
          // Nếu node hiện tại là root hoặc là con/cháu đã tìm thấy root
          if (node.criteriaId === rootId) {
            // Thu thập tất cả tiêu chí lá bên dưới root này
            const collectLeaves = (n: CriteriaTreeNode) => {
              if (!n.children || n.children.length === 0) {
                leafIds.push(n.criteriaId);
              } else {
                n.children.forEach(collectLeaves);
              }
            };
            node.children?.forEach(collectLeaves);
            return; // Đã tìm thấy root, không cần tìm tiếp
          }
          // Tiếp tục tìm trong children
          if (node.children?.length) {
            traverse(node.children);
          }
        }
      };
      traverse(nodes);
      return leafIds;
    };

    // Lọc sự kiện: chưa đăng ký, còn hạn đăng ký, chưa diễn ra
    const availableEvents = allMappedEvents.filter((event) => {
      // Loại trừ đã đăng ký, đã tham gia, đã hủy
      if (
        event.userRegistrationStatus === REGISTRATION_STATUS.REGISTERED ||
        event.userRegistrationStatus === REGISTRATION_STATUS.ATTENDED ||
        event.userRegistrationStatus === REGISTRATION_STATUS.CANCELLED
      ) {
        return false;
      }

      // Kiểm tra hạn đăng ký
      if (event.registrationDeadline) {
        const deadline = new Date(event.registrationDeadline);
        if (deadline < now) return false;
      } else {
        // Không có hạn đăng ký -> kiểm tra ngày bắt đầu
        const startDate = new Date(event.date);
        if (startDate < now) return false;
      }

      return true;
    });

    // Gom nhóm theo root criteria: rootId -> events từ leaf criteria con của root
    for (const event of availableEvents) {
      if (!event.criteriaId) continue;

      // Tìm root của tiêu chí hiện tại
      const findRoot = (
        nodes: CriteriaTreeNode[],
        targetId: string,
      ): CriteriaTreeNode | null => {
        for (const node of nodes) {
          if (node.criteriaId === targetId) {
            if (node.parentId) {
              const parent = findRoot(criteriaTree, node.parentId);
              return parent || node;
            }
            return node;
          }
          const found = findRoot(node.children || [], targetId);
          if (found) return found;
        }
        return null;
      };

      const root = findRoot(criteriaTree, event.criteriaId);
      const rootId = root ? root.criteriaId : event.criteriaId;

      if (!map[rootId]) {
        // Thu thập leaf criteria ids cho root này
        const leafIds = collectLeafIds(criteriaTree, rootId);
        // Lọc availableEvents theo leaf criteria ids, tối đa 10 sự kiện
        const eventsForRoot = availableEvents
          .filter((e) => e.criteriaId && leafIds.includes(e.criteriaId))
          .slice(0, 10);
        map[rootId] = eventsForRoot;
      }
    }

    return map;
  }, [allMappedEvents, criteriaTree]);

  const recommendedEvents = useMemo(() => {
    if (!hybridRecommendations || !hybridRecommendations.length) return [];

    return hybridRecommendations.map((event) =>
      mapRecommendationToCard(event as IRecommendationItem, criteriaData, criteriaTree),
    );
  }, [hybridRecommendations, criteriaData, criteriaTree]);

  return {
    criteriaData,
    totalPoints,
    maxTotalPoints,
    percentage,
    currentRanking,
    lackingCriterias,
    recommendedEvents,
    allMappedEvents,
    eventsByCriteria,
  };
};

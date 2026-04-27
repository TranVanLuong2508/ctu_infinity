import { useState, useEffect, useCallback } from 'react';
import { criteriaService } from '@/services/criteria.service';
import { studentScoreService } from '@/services/student-score.service';
import { eventRegistrationService, REGISTRATION_STATUS } from '@/services/event-registration.service';
import { recommendationService } from '@/services/recommendation.service';
import { calculateDrlRanking, IRankingResult } from '@/lib/drl-ranking';
import { mapRecommendationToCard } from '@/lib/mapRecommendationToCard';
import { semesterService } from '@/services/semester.service';

export interface IDrlCriterionRow {
  id: string;
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  parentId?: string | null;
  level: number;
  displayOrder: number;
  maxPoints: number;
  approvedPoints: number;
  pendingPoints: number;
  totalProjectedPoints: number;
  isLeaf: boolean;
  children: IDrlCriterionRow[];
}

export interface IDrlCategoryProgress {
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  currentPoints: number;
  maxPoints: number;
  percentage: number;
}

export interface IDrlLackingCriteria {
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  missingPoints: number;
  parentRootCode?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface IDrlPersonalization {
  categoryProgress: IDrlCategoryProgress[];
  lackingLeafCriterias: IDrlLackingCriteria[];
  recommendations: any[]; // Using any[] here to integrate easily with backend format, later map to SuggestionCard format
}

export const useDrlAnalysisData = (semester?: string, academicYear?: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSemesterName, setCurrentSemesterName] = useState<string>('');

  const [criteriaRows, setCriteriaRows] = useState<IDrlCriterionRow[]>([]);
  const [personalization, setPersonalization] = useState<IDrlPersonalization>({
    categoryProgress: [],
    lackingLeafCriterias: [],
    recommendations: []
  });
  
  const [summary, setSummary] = useState({
    totalApproved: 0,
    totalPending: 0,
    ranking: {} as IRankingResult
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 0. Lấy semesterId hiện tại
      let currentSemesterId: string | undefined;
      let fetchedSemesterName = '';
      try {
        const semRes = await semesterService.getCurrent();
        const currentSem = semRes.data;
        if (currentSem) {
          currentSemesterId = currentSem.semesterId;
          fetchedSemesterName = currentSem.semesterName || '';
        }
      } catch {
        // fallback: không có semester vẫn tiếp tục
      }
      setCurrentSemesterName(fetchedSemesterName);

      // 1. Fetch data in parallel
      const [treeRes, scoresRes, registrationsRes, recommendRes] = await Promise.all([
        criteriaService.getActiveCriteriaTree(),
        studentScoreService.getMyScores({ semesterId: currentSemesterId }),
        eventRegistrationService.getMyEvents(),
        recommendationService.getHybridRecommendations({ topK: 10 }).catch(() => ({ data: { recommendations: [] } }))
      ]);

      // 2. Extract inner payloads from Interceptor envelope wrapper
      const rawTree = treeRes.data?.tree || [];
      const approvedTotals = scoresRes.data?.totalsByCriteriaId || {};
      const approvedScores = scoresRes.data?.scores || [];
      const registrations = registrationsRes.data?.registrations || [];
      
      const recData: any = recommendRes.data;
      const rawRecs = recData?.recommendations || [];
      const recommendationsList = Array.isArray(rawRecs) ? rawRecs : [];

      // 3. Build sets for pending logic
      const approvedEventIds = new Set(approvedScores.map((s: any) => s.eventId));
      const pendingScoreMap: Record<string, number> = {};
      
      registrations.forEach((reg: any) => {
        // Chỉ tính pending cho những event đã ATTENDED nhưng chưa có trong approved scores
        if (reg.status === REGISTRATION_STATUS.ATTENDED && reg.event && !approvedEventIds.has(reg.eventId)) {
          const cId = reg.event.criteriaId;
          const score = reg.event.score || 0;
          if (cId) {
            pendingScoreMap[cId] = (pendingScoreMap[cId] || 0) + score;
          }
        }
      });

      // 4. Recursive Transform function
      const categoryProgressList: IDrlCategoryProgress[] = [];
      const lackingLeafList: IDrlLackingCriteria[] = [];

      const transformNode = (node: any, level: number = 0, parentRootCode?: string): IDrlCriterionRow => {
        const isLeaf = !node.children || node.children.length === 0;
        const currentRootCode = level === 0 ? node.criteriaCode : parentRootCode;
        
        // Traverse children first
        let childrenRows: IDrlCriterionRow[] = [];
        if (node.children) {
          childrenRows = node.children
            .map((c: any) => transformNode(c, level + 1, currentRootCode))
            .sort((a: any, b: any) => a.displayOrder - b.displayOrder);
        }

        // Evaluate maxPoints
        // Criterias might have maxScore directly (if leaf) or we sum from children
        let maxP = node.maxScore !== null ? Number(node.maxScore) : 0;
        
        // Some CTU requirements dictate that if a parent has no explicit maxScore, it is the sum of children
        // Or if it DOES have a maxScore, we just use it to cap. We'll simply use node.maxScore if present, else children sum.
        if (!isLeaf && (maxP === 0 || isNaN(maxP))) {
          maxP = childrenRows.reduce((acc, curr) => acc + curr.maxPoints, 0);
        }

        // Evaluate scores
        let approvedP = 0;
        let pendingP = 0;

        if (isLeaf) {
          approvedP = approvedTotals[node.criteriaId] || 0;
          pendingP = pendingScoreMap[node.criteriaId] || 0;

          // Check if lacking
          if (maxP > 0 && maxP > approvedP) {
            const missing = maxP - approvedP;
            let priority: 'high' | 'medium' | 'low' = 'low';
            if (missing >= 5) priority = 'high';
            else if (missing >= 2) priority = 'medium';

            lackingLeafList.push({
              criteriaId: node.criteriaId,
              criteriaCode: node.criteriaCode || '-',
              criteriaName: node.criteriaName,
              missingPoints: missing,
              parentRootCode: currentRootCode,
              priority
            });
          }
        } else {
          // Parent node gets sum of children
          approvedP = childrenRows.reduce((acc, curr) => acc + Math.min(curr.approvedPoints, curr.maxPoints || 100), 0);
          pendingP = childrenRows.reduce((acc, curr) => acc + curr.pendingPoints, 0);
        }

        // Cap at maxP if maxP exists
        if (maxP > 0) {
          approvedP = Math.min(approvedP, maxP);
        }

        const totalProjected = Math.min(approvedP + pendingP, maxP > 0 ? maxP : 999);

        // Populate Category Progress for Level 0 nodes
        if (level === 0) {
          categoryProgressList.push({
            criteriaId: node.criteriaId,
            criteriaCode: node.criteriaCode,
            criteriaName: node.criteriaName,
            currentPoints: approvedP,
            maxPoints: maxP || 100, // fallback
            percentage: maxP > 0 ? (approvedP / maxP) * 100 : 0
          });
        }

        return {
          id: node.criteriaId,
          criteriaId: node.criteriaId,
          criteriaCode: node.criteriaCode,
          criteriaName: node.criteriaName,
          parentId: node.parentId,
          level,
          displayOrder: node.displayOrder,
          maxPoints: maxP,
          approvedPoints: approvedP,
          pendingPoints: pendingP,
          totalProjectedPoints: totalProjected,
          isLeaf,
          children: childrenRows
        };
      };

      // Transform tree
      const processedTree = rawTree
        .map((node: any) => transformNode(node))
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder);

      // Sort lacking limits
      lackingLeafList.sort((a, b) => b.missingPoints - a.missingPoints);

      // 5. Calculate final summary
      const grandApproved = processedTree.reduce((acc: number, curr: IDrlCriterionRow) => acc + curr.approvedPoints, 0);
      const grandPending = processedTree.reduce((acc: number, curr: IDrlCriterionRow) => acc + curr.pendingPoints, 0);
      
      const cappedTotalApproved = Math.min(grandApproved, 100);

      setCriteriaRows(processedTree);
      
      // We will map recommendations directly to support SuggestionCard format in the view, 
      // but let's pass the mapped array. The flat criteria list helps lookup exact criteria info.
      const flatCriterias: any[] = [];
      const flatten = (nodes: IDrlCriterionRow[]) => {
        nodes.forEach(n => {
          flatCriterias.push({
            id: n.criteriaId,
            name: n.criteriaName
          });
          if (n.children) flatten(n.children);
        });
      };
      flatten(processedTree);

      const mappedRecs = recommendationsList.map((rec: any) => mapRecommendationToCard(rec, flatCriterias));

      setPersonalization({
        categoryProgress: categoryProgressList,
        lackingLeafCriterias: lackingLeafList.slice(0, 4), // Take top 4 lacked items
        recommendations: mappedRecs
      });

      setSummary({
        totalApproved: cappedTotalApproved,
        totalPending: grandPending,
        ranking: calculateDrlRanking(cappedTotalApproved)
      });

    } catch (err: any) {
      console.error("Error loading DRL analysis data:", err);
      setError(err.message || "Không thể tải dữ liệu phân tích");
    } finally {
      setIsLoading(false);
    }
  }, [semester, academicYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isLoading,
    error,
    criteriaRows,
    personalization,
    summary,
    currentSemesterName,
    refresh: fetchData
  };
};

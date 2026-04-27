import { FrameworkStatus } from 'src/common/enums/framework-status.enum';

export class CriteriaFrameworkResponseDto {
    frameworkId: string;
    frameworkName: string;
    version: string;
    startDate: Date;
    endDate: Date | null;
    status: FrameworkStatus;
    isActive: boolean;
    description: string | null;
    createdBy: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    criteriaCount?: number;
}

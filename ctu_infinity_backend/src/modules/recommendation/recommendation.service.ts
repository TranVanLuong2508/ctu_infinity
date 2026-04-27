import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { In, Repository } from 'typeorm';
import { Event, EVENT_STATUS } from '../events/entities/event.entity';
import {
  EventRegistration,
  REGISTRATION_STATUS,
} from '../event-registration/entities/event-registration.entity';
import { StudentScore } from '../student-score/entities/student-score.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Student } from '../students/entities/student.entity';
import { Criteria } from '../criterias/entities/criteria.entity';
import { Semester } from '../semesters/entities/semester.entity';
import { GetRecommendationQueryDto } from './dto/get-recommendation-query.dto';
import { FrameworkStatus } from 'src/common/enums/framework-status.enum';

type RecommendationAlgorithm = 'content' | 'collab' | 'hybrid';

type RecommendationDataset = {
  studentId: string;
  semesterId: string | null;
  semesterName: string | null;
  candidateEvents: Array<{
    eventId: string;
    eventName: string;
    criteriaId: string;
    categoryIds: string[];
    status: 'APPROVED';
    registrationStatus: 'OPEN' | 'CLOSED';
    registrationDeadline: Date;
    startDate: Date;
    endDate: Date;
    capacity: number;
    registeredCount: number;
    remainingSlots: number;
    score: number;
  }>;
  interactions: Array<{
    studentId: string;
    eventId: string;
    status: REGISTRATION_STATUS;
    updatedAt: Date | null;
    criteriaId: string | null;
    categoryIds: string[];
  }>;
  allStudentsInteractions: Array<{
    studentId: string;
    eventId: string;
    status: REGISTRATION_STATUS;
  }>;
  scores: Array<{
    studentId: string;
    criteriaId: string;
    scoreValue: number;
  }>;
  subscription: {
    studentId: string;
    subscribedCategoryIds: string[];
    subscribedCriteriaIds: string[];
  };
  criterias: Array<{
    criteriaId: string;
    criteriaCode: string;
    criteriaName: string;
    maxScore: number | null;
  }>;
};

type FastApiRecommendationItem = {
  eventId: string;
  score: number;
  explanation?: {
    reasonType: 'DEFICIT' | 'SUBSCRIPTION' | 'HISTORY' | 'COMMUNITY';
    message: string;
  };
  components?: Record<string, number>;
  neighborCount?: number | null;
  _debug?: Record<string, unknown> | null;
};

const UNLIMITED_CAPACITY = 2147483647;
const ACTIVE_SLOT_STATUSES = new Set<REGISTRATION_STATUS>([
  REGISTRATION_STATUS.REGISTERED,
  REGISTRATION_STATUS.ATTENDED,
]);
const EXCLUDED_CANDIDATE_STATUSES = new Set<REGISTRATION_STATUS>([
  REGISTRATION_STATUS.ATTENDED,
  REGISTRATION_STATUS.REGISTERED,
  REGISTRATION_STATUS.CANCELLED,
]);

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventRegistration)
    private readonly eventRegistrationRepository: Repository<EventRegistration>,
    @InjectRepository(StudentScore)
    private readonly studentScoreRepository: Repository<StudentScore>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Criteria)
    private readonly criteriaRepository: Repository<Criteria>,
    @InjectRepository(Semester)
    private readonly semesterRepository: Repository<Semester>,
  ) {}

  private get recommenderServiceUrl(): string {
    return process.env.RECOMMENDER_SERVICE_URL || 'http://localhost:8000';
  }

  async getRecommendationsForStudent(
    userId: string,
    algorithm: RecommendationAlgorithm,
    query: GetRecommendationQueryDto,
  ) {
    try {
      const student = await this.findStudentByUserId(userId);
      const dataset = await this.buildDataset(student.studentId);
      const recommenderResponse = await this.fetchRecommendations(dataset, algorithm, query);
      const recommendations = recommenderResponse?.recommendations || [];

      if (recommendations.length === 0) {
        return {
          EC: 1,
          EM: 'Không có sự kiện gợi ý phù hợp',
          studentId: student.studentId,
          algorithm,
          recommendations: [],
        };
      }

      const enrichedEvents = await this.enrichRecommendations(recommendations);

      return {
        EC: 1,
        EM: 'Lấy gợi ý sự kiện thành công',
        studentId: student.studentId,
        algorithm,
        recommendations: enrichedEvents,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Lỗi khi lấy gợi ý sự kiện',
      });
    }
  }

  private async findStudentByUserId(userId: string) {
    const student = await this.studentRepository.findOne({
      where: { userId },
    });

    console.log(
      '[RecommendationService.findStudentByUserId] userId:',
      userId,
      '| student found:',
      !!student,
      '| studentId:',
      student?.studentId,
    );

    if (!student) {
      throw new NotFoundException({
        EC: 0,
        EM: 'Không tìm thấy thông tin sinh viên',
      });
    }

    return student;
  }

  async getDataSet(userId: string): Promise<RecommendationDataset> {
    const student = await this.findStudentByUserId(userId);
    const studentId = student.studentId;

    const currentSemester = await this.getCurrentSemester();
    const semesterId = currentSemester?.semesterId;
    console.log('current semester: ', semesterId);

    const [studentInteractions, allInteractions, scores, subscription, criterias, candidateEvents] =
      await Promise.all([
        this.getStudentInteractions(studentId),
        this.getAllStudentsInteractions(),
        this.getStudentScores(studentId, semesterId),
        this.getStudentSubscription(studentId),
        this.getCriterias(),
        this.getCandidateEvents(studentId),
      ]);

    return {
      studentId,
      semesterId: currentSemester?.semesterId ?? null,
      semesterName: currentSemester?.semesterName ?? null,
      candidateEvents,
      interactions: studentInteractions,
      allStudentsInteractions: allInteractions,
      scores,
      subscription,
      criterias,
    };
  }

  private async getCurrentSemester(): Promise<{ semesterId: string; semesterName: string } | null> {
    const semesterRepo = this.semesterRepository;
    const semester = await semesterRepo.findOne({ where: { isCurrent: true } as any });
    if (!semester) return null;
    return {
      semesterId: semester.semesterId as string,
      semesterName: String(semester.semesterName),
    };
  }

  private async buildDataset(studentId: string): Promise<RecommendationDataset> {
    const currentSemester = await this.getCurrentSemester();
    const semesterId = currentSemester?.semesterId;

    const [studentInteractions, allInteractions, scores, subscription, criterias, candidateEvents] =
      await Promise.all([
        this.getStudentInteractions(studentId),
        this.getAllStudentsInteractions(),
        this.getStudentScores(studentId, semesterId),
        this.getStudentSubscription(studentId),
        this.getCriterias(),
        this.getCandidateEvents(studentId),
      ]);

    return {
      studentId,
      semesterId: currentSemester?.semesterId ?? null,
      semesterName: currentSemester?.semesterName ?? null,
      candidateEvents,
      interactions: studentInteractions,
      allStudentsInteractions: allInteractions,
      scores,
      subscription,
      criterias,
    };
  }

  private async getCandidateEvents(
    studentId: string,
  ): Promise<RecommendationDataset['candidateEvents']> {
    const now = new Date();
    const studentRegistrations = await this.eventRegistrationRepository.find({
      where: { studentId },
    });

    const excludedEventIds = new Set(
      studentRegistrations
        .filter((registration) => EXCLUDED_CANDIDATE_STATUSES.has(registration.status))
        .map((registration) => registration.eventId),
    );

    const approvedEvents = await this.eventRepository.find({
      where: { status: EVENT_STATUS.APPROVED },
      relations: ['categories'],
      order: { startDate: 'ASC' },
    });

    const candidateBase = approvedEvents.filter((event) => {
      if (!event.criteriaId || !event.registrationDeadline) {
        return false;
      }
      if (excludedEventIds.has(event.eventId)) {
        return false;
      }
      return new Date(event.registrationDeadline) >= now;
    });

    if (candidateBase.length === 0) {
      return [];
    }

    const candidateEventIds = candidateBase.map((event) => event.eventId);
    const registrations = await this.eventRegistrationRepository.find({
      where: { eventId: In(candidateEventIds) },
    });

    const registrationCountMap = registrations.reduce<Map<string, number>>(
      (countMap, registration) => {
        if (!ACTIVE_SLOT_STATUSES.has(registration.status)) {
          return countMap;
        }
        countMap.set(registration.eventId, (countMap.get(registration.eventId) || 0) + 1);
        return countMap;
      },
      new Map<string, number>(),
    );

    return candidateBase
      .map((event) => {
        // Event.maxParticipants đang nullable. Để giữ contract số học ổn định cho FastAPI,
        // event không giới hạn chỗ được map sang một capacity rất lớn thay vì null.
        const capacity = event.maxParticipants ?? UNLIMITED_CAPACITY;
        const registeredCount = registrationCountMap.get(event.eventId) || 0;
        const remainingSlots = Math.max(capacity - registeredCount, 0);
        const registrationStatus: 'OPEN' | 'CLOSED' =
          new Date(event.registrationDeadline!) >= now && remainingSlots > 0 ? 'OPEN' : 'CLOSED';

        return {
          eventId: event.eventId,
          eventName: event.eventName,
          criteriaId: event.criteriaId!,
          categoryIds: (event.categories || []).map((category) => category.categoryId as string),
          status: 'APPROVED' as const,
          registrationStatus,
          registrationDeadline: event.registrationDeadline!,
          startDate: event.startDate,
          endDate: event.endDate,
          capacity,
          registeredCount,
          remainingSlots,
          score: event.score || 0,
        };
      })
      .filter(
        (event) =>
          event.registrationStatus === 'OPEN' &&
          (event.remainingSlots > 0 || event.registeredCount < event.capacity),
      );
  }

  private async getStudentInteractions(
    studentId: string,
  ): Promise<RecommendationDataset['interactions']> {
    const interactions = await this.eventRegistrationRepository.find({
      where: { studentId },
      relations: ['event', 'event.categories'],
      order: { registeredAt: 'DESC' },
    });

    return interactions.map((interaction) => ({
      studentId: interaction.studentId,
      eventId: interaction.eventId,
      status: interaction.status,
      updatedAt: this.deriveInteractionUpdatedAt(interaction),
      // NOTE: Minimal contract không đủ để tính history/category overlap.
      // Vì vậy interaction của chính sinh viên được đính kèm thêm snapshot của event.
      criteriaId: interaction.event?.criteriaId || null,
      categoryIds: (interaction.event?.categories || []).map(
        (category) => category.categoryId as string,
      ),
    }));
  }

  private async getAllStudentsInteractions(): Promise<
    RecommendationDataset['allStudentsInteractions']
  > {
    const interactions = await this.eventRegistrationRepository.find();

    return interactions.map((interaction) => ({
      studentId: interaction.studentId,
      eventId: interaction.eventId,
      status: interaction.status,
    }));
  }

  private async getStudentScores(
    studentId: string,
    semesterId?: string,
  ): Promise<RecommendationDataset['scores']> {
    const findOptions: any = { where: { studentId } };
    if (semesterId) {
      findOptions.where.semesterId = semesterId;
    }
    const scores = await this.studentScoreRepository.find(findOptions);

    return scores.map((score) => ({
      studentId: score.studentId,
      criteriaId: score.criteriaId,
      scoreValue: score.scoreValue,
    }));
  }

  private async getStudentSubscription(
    studentId: string,
  ): Promise<RecommendationDataset['subscription']> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { studentId },
      relations: ['categories', 'criteria'],
    });

    if (!subscription) {
      return {
        studentId,
        subscribedCategoryIds: [],
        subscribedCriteriaIds: [],
      };
    }

    return {
      studentId,
      subscribedCategoryIds: (subscription.categories || []).map(
        (category) => category.categoryId as string,
      ),
      subscribedCriteriaIds: (subscription.criteria || []).map((criteria) => criteria.criteriaId),
    };
  }

  private async getCriterias(): Promise<RecommendationDataset['criterias']> {
    const criterias = await this.criteriaRepository.find({
      where: {
        //active frame
        framework: {
          isActive: true,
          status: FrameworkStatus.ACTIVE,
        },
      },
      select: {
        criteriaId: true,
        criteriaCode: true,
        criteriaName: true,
        maxScore: true,
      },
      relations: ['framework'], //active frame
      order: { displayOrder: 'ASC' },
    });

    return criterias.map((criteria) => ({
      criteriaId: criteria.criteriaId,
      criteriaCode: criteria.criteriaCode,
      criteriaName: criteria.criteriaName,
      maxScore: criteria.maxScore,
    }));
  }

  private deriveInteractionUpdatedAt(interaction: EventRegistration): Date | null {
    return interaction.attendedAt || interaction.cancelledAt || interaction.registeredAt || null;
  }

  private async fetchRecommendations(
    dataset: RecommendationDataset,
    algorithm: RecommendationAlgorithm,
    query: GetRecommendationQueryDto,
  ) {
    try {
      const response = await axios.post(
        `${this.recommenderServiceUrl}/recommendations/${algorithm}`,
        dataset,
        {
          params: {
            ...(query.topK ? { topK: query.topK } : {}),
            ...(query.debug ? { debug: query.debug } : {}),
          },
          timeout: 30000,
        },
      );

      return response.data;
    } catch (error: any) {
      if (error?.isAxiosError) {
        throw new InternalServerErrorException({
          EC: 0,
          EM: 'Không thể kết nối tới recommendation service',
        });
      }
      throw error;
    }
  }

  private async enrichRecommendations(recommendations: FastApiRecommendationItem[]) {
    const recommendedEventIds = recommendations.map((item) => item.eventId);
    const events = await this.eventRepository.find({
      where: { eventId: In(recommendedEventIds) as any },
      relations: ['categories', 'organizer'],
    });

    // Query registrations for these recommended events to get participant count
    const registrations = await this.eventRegistrationRepository.find({
      where: { eventId: In(recommendedEventIds) as any },
      select: ['eventId', 'status'],
    });

    const registrationCountMap = registrations.reduce<Map<string, number>>(
      (countMap, registration) => {
        if (!ACTIVE_SLOT_STATUSES.has(registration.status)) {
          return countMap;
        }
        countMap.set(registration.eventId, (countMap.get(registration.eventId) || 0) + 1);
        return countMap;
      },
      new Map<string, number>(),
    );

    const eventMap = new Map(events.map((event) => [event.eventId, event]));

    return recommendations
      .map((recommendation) => {
        const event = eventMap.get(recommendation.eventId);
        if (!event) {
          return null;
        }

        return {
          eventId: event.eventId,
          eventName: event.eventName,
          description: event.description,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          registrationDeadline: event.registrationDeadline,
          criteriaId: event.criteriaId,
          score: recommendation.score,
          eventScore: event.score,
          currentParticipants: registrationCountMap.get(event.eventId) ?? 0,
          maxParticipants: event.maxParticipants ?? null,
          explanation: recommendation.explanation || null,
          components: recommendation.components || {},
          neighborCount: recommendation.neighborCount || 0,
          debug: recommendation._debug || null,
          categories: (event.categories || []).map((category) => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            slug: category.slug,
          })),
          organizer: event.organizer
            ? {
                organizerId: event.organizer.organizerId,
                organizerName: event.organizer.organizerName,
              }
            : null,
        };
      })
      .filter(Boolean);
  }
}

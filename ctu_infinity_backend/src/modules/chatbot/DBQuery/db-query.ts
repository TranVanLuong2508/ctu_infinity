/**
 * SQL minh họa cho từng intent của chatbot.
 *
 * Đây là các câu query tương đương với TypeORM service methods bên dưới.
 * Để lấy query THẬT, bật TypeORM logging trong app.module.ts:
 *   TypeOrmModule.forRootAsync({ ... useFactory: cfg => ({ ...cfg.postgresConfig, logging: true }) })
 * Sau đó gọi từng endpoint qua Postman, console sẽ in ra câu SQL thật.
 */
export const CTUDBQuery = {
  /**
   * INTENT: ask_my_info
   * TypeORM: studentRepository.findOne({ where: { studentId }, relations: ['user', 'class'] })
   */
  studentProfile: `
    SELECT
      s."studentId",
      s."studentCode",
      s."enrollmentYear",
      u."fullName",
      u."email",
      u."avatarUrl",
      c."className"
    FROM students s
    JOIN users u ON u."userId" = s."userId"
    LEFT JOIN classes c ON c."classId" = s."classId"
    WHERE s."studentId" = $1
  `,

  /**
   * INTENT: ask_my_scores
   * TypeORM:
   *   studentScoreRepository.find({ where: { studentId }, relations: ['event'] })
   *   criteriaRepository.find()
   *   → gom nhóm theo criteriaId trong JS
   */
  studentScores: `
    SELECT
      cr."criteriaId",
      cr."criteriaCode",
      cr."criteriaName",
      cr."maxScore",
      COALESCE(SUM(ss."scoreValue"), 0)   AS "totalScore",
      COUNT(ss."id")::int                 AS "eventCount"
    FROM criterias cr
    LEFT JOIN student_scores ss
      ON ss."criteriaId" = cr."criteriaId"
      AND ss."studentId" = $1
    GROUP BY cr."criteriaId", cr."criteriaCode", cr."criteriaName", cr."maxScore"
    ORDER BY cr."displayOrder" ASC NULLS LAST
  `,

  /**
   * INTENT: ask_my_events
   * TypeORM:
   *   eventRegistrationRepository.find({
   *     where: { studentId },
   *     relations: ['event', 'event.categories', 'event.organizer', 'event.criteria'],
   *     order: { registeredAt: 'DESC' },
   *     take: 10,
   *   })
   */
  studentRegisteredEvents: `
    SELECT
      er."id"             AS "registrationId",
      er."status"         AS "registrationStatus",
      er."registeredAt",
      er."attendedAt",
      e."eventId",
      e."eventName",
      e."startDate",
      e."endDate",
      e."location",
      e."score",
      o."organizerName",
      cr."criteriaCode",
      cr."criteriaName"
    FROM event_registrations er
    JOIN events e ON e."eventId" = er."eventId"
    LEFT JOIN organizers o ON o."organizerId" = e."organizerId"
    LEFT JOIN criterias cr ON cr."criteriaId" = e."criteriaId"
    WHERE er."studentId" = $1
    ORDER BY er."registeredAt" DESC
    LIMIT 10
  `,

  /**
   * INTENT: ask_system_events
   * TypeORM: eventRepository.createQueryBuilder('e')
   *   .leftJoinAndSelect('e.categories', 'cat')
   *   .leftJoinAndSelect('e.organizer', 'org')
   *   .leftJoinAndSelect('e.criteria', 'cr')
   *   .where('e.status = :status', { status: 'APPROVED' })
   *   .andWhere('(e.eventName ILIKE :kw OR e.description ILIKE :kw)', { kw })
   *   .take(10).getMany()
   */
  systemEvents: `
    SELECT
      e."eventId",
      e."eventName",
      e."description",
      e."location",
      e."startDate",
      e."endDate",
      e."registrationDeadline",
      e."maxParticipants",
      e."score",
      o."organizerName",
      cr."criteriaCode",
      cr."criteriaName"
    FROM events e
    LEFT JOIN organizers o ON o."organizerId" = e."organizerId"
    LEFT JOIN criterias cr ON cr."criteriaId" = e."criteriaId"
    WHERE e."status" = 'APPROVED'
      AND (e."eventName" ILIKE $1 OR e."description" ILIKE $1)
    ORDER BY e."startDate" ASC
    LIMIT 10
  `,

  /**
   * INTENT: ask_suggested_events
   * TypeORM: kết hợp nhiều repository; xem service method getSuggestedEvents()
   *
   * Logic: Lấy các sự kiện APPROVED còn hạn đăng ký, ứng với tiêu chí sinh viên
   * còn thiếu điểm (totalScore < maxScore), mà sinh viên chưa đăng ký.
   */
  suggestedEvents: `
    SELECT
      e."eventId",
      e."eventName",
      e."location",
      e."startDate",
      e."endDate",
      e."registrationDeadline",
      e."score",
      cr."criteriaCode",
      cr."criteriaName",
      cr."maxScore",
      COALESCE(SUM(ss."scoreValue"), 0) AS "currentScore",
      (cr."maxScore" - COALESCE(SUM(ss."scoreValue"), 0)) AS "deficit"
    FROM events e
    JOIN criterias cr ON cr."criteriaId" = e."criteriaId"
    LEFT JOIN student_scores ss
      ON ss."criteriaId" = cr."criteriaId"
      AND ss."studentId" = $1
    WHERE e."status" = 'APPROVED'
      AND e."registrationDeadline" > NOW()
      AND NOT EXISTS (
        SELECT 1 FROM event_registrations er
        WHERE er."eventId" = e."eventId"
          AND er."studentId" = $1
          AND er."status" != 'CANCELLED'
      )
    GROUP BY e."eventId", cr."criteriaId", cr."criteriaCode", cr."criteriaName", cr."maxScore"
    HAVING COALESCE(SUM(ss."scoreValue"), 0) < COALESCE(cr."maxScore", 99999)
    ORDER BY (cr."maxScore" - COALESCE(SUM(ss."scoreValue"), 0)) DESC
    LIMIT 5
  `,
};

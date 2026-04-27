from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RegistrationStatus = Literal["OPEN", "CLOSED"]
InteractionStatus = Literal["REGISTERED", "ATTENDED", "ABSENT", "CANCELLED"]
ReasonType = Literal["DEFICIT", "SUBSCRIPTION", "HISTORY", "COMMUNITY"]

# Thông tin sự kiện ứng viên được đề xuất
class CandidateEvent(BaseModel):
    eventId: str
    eventName: str
    criteriaId: str
    categoryIds: list[str] = Field(default_factory=list)
    status: Literal["APPROVED"]
    registrationStatus: RegistrationStatus
    registrationDeadline: datetime | None = None
    startDate: datetime
    endDate: datetime
    capacity: int
    registeredCount: int
    remainingSlots: int
    score: int

# Một lượt tương tác của sinh viên với sự kiện
class InteractionSchema(BaseModel):
    studentId: str
    eventId: str
    status: InteractionStatus
    updatedAt: datetime | None = None
    criteriaId: str | None = None
    categoryIds: list[str] = Field(default_factory=list)


#Một record điểm rèn luyện
class ScoreSchema(BaseModel):
    studentId: str
    criteriaId: str
    scoreValue: int

#Sở thích đăng ký theo dõi của sinh viên
class SubscriptionSchema(BaseModel):
    studentId: str
    subscribedCategoryIds: list[str] = Field(default_factory=list)
    subscribedCriteriaIds: list[str] = Field(default_factory=list)

#Thông tin tiêu chí đánh giá
class CriteriaSchema(BaseModel):
    criteriaId: str
    criteriaCode: str
    criteriaName: str
    maxScore: int | None = None

#GÓI DỮ LIỆU TRUNG TÂM - được gửi từ NestJS
class DatasetSchema(BaseModel):
    studentId: str
    semesterId: str | None = None
    semesterName: str | None = None
    candidateEvents: list[CandidateEvent] = Field(default_factory=list)
    interactions: list[InteractionSchema] = Field(default_factory=list)
    allStudentsInteractions: list[InteractionSchema] = Field(default_factory=list)
    scores: list[ScoreSchema] = Field(default_factory=list)
    subscription: SubscriptionSchema
    criterias: list[CriteriaSchema] = Field(default_factory=list)

#Giải thích lý do gợi ý
class ExplanationSchema(BaseModel):
    reasonType: ReasonType
    message: str


class RecommendationItemSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    eventId: str
    score: float
    explanation: ExplanationSchema
    components: dict[str, float] = Field(default_factory=dict)
    neighborCount: int | None = None
    debugPayload: dict | None = Field(
        default=None,
        alias="_debug",
        serialization_alias="_debug",
    )

#KẾT QUẢ TRẢ VỀ TỪ API
class RecommendationResponseSchema(BaseModel):
    algorithm: Literal["content", "collab", "hybrid"]
    studentId: str
    topK: int
    recommendations: list[RecommendationItemSchema]

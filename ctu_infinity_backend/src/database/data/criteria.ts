interface CriteriaData {
  criteriaName: string;
  description: string;
  criteriaCode: string;
  maxScore: number | null;
  parentId?: string;
  displayOrder: number;
}

export const CRITERIA_DATA: CriteriaData[] = [
  {
    criteriaName: 'Đánh giá về ý thức tham gia học tập',
    criteriaCode: 'I',
    description: 'Điều 4, Quy chế Đánh giá kết quả rèn luyện',
    maxScore: 20,
    displayOrder: 1,
  },
  {
    criteriaName:
      'Đánh giá về ý thức và kết quả chấp hành nội quy, quy chế, quy định trong nhà trường',
    description: 'Điều 5, Quy chế Đánh giá kết quả rèn luyện',
    criteriaCode: 'II',
    maxScore: 25,
    displayOrder: 2,
  },
  {
    criteriaName:
      'Đánh giá về ý thức tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao, phòng chống tội phạm và các tệ nạn xã hội',
    description: 'Điều 6, Quy chế Đánh giá kết quả rèn luyện',
    criteriaCode: 'III',
    maxScore: 25,
    displayOrder: 3,
  },
  {
    criteriaName: 'Đánh giá về ý thức công dân trong quan hệ cộng đồng',
    description: 'Điều 7, Quy chế Đánh giá kết quả rèn luyện',
    criteriaCode: 'IV',
    maxScore: 25,
    displayOrder: 4,
  },
  {
    criteriaName:
      'Đánh giá về ý thức và kết quả khi tham gia công tác cán bộ lớp, các đoàn thể, tổ chức trong nhà trường hoặc người học đạt được thành tích đặc biệt trong học tập, rèn luyện',
    description: 'Điều 8, Quy chế Đánh giá kết quả rèn luyện',
    criteriaCode: 'V',
    maxScore: 10,
    displayOrder: 5,
  },
];

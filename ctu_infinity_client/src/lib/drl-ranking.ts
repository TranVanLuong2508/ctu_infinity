export interface IRankingResult {
  label: string;
  color: string;
  nextStep: string;
}

export const calculateDrlRanking = (totalPoints: number): IRankingResult => {
  if (totalPoints >= 90) {
    return {
      label: 'Xuất sắc',
      color: 'bg-purple-500 hover:bg-purple-600',
      nextStep: 'Đã đạt điểm tối đa!',
    };
  }
  if (totalPoints >= 80) {
    return {
      label: 'Tốt',
      color: 'bg-green-500 hover:bg-green-600',
      nextStep: `Cần thêm ${90 - totalPoints} điểm để đạt Xuất sắc`,
    };
  }
  if (totalPoints >= 70) {
    return {
      label: 'Khá',
      color: 'bg-blue-500 hover:bg-blue-600',
      nextStep: `Cần thêm ${80 - totalPoints} điểm để đạt Tốt`,
    };
  }
  if (totalPoints >= 60) {
    return {
      label: 'Trung bình - khá',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      nextStep: `Cần thêm ${70 - totalPoints} điểm để đạt Khá`,
    };
  }
  if (totalPoints >= 50) {
    return {
      label: 'Trung bình',
      color: 'bg-orange-500 hover:bg-orange-600',
      nextStep: `Cần thêm ${60 - totalPoints} điểm để đạt Trung bình - khá`,
    };
  }
  if (totalPoints >= 30) {
    return {
      label: 'Yếu',
      color: 'bg-red-400 hover:bg-red-500',
      nextStep: `Cần thêm ${50 - totalPoints} điểm để đạt Trung bình`,
    };
  }
  return {
    label: 'Kém',
    color: 'bg-red-600 hover:bg-red-700',
    nextStep: `Cần thêm ${30 - totalPoints} điểm để đạt Yếu`,
  };
};

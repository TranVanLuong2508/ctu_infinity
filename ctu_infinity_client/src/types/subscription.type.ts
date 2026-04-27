// Subscription types
export interface ICategory {
  categoryId: string;
  categoryName: string;
  slug: string;
}

export interface ICriteria {
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  frameworkId: string;
  frameworkName?: string;
}

export interface ISubscription {
  subscriptionId: string;
  categories: ICategory[];
  criteria: ICriteria[];
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSubscriptionDto {
  categoryIds?: string[];
  criteriaIds?: string[];
}

export interface IUpdateSubscriptionDto {
  categoryIds?: string[];
  criteriaIds?: string[];
}

export interface ISubscriptionResponse {
  subscriptionId: string | null;
  categories: ICategory[];
  criteria: ICriteria[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ISubscriber {
  studentId: string;
  studentCode: string;
  fullName: string;
  email: string;
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Loader2, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { subscriptionService } from '@/services/subscription.service';
import { categoryService, IEventCategory } from '@/services/category.service';
import { criteriaService, ICriteriaItem } from '@/services/criteria.service';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionSettingsModal({
  isOpen,
  onClose,
}: SubscriptionSettingsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<IEventCategory[]>([]);
  const [criteria, setCriteria] = useState<ICriteriaItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<string[]>([]);

  // Sort criteria by criteriaCode (I, I.1, I.2, II, II.1, ...)
  const sortedCriteria = useMemo(() => {
    return [...criteria].sort((a, b) => {
      const codeA = a.criteriaCode || '';
      const codeB = b.criteriaCode || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [criteria]);

  // Fetch categories, criteria, và subscription hiện tại
  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories, criteria và subscription hiện tại song song
      const [categoriesRes, criteriaRes, subscriptionRes] = await Promise.all([
        categoryService.getAllCategories(),
        criteriaService.getActiveLeafCriteria(), // Chỉ lấy tiêu chí LÁ thuộc framework ACTIVE
        subscriptionService.getMySubscription(),
      ]);

      if (categoriesRes.EC === 1 && categoriesRes.data) {
        setCategories(categoriesRes.data.categories || []);
      }

      if (criteriaRes.EC === 1 && criteriaRes.data) {
        // Backend đã filter theo status=ACTIVE và interceptor wrap vào data.criterias
        setCriteria(criteriaRes.data.criterias || []);
      }

      if (subscriptionRes.EC === 1 && subscriptionRes.data) {
        // Set selected categories và criteria từ subscription hiện tại
        // Backend trả về { data: {...} } và interceptor wrap thêm lần nữa vào data
        console.log('subscriptionRes:', subscriptionRes);
        console.log('subscriptionRes.data:', subscriptionRes.data);
        const subscriptionData =
          (subscriptionRes.data as any).data || subscriptionRes.data;
        console.log('subscriptionData:', subscriptionData);
        const { categories: subCategories, criteria: subCriteria } =
          subscriptionData;
        console.log(
          'subCategories:',
          subCategories,
          'subCriteria:',
          subCriteria,
        );
        setSelectedCategoryIds(
          (subCategories || []).map((c: any) => c.categoryId),
        );
        setSelectedCriteriaIds(
          (subCriteria || []).map((c: any) => c.criteriaId),
        );
      }
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      const err = error as any;
      toast.error(
        err.response?.data?.EM || 'Không thể tải dữ liệu. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleCriteriaToggle = (criteriaId: string) => {
    setSelectedCriteriaIds((prev) =>
      prev.includes(criteriaId)
        ? prev.filter((id) => id !== criteriaId)
        : [...prev, criteriaId],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await subscriptionService.createOrUpdateSubscription({
        categoryIds: selectedCategoryIds,
        criteriaIds: selectedCriteriaIds,
      });

      if (response.EC === 1) {
        toast.success(response.EM || 'Cập nhật đăng ký thông báo thành công!');
        onClose();
      } else {
        toast.error(response.EM || 'Có lỗi xảy ra khi cập nhật.');
      }
    } catch (error: unknown) {
      console.error('Error saving subscription:', error);
      const err = error as any;
      const errorMessage =
        err.response?.data?.EM || 'Không thể cập nhật. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Cài đặt Thông báo Sự kiện
          </DialogTitle>
          <DialogDescription>
            Chọn các danh mục sự kiện và tiêu chí rèn luyện mà bạn quan tâm để
            nhận thông báo khi có sự kiện mới.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Alert thông tin */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bạn sẽ nhận thông báo khi có sự kiện mới thuộc các danh mục
                  hoặc tiêu chí bạn đã chọn.
                </AlertDescription>
              </Alert>

              {/* Danh mục sự kiện */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Danh mục sự kiện</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      selectedCategoryIds.length === categories.length
                        ? setSelectedCategoryIds([])
                        : setSelectedCategoryIds(categories.map((c) => c.categoryId))
                    }
                  >
                    {selectedCategoryIds.length === categories.length ? (
                      <>
                        <Circle className="w-3.5 h-3.5 mr-1" />
                        Bỏ chọn tất cả
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Chọn tất cả
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chọn các danh mục sự kiện bạn muốn theo dõi (
                  {selectedCategoryIds.length}/{categories.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-2">
                      Không có danh mục nào
                    </p>
                  ) : (
                    categories.map((category) => (
                      <div
                        key={category.categoryId}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer min-h-14"
                        onClick={() =>
                          handleCategoryToggle(category.categoryId)
                        }
                      >
                        <Checkbox
                          id={`category-${category.categoryId}`}
                          checked={selectedCategoryIds.includes(
                            category.categoryId,
                          )}
                          onCheckedChange={() =>
                            handleCategoryToggle(category.categoryId)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label
                          htmlFor={`category-${category.categoryId}`}
                          className="font-medium cursor-pointer flex-1 line-clamp-2"
                        >
                          {category.categoryName}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Tiêu chí rèn luyện */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Tiêu chí rèn luyện</h3>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      selectedCriteriaIds.length === sortedCriteria.length
                        ? setSelectedCriteriaIds([])
                        : setSelectedCriteriaIds(sortedCriteria.map((c) => c.criteriaId))
                    }
                  >
                    {selectedCriteriaIds.length === sortedCriteria.length ? (
                      <>
                        <Circle className="w-3.5 h-3.5 mr-1" />
                        Bỏ chọn tất cả
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Chọn tất cả
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chọn các tiêu chí đánh giá DRL bạn muốn theo dõi (
                  {selectedCriteriaIds.length}/{criteria.length})
                </p>
                <div className="space-y-2">
                  {criteria.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Không có tiêu chí lá nào thuộc khung đang hoạt động
                    </p>
                  ) : (
                    sortedCriteria.map((criterion) => (
                      <div
                        key={criterion.criteriaId}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer min-h-14"
                        onClick={() =>
                          handleCriteriaToggle(criterion.criteriaId)
                        }
                      >
                        <Checkbox
                          id={`criteria-${criterion.criteriaId}`}
                          checked={selectedCriteriaIds.includes(
                            criterion.criteriaId,
                          )}
                          onCheckedChange={() =>
                            handleCriteriaToggle(criterion.criteriaId)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label
                          htmlFor={`criteria-${criterion.criteriaId}`}
                          className="font-medium cursor-pointer flex-1 line-clamp-2"
                        >
                          {criterion.criteriaCode}. {criterion.criteriaName}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

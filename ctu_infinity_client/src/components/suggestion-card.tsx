import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Eye, Users, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Event {
  id: string | number;
  title: string;
  date: string;
  points: number;
  location: string;
  participants?: number | null;
  maxParticipants?: number | null;
  criteriaId?: string | number;
}

interface Criteria {
  id: string | number;
  name: string;
  icon?: LucideIcon;
  color?: string;
}

interface Explanation {
  reasonType: 'DEFICIT' | 'SUBSCRIPTION' | 'HISTORY' | 'COMMUNITY';
  message: string;
}

interface SuggestionCardProps {
  event: Event;
  criteria?: Criteria;
  onViewDetails?: (eventId: string | number) => void;
  explanation?: Explanation | null;
}

export function SuggestionCard({
  event,
  criteria,
  onViewDetails,
  explanation,
}: SuggestionCardProps) {
  if (!criteria) return null;

  const Icon = criteria.icon ?? Calendar;
  const bgColor = criteria.color ? `${criteria.color}/10` : 'bg-primary/10';
  const iconColor = criteria.color
    ? criteria.color.replace('bg-', 'text-')
    : 'text-primary';
  const dateObj = new Date(event.date);
  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Card className="hover:shadow-md hover:-translate-y-px transition-all duration-200 border-border/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between items-start gap-2">
          <div className={`p-2 rounded-lg ${bgColor} shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            +{event.points} điểm
          </Badge>
        </div>

        <div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{event.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {criteria.name}
          </p>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          {event.participants != null && event.maxParticipants != null ? (
            <div className="flex items-center gap-2 text-primary/80">
              <Users className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {event.participants}/{event.maxParticipants} người đăng ký
              </span>
            </div>
          ) : null}
        </div>

        {explanation && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary mb-0.5">
                  Lý do gợi ý
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {explanation.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          size="sm"
          className="w-full"
          variant="outline"
          onClick={() => onViewDetails?.(event.id)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  );
}

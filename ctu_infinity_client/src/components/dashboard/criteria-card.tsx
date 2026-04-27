'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, ChevronDown, ArrowRight } from 'lucide-react';

interface MappedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  criteriaId: string;
  criteriaName: string;
  points: number;
  participants: number | null;
  maxParticipants: number | null;
  organizer: string;
}

interface CriteriaData {
  id: string;
  code?: string;
  name: string;
  maxPoints: number;
  currentPoints: number;
  percentComplete: number;
  color: string;
  description: string;
}

interface CriteriaCardProps {
  criteria: CriteriaData;
  icon: React.ElementType;
  events: MappedEvent[];
}

export function CriteriaCard({ criteria, icon: Icon, events }: CriteriaCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden transition-shadow duration-200 hover:shadow-md">
      {/* Header - always visible, clickable to expand */}
      <button
        type="button"
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/40 active:bg-muted/60 cursor-pointer text-left group transition-colors duration-150"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`p-3 rounded-xl ${criteria.color}/10 shrink-0 group-hover:scale-110 transition-transform duration-200`}>
          <Icon className={`w-6 h-6 ${criteria.color.replace('bg-', 'text-')}`} />
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <h3 className="font-semibold text-balance">
                  {criteria.code ? `${criteria.code} ` : ''}{criteria.name}
                </h3>
              {criteria.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                  {criteria.description}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-bold">
                  {criteria.currentPoints}/{criteria.maxPoints}
                </p>
                <p className="text-xs text-muted-foreground">
                  {criteria.percentComplete.toFixed(0)}%
                </p>
              </div>
              <div className="p-2 rounded-full bg-muted/60 group-hover:bg-muted transition-colors duration-150">
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
              </div>
            </div>
          </div>
            <div className="relative">
            <Progress value={criteria.percentComplete} className="h-2" />
            <div
              className="absolute inset-0 rounded-full bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ width: '50%', transform: 'translateX(100%)', animation: isOpen ? 'none' : 'shimmer 2s infinite' }}
            />
          </div>
        </div>
      </button>

      {/* Collapsible content with smooth animation */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="border-t bg-muted/10">
          <CardContent className="p-4 space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Chưa có sự kiện nào cho tiêu chí này
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Sự kiện khả dụng
                </p>
                {events.map((event) => {
                  const participantPercent =
                    event.participants != null &&
                    event.maxParticipants != null &&
                    event.maxParticipants > 0
                      ? (event.participants / event.maxParticipants) * 100
                      : 0;

                  const dateObj = new Date(event.date);
                  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <button
                      key={event.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 hover:shadow-sm hover:bg-muted/20 transition-all duration-150 cursor-pointer text-left"
                      onClick={() => router.push(`/events/${event.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {event.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.participants != null && event.maxParticipants != null
                              ? `${event.participants}/${event.maxParticipants} (${participantPercent.toFixed(0)}%)`
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          +{event.points} điểm
                        </Badge>
                        <Badge variant="outline" className="text-xs h-7">
                          Chi tiết
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </div>
  );
}

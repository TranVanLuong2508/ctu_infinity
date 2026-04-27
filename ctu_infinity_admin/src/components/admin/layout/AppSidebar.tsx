'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Users,
  UserCheck,
  UserPlus,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  UserCog,
  LayoutDashboard,
  ListChecks,
  KeyRound,
  Shield,
  Calendar,
  Tags,
  ClipboardCheck,
  LayoutTemplate,
  CalendarRange,
  Layers,
  Award,
  Building2,
  School,
  BookText,
  BookMarked,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { adminPath } from '@/constants/path';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';
import { ALL_PERMISSIONS } from '@/constants/permission';

interface ISidebarItem {
  title: string;
  icon: React.ComponentType<any>;
  href: string;
}

interface IAcademicItem {
  title: string;
  icon: React.ComponentType<any>;
  href: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, authUser } = useAuthStore();
  const [sidebarMenuItems, setSidebarMenuItems] = useState<ISidebarItem[]>([]);
  const [academicItems, setAcademicItems] = useState<IAcademicItem[]>([]);
  const [academicOpen, setAcademicOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [userSubItems, setUserSubItems] = useState<IAcademicItem[]>([]);
  const [eventManagementOpen, setEventManagementOpen] = useState(false);
  const [academicScheduleOpen, setAcademicScheduleOpen] = useState(false);

  const permissions = authUser?.permissions ?? [];
  const isOrganizer = authUser?.roleName === 'ORGANIZER';

  // Auto-expand user group when on a users page
  useEffect(() => {
    if (pathname.startsWith('/admin/users')) {
      setUsersOpen(true);
    }
  }, [pathname]);

  // Auto-expand academic group when on an academic page
  useEffect(() => {
    if (pathname.startsWith('/admin/academic')) {
      setAcademicOpen(true);
    }
  }, [pathname]);

  // Auto-expand academic schedule group when on academic year / semester pages
  useEffect(() => {
    if (
      pathname.startsWith('/admin/academic-year') ||
      pathname.startsWith('/admin/semesters')
    ) {
      setAcademicScheduleOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (permissions && permissions.length > 0) {
      const has = (apiPath: string, method: string) =>
        permissions.some((p) => p.apiPath === apiPath && p.method === method);

      // ── Main menu items (non-user) ──────────────────────────────────────
      const full: ISidebarItem[] = [
        ...(has(
          ALL_PERMISSIONS.CRITERIA_FRAME.GET_All.apiPath,
          ALL_PERMISSIONS.CRITERIA_FRAME.GET_All.method,
        )
          ? [
            {
              title: 'Khung tiêu chí',
              icon: BookMarked,
              href: adminPath.CRITERIA_FRAME,
            },
          ]
          : []),
        ...(has(
          ALL_PERMISSIONS.CRITERIA.GET_All.apiPath,
          ALL_PERMISSIONS.CRITERIA.GET_All.method,
        )
          ? [{ title: 'Tiêu chí', icon: ListChecks, href: adminPath.CRITERIA }]
          : []),
        ...(has(
          ALL_PERMISSIONS.PERMISSIONS.GET_All.apiPath,
          ALL_PERMISSIONS.PERMISSIONS.GET_All.method,
        )
          ? [
            {
              title: 'Quyền hạn',
              icon: KeyRound,
              href: adminPath.PERMISSIONS,
            },
          ]
          : []),
        ...(has(
          ALL_PERMISSIONS.ROLES.GET_All.apiPath,
          ALL_PERMISSIONS.ROLES.GET_All.method,
        )
          ? [{ title: 'Vai trò', icon: Shield, href: adminPath.ROLES }]
          : []),
      ];

      setSidebarMenuItems(full);

      // ── User management sub-items ────────────────────────────────────────
      const canViewUsers =
        has(
          ALL_PERMISSIONS.USERS.GET_MANAGE.apiPath,
          ALL_PERMISSIONS.USERS.GET_MANAGE.method,
        ) ||
        has(
          ALL_PERMISSIONS.USERS.GET_All.apiPath,
          ALL_PERMISSIONS.USERS.GET_All.method,
        );

      if (canViewUsers) {
        setUserSubItems([
          { title: 'Tất cả người dùng', icon: Users, href: adminPath.USERS },
          {
            title: 'Sinh viên',
            icon: GraduationCap,
            href: adminPath.USERS_STUDENTS,
          },
          {
            title: 'Ban tổ chức',
            icon: UserCog,
            href: adminPath.USERS_ORGANIZERS,
          },
        ]);
      }

      const academic: IAcademicItem[] = [
        ...(has(
          ALL_PERMISSIONS.FACULTIES.GET_All.apiPath,
          ALL_PERMISSIONS.FACULTIES.GET_All.method,
        )
          ? [{ title: 'Khoa', icon: School, href: adminPath.FACULTIES }]
          : []),
        ...(has(
          ALL_PERMISSIONS.MAJORS.GET_All.apiPath,
          ALL_PERMISSIONS.MAJORS.GET_All.method,
        )
          ? [{ title: 'Ngành', icon: BookText, href: adminPath.MAJORS }]
          : []),
        ...(has(
          ALL_PERMISSIONS.CLASSES.GET_All.apiPath,
          ALL_PERMISSIONS.CLASSES.GET_All.method,
        )
          ? [{ title: 'Lớp', icon: Users, href: adminPath.CLASSES }]
          : []),
      ];

      setAcademicItems(academic);
    }
  }, [permissions]);

  return (
    <Sidebar className="border-r bg-white">
      <SidebarHeader className="border-b bg-white">
        <div className="flex items-center justify-center px-6 py-3">
          <Image
            src="/assets/logo.png"
            alt="CTU Infinity Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* ── Dashboard ───────────────────────────────────────────── */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/admin'}>
                  <Link href="/admin">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Tổng quan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {sidebarMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* ── Quản lý sự kiện – ORGANIZER: flatten ra ngoài ─── */}
              {isOrganizer && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === adminPath.EVENT_MANAGEMENT ||
                        (pathname.startsWith(adminPath.EVENT_MANAGEMENT) &&
                          !pathname.includes('/participants') &&
                          !pathname.includes('/attendances'))
                      }
                      className="text-sm"
                    >
                      <Link href={adminPath.EVENT_MANAGEMENT}>
                        <Trophy className="h-4 w-4" />
                        <span>Sự kiện</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith('/admin/event-management/participants')}
                      className="text-sm"
                    >
                      <Link href="/admin/event-management/participants">
                        <UserPlus className="h-4 w-4" />
                        <span>Quản lý tham gia</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith('/admin/event-management/attendances')}
                      className="text-sm"
                    >
                      <Link href="/admin/event-management/attendances">
                        <ClipboardCheck className="h-4 w-4" />
                        <span>Duyệt điểm danh</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(adminPath.EVENT_TEMPLATES)}
                      className="text-sm"
                    >
                      <Link href={adminPath.EVENT_TEMPLATES}>
                        <LayoutTemplate className="h-4 w-4" />
                        <span>Mẫu sự kiện</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {/* ── Quản lý sự kiện (collapsible) – chỉ ADMIN ──────────── */}
              {!isOrganizer && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={
                      pathname.startsWith('/admin/event-management') ||
                      pathname.startsWith('/admin/event-categories') ||
                      pathname.startsWith('/admin/event-templates')
                    }
                    onClick={() => setEventManagementOpen((o) => !o)}
                    className="w-full cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="flex-1">Quản lý sự kiện</span>
                    {eventManagementOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </SidebarMenuButton>
                  {eventManagementOpen && (
                    <div className="mt-1 ml-4 pl-2 border-l border-border space-y-0.5">
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === adminPath.EVENT_MANAGEMENT ||
                          (pathname.startsWith(adminPath.EVENT_MANAGEMENT) &&
                            !pathname.includes('/participants') &&
                            !pathname.includes('/attendances'))
                        }
                        className="text-sm"
                      >
                        <Link href={adminPath.EVENT_MANAGEMENT}>
                          <Trophy className="h-3.5 w-3.5" />
                          <span>Sự kiện</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === adminPath.EVENT_CATEGORIES}
                        className="text-sm"
                      >
                        <Link href={adminPath.EVENT_CATEGORIES}>
                          <Tags className="h-3.5 w-3.5" />
                          <span>Danh mục sự kiện</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(adminPath.EVENT_TEMPLATES)}
                        className="text-sm"
                      >
                        <Link href={adminPath.EVENT_TEMPLATES}>
                          <LayoutTemplate className="h-3.5 w-3.5" />
                          <span>Mẫu sự kiện</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  )}
                </SidebarMenuItem>
              )}

              {/* ── Năm học & Học kỳ – chỉ ADMIN ───────────────────────── */}
              {!isOrganizer && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={
                      pathname.startsWith('/admin/academic-year') ||
                      pathname.startsWith('/admin/semesters')
                    }
                    onClick={() => setAcademicScheduleOpen((o) => !o)}
                    className="w-full cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="flex-1">Năm học &amp; Học kỳ</span>
                    {academicScheduleOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </SidebarMenuButton>
                  {academicScheduleOpen && (
                    <div className="mt-1 ml-4 pl-2 border-l border-border space-y-0.5">
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === adminPath.ACADEMIC_YEAR}
                        className="text-sm"
                      >
                        <Link href={adminPath.ACADEMIC_YEAR}>
                          <CalendarRange className="h-3.5 w-3.5" />
                          <span>Năm học</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === adminPath.SEMESTERS}
                        className="text-sm"
                      >
                        <Link href={adminPath.SEMESTERS}>
                          <Layers className="h-3.5 w-3.5" />
                          <span>Học kỳ</span>
                        </Link>
                      </SidebarMenuButton>
                    </div>
                  )}
                </SidebarMenuItem>
              )}

              {/* ── User management collapsible group (chỉ ADMIN) ────────── */}
              {!isOrganizer && userSubItems.length > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/admin/users')}
                    onClick={() => setUsersOpen((o) => !o)}
                    className="w-full cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span className="flex-1">Quản lý người dùng</span>
                    {usersOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </SidebarMenuButton>
                  {usersOpen && (
                    <div className="mt-1 ml-4 pl-2 border-l border-border space-y-0.5">
                      {userSubItems.map((sub) => (
                        <SidebarMenuButton
                          key={sub.href}
                          asChild
                          isActive={pathname === sub.href}
                          className="text-sm"
                        >
                          <Link href={sub.href}>
                            <sub.icon className="h-3.5 w-3.5" />
                            <span>{sub.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              )}

              {/* ── Quản lý sinh viên (chỉ ADMIN) ───────────────────────── */}
              {!isOrganizer && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin/students'}
                    className="text-sm"
                  >
                    <Link href="/admin/students">
                      <GraduationCap className="h-4 w-4" />
                      <span>Quản lý sinh viên</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* ── Quản lý điểm rèn luyện (chỉ ADMIN) ──────────────────── */}
              {!isOrganizer && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/admin/student-scores')}
                    className="text-sm"
                  >
                    <Link href="/admin/student-scores">
                      <Award className="h-4 w-4" />
                      <span>Quản lý điểm rèn luyện</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* ── Đơn vị đào tạo (chỉ ADMIN) ─────────────────────────── */}
              {!isOrganizer && academicItems.length > 0 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname.startsWith('/admin/academic')}
                    onClick={() => setAcademicOpen((o) => !o)}
                    className="w-full cursor-pointer"
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="flex-1">Đơn vị đào tạo</span>
                    {academicOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </SidebarMenuButton>

                  {academicOpen && (
                    <div className="mt-1 ml-4 pl-2 border-l border-border space-y-0.5">
                      {academicItems.map((sub) => (
                        <SidebarMenuButton
                          key={sub.href}
                          asChild
                          isActive={pathname === sub.href}
                          className="text-sm"
                        >
                          <Link href={sub.href}>
                            <sub.icon className="h-3.5 w-3.5" />
                            <span>{sub.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          {isAuthenticated === true ? (
            <>
              <p className="font-medium">{`Name: ${authUser.fullName}`}</p>
              <p>{authUser.email}</p>
            </>
          ) : (
            <></>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

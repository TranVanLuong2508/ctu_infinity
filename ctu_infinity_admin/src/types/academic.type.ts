// Academic unit types (Faculty / Major / Class)

export interface IFacultyItem {
    falcultyId: string;
    falcultyName: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMajorItem {
    majorId: string;
    majorName: string;
    description?: string;
    falcultyId: string;
    falculty?: IFacultyItem;
    createdAt: string;
    updatedAt: string;
}

export interface IClassItem {
    classId: string;
    className: string;
    description?: string;
    majorId?: string;
    major?: IMajorItem;
    academicYear: number;
    createdAt: string;
    updatedAt: string;
}

// Response types
export interface IFacultiesRes {
    falculties: IFacultyItem[];
}

export interface IMajorsRes {
    majors: IMajorItem[];
}

export interface IClassesRes {
    classes: IClassItem[];
    pagination?: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
    };
}

// Form DTOs
export interface ICreateFaculty {
    falcultyName: string;
    description?: string;
}

export interface IUpdateFaculty {
    falcultyName?: string;
    description?: string;
}

export interface ICreateMajor {
    majorName: string;
    description?: string;
    falcultyId: string;
}

export interface IUpdateMajor {
    majorName?: string;
    description?: string;
    falcultyId?: string;
}

export interface ICreateClass {
    className: string;
    description?: string;
    majorId?: string;
    academicYear: number;
}

export interface IUpdateClass {
    className?: string;
    description?: string;
    majorId?: string;
    academicYear?: number;
}

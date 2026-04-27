export const ALL_MODULES = {
  USERS: 'USERS',
  AUTH: 'AUTH',
  FILMS: 'FILMS',
  PERMISSIONS: 'PERMISSIONS',
  ROLES: 'ROLES',
};

export const ALL_PERMISSIONS = {
  USERS: {
    GET_All: { method: 'GET', apiPath: '/api/v1/users', module: 'USERS' },
    GET_MANAGE: {
      method: 'GET',
      apiPath: '/api/v1/users/manage',
      module: 'USERS',
    },
    ADMIN_CREATE: {
      method: 'POST',
      apiPath: '/api/v1/users/admin-create',
      module: 'USERS',
    },
  },
  PERMISSIONS: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/permissions',
      module: 'PERMISSIONS',
    },
  },
  ROLES: {
    GET_All: { method: 'GET', apiPath: '/api/v1/roles', module: 'ROLES' },
  },
  CRITERIA: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/criterias',
      module: 'CRITERIA',
    },
  },
  CRITERIA_FRAME: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/criteria-frame',
      module: 'CRITERIA_FRAME',
    },
  },
  FACULTIES: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/falculties',
      module: 'FALCULTY',
    },
  },
  MAJORS: {
    GET_All: { method: 'GET', apiPath: '/api/v1/majors', module: 'MAJOR' },
  },
  CLASSES: {
    GET_All: { method: 'GET', apiPath: '/api/v1/class', module: 'CLASS' },
  },
  SEMESTERS: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/semesters',
      module: 'SEMESTER',
    },
  },
  ACADEMIC_YEAR: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/academic-year',
      module: 'ACADEMIC_YEAR',
    },
  },
  STUDENT_SCORE: {
    GET_All: {
      method: 'GET',
      apiPath: '/api/v1/student-scores',
      module: 'STUDENT_SCORE',
    },
  },
};

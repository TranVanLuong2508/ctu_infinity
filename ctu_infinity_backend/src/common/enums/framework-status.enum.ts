/**
 * Framework lifecycle status enum
 * - DRAFT: Framework is being edited, criteria can be modified
 * - ACTIVE: Framework is currently in use, cannot be modified
 * - ARCHIVED: Framework is historical, cannot be modified
 */
export enum FrameworkStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    ARCHIVED = 'ARCHIVED',
}

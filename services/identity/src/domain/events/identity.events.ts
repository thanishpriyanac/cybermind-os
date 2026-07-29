export class TenantCreatedEvent {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class UserDisabledEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class RoleCreatedEvent {
  constructor(
    public readonly roleId: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class RoleAssignedEvent {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class PermissionGrantedEvent {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class PasswordChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class SessionCreatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class SessionRevokedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class MFAEnabledEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly type: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

export class MFADisabledEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

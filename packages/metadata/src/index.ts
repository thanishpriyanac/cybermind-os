export enum OperatingSystem {
  WINDOWS = 'WINDOWS',
  LINUX = 'LINUX',
  MACOS = 'MACOS',
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  UNKNOWN = 'UNKNOWN',
}

export enum CloudProvider {
  AWS = 'AWS',
  AZURE = 'AZURE',
  GCP = 'GCP',
  ON_PREM = 'ON_PREM',
  UNKNOWN = 'UNKNOWN',
}

export enum SeverityLevel {
  INFORMATIONAL = 'INFORMATIONAL',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskLevel {
  NEGLIGIBLE = 'NEGLIGIBLE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME',
}

export enum Environment {
  DEV = 'DEV',
  TEST = 'TEST',
  STAGING = 'STAGING',
  PROD = 'PROD',
}

export enum GeographicRegion {
  US_EAST = 'US_EAST',
  US_WEST = 'US_WEST',
  EU_CENTRAL = 'EU_CENTRAL',
  EU_WEST = 'EU_WEST',
  AP_SOUTHEAST = 'AP_SOUTHEAST',
  UNKNOWN = 'UNKNOWN',
}

export enum AssetCategory {
  WORKSTATION = 'WORKSTATION',
  SERVER = 'SERVER',
  NETWORK_DEVICE = 'NETWORK_DEVICE',
  CLOUD_INSTANCE = 'CLOUD_INSTANCE',
  CONTAINER = 'CONTAINER',
  DATABASE = 'DATABASE',
  APPLICATION = 'APPLICATION',
  UNKNOWN = 'UNKNOWN',
}

export enum LifecycleState {
  PROVISIONED = 'PROVISIONED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DECOMMISSIONED = 'DECOMMISSIONED',
  COMPROMISED = 'COMPROMISED',
}

export enum AssetStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNKNOWN = 'UNKNOWN',
}

export enum RelationshipType {
  HOSTS = 'HOSTS',
  RUNS_ON = 'RUNS_ON',
  CONNECTS_TO = 'CONNECTS_TO',
  DEPENDS_ON = 'DEPENDS_ON',
  MEMBER_OF = 'MEMBER_OF',
  BACKS_UP = 'BACKS_UP',
  EXPOSES = 'EXPOSES',
  MANAGES = 'MANAGES',
}

export enum AuthenticationMethod {
  PASSWORD = 'PASSWORD',
  KEY = 'KEY',
  CERTIFICATE = 'CERTIFICATE',
  TOKEN = 'TOKEN',
  SSO = 'SSO',
}

export enum NetworkZone {
  INTERNAL = 'INTERNAL',
  DMZ = 'DMZ',
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED',
}

import { PluginListenerHandle, registerPlugin } from '@capacitor/core';

export interface IntuneMAMUser {
  upn: string;
}

export interface IntuneMAMVersionInfo {
  version: string;
}

export interface IntuneMAMGroupName {
  value: string;
}

export interface IntuneMAMAppConfig {
  [key: string]: any;
}

export interface IntuneMAMPolicy {
  // Cross-platform policy fields
  contactSyncAllowed: boolean;
  pinRequired: boolean;
  managedBrowserRequired: boolean;

  // Android fields
  screenCaptureAllowed?: boolean;

  [key: string]: any;
}

interface IntuneMAMPlugin {
  enrolledAccount: () => Promise<IntuneMAMUser>;
  loginAndEnrollAccount: () => Promise<void>;
  deRegisterAndUnenrollAccount: (user: IntuneMAMUser) => Promise<void>;
  appConfig: (user: IntuneMAMUser) => Promise<IntuneMAMAppConfig>;
  groupName: (user: IntuneMAMUser) => Promise<IntuneMAMGroupName>;
  getPolicy: (user: IntuneMAMUser) => Promise<IntuneMAMPolicy>;
  sdkVersion: () => Promise<IntuneMAMVersionInfo>;
  displayDiagnosticConsole: () => Promise<void>;

  // Events
  addListener(
    eventName: 'appConfigChange',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
  addListener(
    eventName: 'policyChange',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

const IntuneMAM = registerPlugin<IntuneMAMPlugin>('IntuneMAM');

export default IntuneMAM;
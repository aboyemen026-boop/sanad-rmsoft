import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.rmsoft.sanad',
  appName: 'سند RM SOFT',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_icon_config_sample', iconColor: '#DDBB62' },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] }
  }
};
export default config;

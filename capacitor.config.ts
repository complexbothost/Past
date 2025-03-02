
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pastebin.app',
  appName: 'Pastebin',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.matjalal.app',
  appName: '맛잘알',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    CapacitorHttp: {
      // 모든 fetch 요청을 네이티브 HTTP로 전환 (CORS 우회)
      enabled: true
    }
  }
};

export default config;

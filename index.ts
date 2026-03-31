import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Inject web-specific global styles for better desktop UX
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root { height: 100%; background: #121212; }
    * { -webkit-tap-highlight-color: transparent; }
    [role="button"], button, a, [data-focusable="true"] { cursor: pointer; }
    input, textarea { outline-color: #818cf8; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  `;
  document.head.appendChild(style);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

import '../style.css';
import { mountWebviewApp } from 'src/bridge/mount-webview-app';
import App from './App.vue';

mountWebviewApp(App);

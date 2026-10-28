import '../style.css';
import { mountWebviewApp } from '../bridge/mount-webview-app';
import App from './App.vue';

mountWebviewApp(App);

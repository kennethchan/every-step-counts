import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { tooltipDirective } from './directives/tooltip.js'
import './styles/main.css'

createApp(App).use(createPinia()).directive('tooltip', tooltipDirective).mount('#app')

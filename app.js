---
layout: compress
# https://github.com/vikassri
# © 2020 Vikas Srivastava
# MIT Licensed
---

/* Registering Service Worker */
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('{{ "/sw.js" | relative_url }}');
};
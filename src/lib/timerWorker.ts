let interval: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  if (e.data === 'start') {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      self.postMessage('tick');
    }, 500);
  } else if (e.data === 'stop') {
    if (interval) clearInterval(interval);
    interval = null;
  }
};

/* @wujiantao/rollup-dev-server 1.0.7 */
function livereload() {
    if (typeof window === 'undefined') {
        return;
    }
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.innerHTML = `
    // Create WebSocket connection.
    const socket = new WebSocket('ws://${window.location.host}');
    
    // Connection opened
    socket.addEventListener('open', function (event) {
      socket.send('Hello Rollup Dev Server!');
    });
    
    // Listen for messages
    socket.addEventListener('message', function (event) {
      window.location.reload();
      console.log('Message from server ', event.data);
    });
  `;
    document.body.appendChild(script);
}

export { livereload };

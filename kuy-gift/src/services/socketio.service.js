import { io } from 'socket.io-client';

class SocketioService {
  socket;
  constructor() {}

  setupSocketConnection() {
    // this.socket = io(process.env.VUE_APP_SOCKET_ENDPOINT);
    this.socket = io('http://localhost:3000');
    console.log("try to init Socket")
    this.socket.emit('my message', 'Hello there from Vue.');
  }

  disconnect() {
    if (this.socket) {
        this.socket.disconnect();
    }
}
}

export default new SocketioService();
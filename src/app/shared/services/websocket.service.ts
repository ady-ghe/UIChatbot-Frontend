import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Message } from "@app/shared/interfaces/message.interface";

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor() {}

  connect(): void {
    this.socket = new WebSocket('ws://localhost:8080');
    this.socket.onopen = () => {
      console.log('WebSocket connection established.');
    };

    this.socket.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
     // console.log('Received from server:', message);
      this.messagesSubject.next([...this.messagesSubject.value, message]);
    };

    this.socket.onerror = (event) => {
      this.messagesSubject.next([
        ...this.messagesSubject.getValue(),
        { text: '️ Sorry, but I can\'t help you today, I have a connection error :( ' +
              ' Please try again later.', fromUser: false, error: true, step:'' }
      ]);
    };
    this.socket.onclose = () => {
      console.log('WebSocket connection closed.');
    };
  }

  sendMessage(message: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
    }
  }

  resetMessages(): void {
    this.messagesSubject.next([]);
  }

  removeLastMessage(): void {
    const currentMessages = this.messagesSubject.value;
    if (currentMessages.length > 0) {
      this.messagesSubject.next(currentMessages.slice(0, -1));
    }
  }

  // addMessage(message: Message): void {
  //   this.messagesSubject.next([...this.messagesSubject.value, message]);
  // }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}

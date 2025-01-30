import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { WebSocketService } from '@app/shared/services/websocket.service';
import { Message } from "@app/shared/interfaces/message.interface";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
  userMessage = '';
  messages: Message[] = [];
  private step = '';

  constructor(protected webSocketService: WebSocketService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.webSocketService.connect();
    this.webSocketService.messages$.subscribe((messages) => {

      const lastServerMessage = [...messages]
          .reverse()
          .find(msg => !msg.fromUser);
      if (lastServerMessage) {
        if(lastServerMessage?.stockExchanges) {
          this.step = 'topStocks';
        } else if(lastServerMessage?.topStocks) {
          this.step = 'prices';
        }
        console.log('Last lastServerMessage:', lastServerMessage);
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.webSocketService.disconnect();
  }

   selectExchange(code: string): void {
    const message = {
      text: code,
      fromUser: true,
      step: this.step
    } as Message;
    this.webSocketService.sendMessage(JSON.stringify(message));
  }

  selectTopStock(stockCode: string) {
    const message = {
      text: stockCode,
      fromUser: true,
      step: this.step
    } as Message;
    this.webSocketService.sendMessage(JSON.stringify(message));
  }

  sendMessage(): void {
    if (this.userMessage.trim()) {
      const message = {
        text: this.userMessage,
        fromUser: true,
        step: this.step
      } as Message;
      this.webSocketService.sendMessage(JSON.stringify(message));
      this.userMessage = '';
    }
  }

  clearChat() {
    this.messages = [];
    this.userMessage = '';
    this.webSocketService.resetMessages();
    this.webSocketService.sendMessage(JSON.stringify({ text: 'MainMenu', fromUser: true }));
  }

  goBack() {
    this.webSocketService.removeLastMessage();
  }

}
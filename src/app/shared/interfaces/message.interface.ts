export interface TopStocks {
    code: string;
    stockName: string;
    price: number;
}

export interface Stock {
    code: string;
    stockExchange: string;
    topStocks: TopStocks[];
}

export interface Message {
    text: string;
    fromUser: boolean;
    step: string;
    error: boolean;
    stockExchanges?: Stock[];
    topStocks?: TopStocks[];
    selectedStock?: string;
}
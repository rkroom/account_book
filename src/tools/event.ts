export default class EventBus {
    private events: any;
    constructor() {
      this.events = {};
    }
    emit(eventName: any, data: any) {
      if (this.events[eventName]) {
        this.events[eventName].forEach(function (fn: any) {
          fn(data);
        });
      }
    }
    on(eventName: any, fn: any) {
      this.events[eventName] = this.events[eventName] || [];
      this.events[eventName].push(fn);
    }
  
    off(eventName: any, fn: any) {
      if (this.events[eventName]) {
        for (let i = 0; i < this.events[eventName].length; i++) {
          if (this.events[eventName][i] === fn) {
            this.events[eventName].splice(i, 1);
            break;
          }
        }
      }
    }
  }
import { Injectable } from '@angular/core';
import { Observable, merge, fromEvent, mapTo, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  public onlineStatus$: Observable<boolean>;
  constructor() {
    this.onlineStatus$ = merge(
      fromEvent(window, 'online').pipe(mapTo(true)),
      fromEvent(window, 'offline').pipe(mapTo(false))
    ).pipe(
      startWith(navigator.onLine) // Emit the initial status
    );
  }
}

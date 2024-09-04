import { Injectable } from '@angular/core';
import { Observable, merge, fromEvent, mapTo, startWith, of, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  public onlineStatus$: Observable<boolean>;
  // public isOnline: boolean = navigator.onLine;

  constructor() {

    // merge(
    //   of(navigator.onLine),
    //   fromEvent(window, 'online').pipe(map(() => true)),
    //   fromEvent(window, 'offline').pipe(map(() => false))
    // ).subscribe(status => {
    //   this.isOnline = status;
    //   console.log('Network status:', this.isOnline ? 'Online' : 'Offline');
    // });


    this.onlineStatus$ = merge(
      fromEvent(window, 'online').pipe(mapTo(true)),
      fromEvent(window, 'offline').pipe(mapTo(false))
    ).pipe(
      startWith(navigator.onLine) // Emit the initial status
    );
  }
}

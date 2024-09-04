import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OffLineService } from './off-line.service';
import Dexie from 'dexie';

interface User {
  name: string,
  lastName: string,
  phone: string,
  id?: number
}

@Injectable({
  providedIn: 'root'
})
export class RestApiService {

  private _url = `https://66d7af3737b1cadd80520f83.mockapi.io`;

  constructor(private _http: HttpClient) {}

  create(data: User) {
    const url = this._url + `/api/v1/users`;
    return this._http.post<User>(url, data)
  }

  delete() {
  }

}

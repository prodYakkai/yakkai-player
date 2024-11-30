import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { StreamWithKeyParams } from '../types/Stream';

@Injectable({
  providedIn: 'root'
})
export class FeedService {

  constructor(
    private http: HttpClient
  ) { }

  getFeedByKey(key: string) {
    return this.http.get<HttpResponse<StreamWithKeyParams>>(`${environment.apiServer}/feed/${key}`);
  }

  pingServer() {
    return this.http.get(`${environment.apiServer}/ping`);
  }
}

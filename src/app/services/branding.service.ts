import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EventBranding } from '@prisma/client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BrandingService {

  constructor(
    private http: HttpClient
  ) { }

  private eventIdSubject = new Subject<string>();

  public getEventId() {
    return this.eventIdSubject.asObservable();
  }
  
  public setEventId(eventId: string) {
    this.eventIdSubject.next(eventId);
  }

  public getBranding(eventId: string) {
    return this.http.get<HttpResponse<EventBranding>>(environment.apiServer + '/branding/' + eventId);
  }

}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { EventBranding } from '@prisma/client';

@Injectable({
  providedIn: 'root'
})
export class BrandingService {

  constructor(
    private http: HttpClient
  ) { }

  getBranding(eventId: string) {
    return this.http.get<HttpResponse<EventBranding>>(environment + '/branding/' + eventId);
  }

}

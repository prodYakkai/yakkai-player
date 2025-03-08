import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { BrandingService } from './services/branding.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NzLayoutModule,NzMenuModule, RouterModule, NzDividerModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{

  constructor(
    private brandingService: BrandingService
  ) { }

  ngOnInit(): void {
    this.brandingService.getEventId().subscribe(
      (eventId) => {
        if (eventId) {
          this.loadBranding(eventId);
        }
      }
    );
  }

  loadBranding(eventId: string) {
    this.brandingService.getBranding(eventId).subscribe(
      (res) => {
        console.log(res);
      }
    );
  }
}

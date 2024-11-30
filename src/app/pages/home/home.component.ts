import { FeedService } from './../../services/feed.service';
import { Component, OnInit } from '@angular/core';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NzGridModule,
    NzInputModule,
    NzButtonModule,
    NzMessageModule,
    CommonModule,
    FormsModule,
    RouterModule,
    NzAlertModule,
    // Components
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  public keyInput: string = '';
  public generalError: string = '';

  constructor(
    private router: Router,
    private feedService: FeedService
  ) {}

  ngOnInit() {
    this.feedService.pingServer().subscribe(
      () => {},
      (err) => {
        if (err.status === 0) {
          this.generalError = 'The server is currently offline! Please try again later or contact the server administrator.';
        }
      }
    );
  };

  linkToPlayer() {
    this.router.navigate(['/play'], {
      queryParams: { key: this.keyInput },
    });
  }
}

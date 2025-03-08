import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { FeedService } from '../../services/feed.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { FormsModule } from '@angular/forms';
import { FlvPlayerComponent } from '../../components/players/flv-player/flv-player.component';
import { WhepPlayerComponent } from '../../components/players/whep-player/whep-player.component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { StreamWithKeyParams } from '../../types/Stream';
import { IngestMethod } from '@prisma/client';
import { DemoStreamParams, generateLocalStreamParams } from '../../const';
import { BrandingService } from '../../services/branding.service';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NzGridModule,
    NzAlertModule,
    NzSpinModule,
    NzButtonModule,
    NzRadioModule,
    FormsModule,
    NzModalModule,
    // components
    FlvPlayerComponent,
    WhepPlayerComponent,
  ],
  templateUrl: './players.component.html',
  styleUrl: './players.component.scss',
})
export class PlayersComponent implements OnInit, OnDestroy {
  
  private routeSub: Subscription = new Subscription();
  private streamKey: string = '';

  public streamParams: StreamWithKeyParams | null = null;

  public currentStreamUrlFromPlayer: string  = '';

  public generalErrorMessage: string = '';
  public errorCode: number = 0; // -1: no stream, -2: general error

  public streamType: 'whep' | 'flv' =
    // default to FLV in Firefox and WHEP in all other browsers
    navigator.userAgent.indexOf('Firefox') === -1 ? 'whep' : 'flv';
  
  // flags
  public embedMode: boolean = false;
  public isLoading: boolean = false;
  public isError: boolean = false;
  

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private feedService: FeedService,
    private messageService: NzMessageService,
    private modalService: NzModalService,
    private brandingService: BrandingService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.activeRoute.queryParams.subscribe(this.onRouteChange);
  }
  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
  }

  onRouteChange = (params: Params) => {
    if (!params['key']) {
      this.router.navigate(['/404']);
    }
    const key = params['key'];
    this.streamKey = key;

    const streamType = params['type'];
    if (streamType === 'whep' || streamType === 'flv') {
      this.streamType = streamType;
    }

    this.embedMode = params['embed'] !== undefined;

    if ( this.streamKey === 'local' && params['url'] !== undefined) {
      let streamParams = generateLocalStreamParams(
        'Local Stream',
        decodeURIComponent(params['url'])
      )
      streamParams.embed = this.embedMode;
      this.streamParams = streamParams;
      return;
    }

    this.loadStreamFeedConfig(key);
  };

  onPlayerTypeChange = (streamType: string) => {
    this.router.navigate(['.'], {
      relativeTo: this.activeRoute,
      queryParams: { type: streamType },
      queryParamsHandling: 'merge',
    })
  };

  onPlayerStreamUrlChange = (streamUrl: string) => {
    this.currentStreamUrlFromPlayer = streamUrl;
  }

  loadStreamFeedConfig = (key: string) => {
    this.isLoading = true;
    this.errorCode = 0;
    this.isError = false;
    this.streamParams = null;
    if (key === 'demo') {
      this.streamParams = DemoStreamParams;
      this.isLoading = false;
      return;
    }

    this.feedService.getFeedByKey(key).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        console.log(data);

        if (data.code < 0) {
          this.isError = true;
          this.errorCode = data.code
          this.messageService.error(data?.message);
          return;
        }

        this.streamParams  = data.data;
        if (this.streamParams) {
          this.brandingService.setEventId(this.streamParams.event.id);
          this.streamParams.embed = this.embedMode;
        }
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.isError = true;
        this.errorCode = -2;
        this.messageService.error('Failed to load stream feed config');
      },
    });
  };

  handleReload = () => {
    this.loadStreamFeedConfig(this.streamKey);
  };

  handleShowStreamUrl = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    if (this.currentStreamUrlFromPlayer === '') {
      this.messageService.error('No stream url found');
      return;
    }

    this.modalService.info({
      nzTitle: 'Stream Watch URL',
      nzContent: this.currentStreamUrlFromPlayer,
      nzOkText: 'Copy',
      nzOnOk: () => {
        navigator.clipboard.writeText(this.currentStreamUrlFromPlayer)
          .then(() => {
            this.messageService.success('Copied to clipboard');
          })
          .catch((error) => {
            this.messageService.error('Failed to copy to clipboard');
          });
      }
    });
  };


}

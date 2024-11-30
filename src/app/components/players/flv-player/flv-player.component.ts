import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import Mpegts from 'mpegts.js';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { FormsModule } from '@angular/forms';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Renderer2 } from '@angular/core';
import { StreamWithKeyParams } from '../../../types/Stream';
import { IngestMethod } from '@prisma/client';

@Component({
  selector: 'app-flv-player',
  standalone: true,
  imports: [
    CommonModule,
    NzMessageModule,
    NzSpinModule,
    NzButtonModule,
    NzAlertModule,
    NzRadioModule,
    FormsModule,
    NzToolTipModule,
  ],
  templateUrl: './flv-player.component.html',
  styleUrl: './flv-player.component.scss',
})
export class FlvPlayerComponent implements OnInit, OnDestroy, AfterViewInit,AfterContentInit {
  @Input() streamParams: StreamWithKeyParams | null = null;
  @ViewChild('player') player: ElementRef<HTMLVideoElement> | undefined;
  @Output() streamUrlEvent = new EventEmitter<string>();

  public streamErrorOccurred: boolean = false;
  public isStreamLoading: boolean = true;
  public latencyControl: 'slow' | 'normal' | 'ultra' = 'normal';
  public isSRTOrigin: boolean = false;

  public playerStats: Mpegts.MSEPlayerStatisticsInfo | undefined = undefined;
  public playerMediaInfo: Mpegts.MSEPlayerMediaInfo | undefined = undefined;

  private playerInstance: Mpegts.MSEPlayer | Mpegts.Player | null = null;

  constructor(
    private messageService: NzMessageService,
    private renderer: Renderer2
  ) {}


  ngOnInit(): void {
    if (!this.streamParams) {
      throw new Error('No stream params provided');
    }

    const isCompatible = this.checkBrowserCompatibility();
    if (!isCompatible) {
      this.messageService.error(
        'Your browser is not compatible with this player. Please use a different browser.'
      );
      this.streamErrorOccurred = true;
      throw new Error('Browser not compatible');
    }
    this.latencyControl = 'normal';
    // set this early so don't cause a re-render on view cycle
    if (this.streamParams.ingestMethod === IngestMethod.SRT) {
      this.latencyControl = 'slow';
      this.isSRTOrigin = true;
    }else{
      this.latencyControl = 'normal';
      this.isSRTOrigin = false;
    }
  }
  ngOnDestroy(): void {
    this.unloadPlayer();
  }

  ngAfterViewInit(): void {
    this.loadStreamPlayer();
  }

  ngAfterContentInit(): void {
    if (!this.streamParams) {
      throw new Error('No stream params provided');
    }

    // Embed default latency control
    if (this.streamParams.embed){
      this.latencyControl = 'normal';
    }
  }

  checkBrowserCompatibility = (): boolean => {
    if (!Mpegts.isSupported()) {
      return false;
    }
    const featureList = Mpegts.getFeatureList();
    if (!featureList.mseLivePlayback) {
      return false;
    }
    return true;
  };

  unloadPlayer = () => {
    this.streamErrorOccurred = false;
    this.isSRTOrigin = false;
    this.playerMediaInfo = undefined;
    this.playerStats = undefined;
    this.playerInstance?.pause();
    this.playerInstance?.unload();
    this.playerInstance?.detachMediaElement();
    this.playerInstance?.destroy();
    this.playerInstance = null;
  };

  loadStreamPlayer = async () => {
    if (!this.streamParams) {
      throw new Error('No stream params provided');
    }

    if (!Mpegts.isSupported()) {
      throw new Error('Browser not compatible');
    }

    if (!this.player) {
      throw new Error('No player element found');
    }

    const streamUrl = this.getStreamUrl(this.streamParams);
    this.streamUrlEvent.emit(streamUrl);

    const player = Mpegts.createPlayer(
      {
        type: 'flv',
        isLive: true,
        url: streamUrl,
      },
      {
        liveBufferLatencyChasing: this.latencyControl !== 'slow',
        enableStashBuffer: this.latencyControl !== 'ultra',
        lazyLoad: this.latencyControl !== 'ultra',
        stashInitialSize:
          this.latencyControl === 'slow' ? 1024 * 1024 : 512 * 1024,
        lazyLoadMaxDuration: this.latencyControl === 'slow' ? 60 : 30,
        headers: {
          'Transfer-Encoding': 'chunked',
          'X-Stream-Protocol': 'flv',
        }
      }
    );
    player.on(Mpegts.Events.ERROR, this.handlePlayerError);
    player.on(Mpegts.Events.METADATA_ARRIVED, this.handlePlayerLoaded);
    player.on(Mpegts.Events.STATISTICS_INFO, this.handleStats);
    player.on(Mpegts.Events.MEDIA_INFO, (info: Mpegts.MSEPlayerMediaInfo) => {
      this.playerMediaInfo = info;
      this.isStreamLoading = false;
    });
    this.playerInstance = player;
    player.attachMediaElement(this.player.nativeElement);
    player.load();


    // Embed Mode
    if (this.streamParams.embed) {
      console.log('requesting fullscreen');
      this.player.nativeElement.controls = true;
      this.player.nativeElement.classList.add('fill-page');
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
      (player.play() as Promise<void>)
      .catch(() => {
        this.messageService.warning('Auto play rejected by browser. Please click the video to start stream', {
          nzDuration: 5 * 1000
        });
      });


      this.player.nativeElement.requestFullscreen()
      .then(() => {
        console.log('fullscreen requested');
      })
      .catch((error) => {
        this.messageService.error('Error requesting fullscreen: ' + error);
      });
    }
  };

  getStreamUrl(streamParams: StreamWithKeyParams): string {
    //return `https://${environment.streamServer}/${streamParams.vhost}-${streamParams.room}/${streamParams.name}.flv`;
    const url = new URL(
      `https://${environment.streamServer}/live/${streamParams.category.name}-${streamParams.name}.flv`
    );
    url.searchParams.append('sign', streamParams.sign);
    url.searchParams.append('expire', streamParams.expire.toString());
    url.searchParams.append('start', streamParams.start.toString());
    url.searchParams.append('key', streamParams.viewKey);
    return url.toString();
  }

  handleReload = () => {
    this.isStreamLoading = true;
    this.unloadPlayer();
    this.loadStreamPlayer();
  };

  handlePlayerError = (error: any) => {
    console.error(error);
    this.messageService.error('Error:' + error);
    this.isStreamLoading = false;
    this.unloadPlayer();
    this.streamErrorOccurred = true;
  };

  handlePlayerLoaded = () => {
    this.isStreamLoading = false;
  };

  handleStats = () => {
    // @ts-expect-error - everything is fine....
    this.playerStats = this.playerInstance.statisticsInfo;
  };

  handleVideoElmClick = () => {
    if(this.streamParams?.embed){
      this.player?.nativeElement.play();
    }
  };
}

import {
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
import { CommonModule } from '@angular/common';
import { WebRTCPlayer } from '@eyevinn/webrtc-player';
import { environment } from '../../../../environments/environment';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Stream, Category } from '@prisma/client';
import { StreamWithKeyParams } from '../../../types/Stream';

// Expose access to the internal RTCPeerConnection object.
declare module '@eyevinn/webrtc-player' {
  interface WebRTCPlayer {
    peer?: RTCPeerConnection;
  }
}

interface RTCMediaReport {
  kind: 'audio' | 'video';
  packetsLost: number;
  jitter: number;
  totalProcessingDelay: number;
  framesPerSecond: number;
  framesDropped: number;
  framesDecoded: number;
}

@Component({
  selector: 'app-whep-player',
  standalone: true,
  imports: [
    CommonModule,
    NzAlertModule,
    NzSpinModule,
    NzButtonModule,
  ],
  templateUrl: './whep-player.component.html',
  styleUrl: './whep-player.component.scss',
})
export class WhepPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() streamParams: StreamWithKeyParams | null = null;
  @ViewChild('player') player: ElementRef<HTMLVideoElement> | undefined;
  @Output() streamUrlEvent = new EventEmitter<string>();

  public streamErrorOccurred: boolean = false;
  public isStreamLoading: boolean = true;
  private playerInstance: WebRTCPlayer | null = null;

  // stats
  public packetsLost: { audio: number; video: number } = {
    audio: 0,
    video: 0,
  };
  public loadingStatus = 0; // 0 = connecting to peer, 1 = initing peer, 2 = setting up channels, 3 =
  public bitrate: number = -1; // ms
  public rtt: number = -1; // kbps
  public droppedFrames: number = -1; // frames
  public FPS: number = -1; // frames
  public jitter: number = -1; // ms
  public calculatedDelay: number = -1; // ms
  public framesDecoded: number = -1; // frames

  public isIncompatibleBrowser = false;

  constructor() {}

  ngAfterViewInit(): void {
    this.loadStreamPlayer();
  }

  ngOnInit(): void {
    if (!this.streamParams) {
      throw new Error('No stream params provided');
    }
    // check if firefox
    if (navigator.userAgent.indexOf('Firefox') !== -1) {
      this.isIncompatibleBrowser = true;
    }
  }

  ngOnDestroy(): void {
    console.log('destroying whep player');
    this.playerInstance?.stop();
    this.playerInstance?.unload();
    this.playerInstance?.destroy();
  }


  loadStreamPlayer = () => {
    if (!this.streamParams) {
      throw new Error('No stream params provided');
    }

    if (!this.player) {
      throw new Error('No player element found');
    }

    const player = new WebRTCPlayer({
      video: this.player.nativeElement,
      type: 'whep',
      statsTypeFilter: '^candidate-*|^inbound-rtp',
      iceServers: [], // no client ICE candidates are needed
    });
    this.playerInstance = player;

    const streamUrl = this.getStreamUrl(this.streamParams);
    this.streamUrlEvent.emit(streamUrl);

    // Kick off the load process so `player.peer` is available.
    void player.load(new URL(streamUrl));

    this.isStreamLoading = true;
    this.loadingStatus = 0;

    player.peer?.addEventListener('connectionstatechange', () => {
      switch (player.peer?.connectionState) {
        case 'connecting':
          this.loadingStatus = 1;
          break;
        case 'connected':
          this.loadingStatus = 2;
          break;
      }
    });
    player.peer?.addEventListener('track', () => {
      this.loadingStatus = 3;
    });
    this.player.nativeElement.addEventListener('loadeddata', () => {
      this.isStreamLoading = false;
    });

    player.on('peer-connection-failed', this.playerErrorHandler);
    player.on('initial-connection-failed', this.playerErrorHandler);
    player.on('connect-error', this.playerErrorHandler);

    player.on('stats:candidate-pair', (report) => {
      this.rtt = Math.round(report.currentRoundTripTime * 1000);

      if (report.availableIncomingBitrate) {
        this.bitrate = Math.round(report.availableIncomingBitrate / 1000);
      }
    });

    player.on('stats:inbound-rtp', (report: RTCMediaReport) => {
      if (report.kind === 'video' || report.kind === 'audio') {
        this.packetsLost[report.kind] = report.packetsLost;
      }
      if (report.kind === 'video') {
        this.FPS = Math.round(report.framesPerSecond);
        this.droppedFrames = report.framesDropped;
        this.jitter = Math.round(report.jitter * 1000);
        this.calculatedDelay = (((report.totalProcessingDelay * 1000) / report.framesDecoded) + this.rtt) || 0;
      }
    });

    if (this.streamParams.embed) {
      this.player.nativeElement.classList.add('fill-page');
      this.player.nativeElement.requestFullscreen();
    }
  };

  playerErrorHandler = (err: any) => {
    console.error('Error occurred', err);
    this.isStreamLoading = false;
    this.streamErrorOccurred = true;
  };

  getStreamUrl(streamParams: StreamWithKeyParams, eip?: string): string {
    if (!streamParams) {
      throw new Error('No stream params provided');
    }
    if (streamParams.directLink) {
      return streamParams.directLink;
    }
    const url = new URL(`https://${environment.streamServer}/rtc/v1/whep/`);
    url.searchParams.set('app', `live`);
    if (streamParams.name === 'demo') {
      url.searchParams.set('stream', 'demo');
      url.searchParams.set('vhost', 'playback');
    }else{
      url.searchParams.set('stream', `${streamParams.category.name}-${streamParams.name}`);
    }
    url.searchParams.set('expire', streamParams.expire.toString());
    url.searchParams.set('sign', streamParams.sign);
    url.searchParams.set('start', streamParams.start.toString());
    url.searchParams.set('key', streamParams.viewKey);
    return url.toString();
  }

  handleReload = () => {
    window.location.reload();
  };
}

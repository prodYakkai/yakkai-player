import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from './../../../environments/environment';
import { ChangeDetectorRef, Component, OnDestroy, AfterContentInit, isDevMode, NgModule } from '@angular/core';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { IPBlockSlicePipe } from '../../pipes/ipblock-slice.pipe';
import { DoHResponse } from '../../types/DoHResponse';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-diagnostics',
  standalone: true,
  imports: [
    NzGridModule,
    CommonModule,
    IPBlockSlicePipe,
    NzTagModule
  ],
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.scss'
})
export class DiagnosticsComponent implements AfterContentInit, OnDestroy{

  constructor(
    private http: HttpClient,
    private ref: ChangeDetectorRef
  ) { }

  ngAfterContentInit(): void {
    this.logging = 'Diagnostics started at ' + new Date().toLocaleString() + '\n';
    this.getIPData();
    this.resolveServerIP();
    this.pingTimeTest(environment.apiServer + '/ping');
    this.pingTimeTest(environment.streamServer);
    this.pingTimeTest(environment.ingestSrcServer);
  }

  ngOnDestroy(): void {
  }

  public currentEnv = isDevMode() ? 'Development' : 'Production';
  public environment = environment;

  public ingestSrcServerIP: string = '';
  public streamServerIP: string = '';

  public myIP: string = '';
  public APIPingStatus: string = '';

  public logging: string = '';

  public testItems = {
    'API Server': 'P',
    'Stream Server': 'P',
    'Ingest Server': 'P',
    'ISP Prefix': 'P',
  }

  getIPData = () => {
    this.logging += 'Fetching ISP data\n';
    this.ref.detectChanges();
    this.http.get('https://api.ipify.org?format=json').subscribe((data: any) => {
      this.myIP = data.ip;
      this.logging += 'ISP prefix fetched successfully\n';
      this.testItems['ISP Prefix'] = 'O';
    }, (error) => {
      this.logging += 'error occurred while fetching isp ' + error + '\n';
      this.testItems['ISP Prefix'] = 'X';
    });
  }

  resolveServerIP = () =>{
    this.logging += 'Resolving target server ip via DoH\n';
    this.ref.detectChanges();
    // @ts-expect-error - DohResolver is not defined
    const resolver = new window.doh.DohResolver('https://cloudflare-dns.com/dns-query');
    resolver.query(environment.streamServer).then((response: DoHResponse)=>{
      if (response.rcode !== 'NOERROR') throw 'Invalid response code';
      this.streamServerIP = response.answers[0].data;
      this.logging += 'Stream server ip resolved with ' + response.rcode + '\n';
      this.testItems['Stream Server'] = 'O';
    }).catch((err:any) => {
      this.logging += 'error occurred while resolving stream sever ip ' + err + '\n';
      this.testItems['Stream Server'] = 'X';
    });
    resolver.query(environment.ingestSrcServer).then((response: DoHResponse)=>{
      if (response.rcode !== 'NOERROR') throw 'Invalid response code';
      this.ingestSrcServerIP = response.answers[0].data;
      this.logging += 'Ingest server ip resolved with ' + response.rcode + '\n';
      this.testItems['Ingest Server'] = 'O';
    }).catch((err:any) => {
      this.logging += 'error occurred while resolving ingest server ip ' + err + '\n';
      this.testItems['Ingest Server'] = 'X';
    });
  }

  pingTimeTest = (url: string) => {
    this.logging += 'Pinging ' + url + '\n';
    this.ref.detectChanges();
    const start = performance.now();
    this.http.options(url).subscribe((data: any) => {
      this.logging += `Ping (${url}) successful in ${Math.round(performance.now() - start)} ms\n`;
    }, (error) => {
      this.logging += `Ping (${url}) failed in ${Math.round(performance.now() - start)} ms\n`;
    });
  }

}

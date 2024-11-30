import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhepPlayerComponent } from './whep-player.component';

describe('WhepPlayerComponent', () => {
  let component: WhepPlayerComponent;
  let fixture: ComponentFixture<WhepPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhepPlayerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhepPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

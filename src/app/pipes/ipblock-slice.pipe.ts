import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'iPBlockSlice',
  standalone: true
})
export class IPBlockSlicePipe implements PipeTransform {

  transform(value: string, bits: number = 8): string {
    if (!value) return value;

    const segments = value.split('.');
    if (segments.length !== 4) return 'Invalid IP'; // Simple validation for IPv4

    const segmentCount = bits / 8;
    if (segmentCount < 1 || segmentCount > 3 || bits % 8 !== 0) {
      return 'Invalid bit count'; // Ensures bits are either 8, 16, or 24
    }

    return segments.slice(0, segmentCount).join('.');
  }

}

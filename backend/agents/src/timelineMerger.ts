// /agents/timelineMerger.ts
import _ from 'lodash';
import { EvidenceItem } from './types';

export function mergeTimelines(items: EvidenceItem[]): EvidenceItem[] {
  return _.uniqBy(
    _.sortBy(items, 'timestamp'),
    item => item.excerpt + item.sourceUrl
  );
}

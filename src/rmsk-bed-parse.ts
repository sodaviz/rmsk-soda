import * as soda from '@sodaviz/soda';
import {
  RmskAnnConfig,
  RmskAnnotation, RmskAnnotationGroup,
} from "./rmsk-annotation";
import {RmskRecord} from "./rmsk-record";

export function RmskBedParse(rmskObj: RmskRecord): RmskAnnotationGroup {
  let ann: RmskAnnotation[] = [];

  let nameSplit = rmskObj.name.split('#');
  let subfamilyName = nameSplit[0];
  let className = "";
  let familyName = "";
  if (nameSplit.length > 1) {
    let subSplit = nameSplit[1].split('/');
    className = subSplit[0] || "";
    familyName = subSplit[1] || "";
  }

  let repeatBlocks: [number, number, string][] = [];
  let firstSize = rmskObj.blockSizes[0];
  let firstStart = rmskObj.blockStarts[0];

  if (firstSize > 0 && firstStart == -1) {
    repeatBlocks.push([firstSize, 0, 'left-unaligned']);
  }

  // make sure the left unaligned flank is added before the label
  repeatBlocks.push([500, firstStart - 500, 'label']);

  let lastSize = rmskObj.blockSizes[rmskObj.blockCount - 1];
  let lastStart = rmskObj.blockStarts[rmskObj.blockCount - 1];
  let penultimateEnd = rmskObj.blockSizes[rmskObj.blockCount - 2] + rmskObj.blockStarts[rmskObj.blockCount - 2];
  if (lastSize > 0 && lastStart == -1) {
    repeatBlocks.push([lastSize, penultimateEnd, 'right-unaligned']);
  }

  // TODO: can this logic be simplified?
  for (let i = 1; i < rmskObj.blockCount - 1; i++) {
    // we start at the second position, since we should be able to deal with the first
    // block the same way every time and prevent the issue of trying to look back to -1
    let currentSize = rmskObj.blockSizes[i];
    let currentStart = rmskObj.blockStarts[i];
    if (currentStart >= 0) {
      // we have an aligned block
      repeatBlocks.push([currentSize, currentStart, 'aligned']);
    } else {
      // we have an unaligned block
      let prevSize = rmskObj.blockSizes[i - 1];
      let prevStart = rmskObj.blockStarts[i - 1];
      let nextStart = rmskObj.blockStarts[i + 1];

      let prevEnd = prevStart + prevSize;
      let gapSize = nextStart - prevEnd;

      if (currentSize > 0) {
        // the unaligned block has a size, so that means we need to figure out its size
        // and position relative to the previous and next blocks

        // first check if the unaligned block is larger than the gap
        if (gapSize < currentSize) {
          let overlapSize = (currentSize - gapSize) / 2;
          let adjStart = prevEnd - overlapSize;
          let leftJoinStart = prevEnd + 1;
          let rightJoinStart = nextStart + overlapSize;
          repeatBlocks.push([currentSize, adjStart, 'inner-unaligned']);
          repeatBlocks.push([-overlapSize, leftJoinStart, 'left-joining']);
          repeatBlocks.push([-overlapSize, rightJoinStart, 'right-joining']);
        } else {
          let joinSize = (gapSize - currentSize) / 2;
          let unalignedAdjStart = prevEnd + joinSize;
          let leftJoinStart = prevEnd + 1;
          let rightJoinStart = unalignedAdjStart + currentSize;
          repeatBlocks.push([currentSize, unalignedAdjStart, 'inner-unaligned']);
          repeatBlocks.push([joinSize, leftJoinStart, 'left-joining']);
          repeatBlocks.push([joinSize, rightJoinStart, 'right-joining']);
        }
      } else {
        // the unaligned block has no size, so that means this is only a join, but we
        // need to know if it overlaps the previous and/or next blocks
        let joinSize = (gapSize - currentSize) / 2;
        // when there is overlap, currentSize will be negative
        let leftStart = Math.max(0, prevEnd + currentSize);
        let rightStart = leftStart + joinSize;
        repeatBlocks.push([joinSize, leftStart, 'left-joining']);
        repeatBlocks.push([joinSize, rightStart, 'right-joining']);
      }
    }
  }

  for (const [i, [w, x, type]] of repeatBlocks.entries()) {
    let conf: RmskAnnConfig = {
      id: `${rmskObj.id}.${i}`,
      start: rmskObj.chromStart + x - 1,
      width: w,
      type: type,
      className: className,
      familyName: familyName,
      subfamilyName: subfamilyName,
      score: rmskObj.score,
      strand: rmskObj.strand,
    }
    ann.push(new RmskAnnotation(conf));
  }

  let groupConf: soda.AnnotationGroupConfig<RmskAnnotation> = {
    id: `group.${rmskObj.id}`,
    group: ann,
    start: rmskObj.chromStart,
    width: rmskObj.chromEnd - rmskObj.chromStart,
  }

  return new RmskAnnotationGroup(groupConf);
}

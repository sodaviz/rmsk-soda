import * as soda from '@sodaviz/soda'

/**
 * The custom Annotation interface for joined RepeatMasker records
 */
export interface RmskAnnotation extends soda.Annotation {
  type: string;
  className: string;
  familyName: string;
  subfamilyName: string;
  score: number;
  orientation: soda.Orientation;
}

/**
 * The custom AnnotationGroup object that keep track of aligned width.
 */
export class RmskAnnotationGroup extends soda.AnnotationGroup<RmskAnnotation> {
  alignedStart: number;
  alignedEnd: number;
  alignedWidth: number;

  constructor(conf: soda.AnnotationGroupConfig<RmskAnnotation>) {
    super(conf)
    this.alignedStart = this.annotations.filter((ann) => ann.type == 'aligned')
      .reduce((prev, curr) => prev.start < curr.start ? prev : curr).start;
    this.alignedEnd = this.annotations.filter((ann) => ann.type == 'aligned')
      .reduce((prev, curr) => prev.end > curr.end ? prev : curr).end;
    this.alignedWidth = this.alignedEnd - this.alignedStart;
  }
}

import * as soda from '@sodaviz/soda'

export interface RmskAnnConfig extends soda.AnnotationConfig {
  type: string,
  className: string,
  familyName: string,
  subfamilyName: string,
  score: number,
  strand: string,
}

/**
 * The custom Annotation object for joined RepeatMasker records
 */
export class RmskAnnotation extends soda.Annotation {
  readonly type: string;
  readonly className: string;
  readonly familyName: string;
  readonly subfamilyName: string;
  readonly score: number;
  readonly orientation: soda.Orientation;

  constructor(config: RmskAnnConfig) {
    super(config);
    this.type = config.type;
    this.className = config.className;
    this.familyName = config.familyName;
    this.subfamilyName = config.subfamilyName;
    this.score = config.score;
    if (config.strand == '+') {
      this.orientation = soda.Orientation.Forward;
    } else {
      this.orientation = soda.Orientation.Reverse;
    }
  }
}

export class RmskAnnotationGroup extends soda.AnnotationGroup<RmskAnnotation> {
  alignedX: number;
  alignedX2: number;
  alignedW: number;

  constructor(conf: soda.AnnotationConfig) {
    super(conf)
    this.alignedX = this.group.filter((ann) => ann.type == 'aligned')
      .reduce((prev, curr) => prev.x < curr.x ? prev : curr).x;
    this.alignedX2 = this.group.filter((ann) => ann.type == 'aligned')
      .reduce((prev, curr) => prev.x2 > curr.x2 ? prev : curr).x2;
    this.alignedW = this.alignedX2 - this.alignedX;
  }
}

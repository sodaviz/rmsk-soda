import * as d3 from 'd3';
import * as soda from '@sodaviz/soda';
import {RmskAnnotation, RmskAnnotationGroup} from "./rmsk-annotation";
import {RmskRecord} from "./rmsk-record";
import {RmskBedParse} from "./rmsk-bed-parse";

export interface RmskRenderParams extends soda.RenderParams {
  annotations?: RmskAnnotation[];
}

export interface RmskQueryConfig {
  chromosome: string,
  start: number,
  end: number,
}

export class RmskChart extends soda.Chart<RmskRenderParams> {
  divergenceColorScale: d3.ScaleSequential<string>;
  classColorScale: d3.ScaleOrdinal<string, string>;
  densityColorScale: d3.ScaleSequential<string>;

  constructor(config: soda.ChartConfig<RmskRenderParams>) {
    super(config);
    // I arbitrarily set the color scale between scores 0 and 7000 from the field in the rmsk table
    this.divergenceColorScale = d3.scaleSequential(d3.interpolateGreys)
      // TODO: magic numbers are bad
      .domain([0, 7000]);
    let repeatClasses = ['SINE', 'LINE', 'LTR', 'DNA', 'Simple', 'Low_complexity', 'Satellite', 'RNA', 'Other', 'Unknown'];
    this.classColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(repeatClasses);
    this.densityColorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, .1]);

    this.inRender = function (this, params): void {
      let aligned, leftUnaligned, rightUnaligned, innerUnaligned, leftJoining, rightJoining, labels;
      if (params.annotations !== undefined) {
        aligned = params.annotations.filter((a) => a.type == 'aligned');
        leftUnaligned = params.annotations.filter((a) => a.type == 'left-unaligned');
        rightUnaligned = params.annotations.filter((a) => a.type == 'right-unaligned');
        innerUnaligned = params.annotations.filter((a) => a.type == 'inner-unaligned');
        leftJoining = params.annotations.filter((a) => a.type == 'left-joining');
        rightJoining = params.annotations.filter((a) => a.type == 'right-joining');
        labels = params.annotations.filter((a) => a.type == 'label');

        soda.chevronRectangle({
          chart: this,
          annotations: aligned,
          selector: 'aligned',
          y: (d) => d.a.y * d.c.rowHeight + d.c.rowHeight / 2,
          height: (d) => d.c.rowHeight / 2,
          orientation: (d) => d.a.orientation,
          strokeColor: (d) => d.c.classColorScale(d.a.className),
          fillColor: (d) => d.c.divergenceColorScale(7000 - d.a.score)!,
          chevronStrokeColor: "#F9F6EE",
          chevronSpacing: 5,
        });

        soda.line({
          chart: this,
          annotations: leftUnaligned,
          selector: 'left-unaligned',
          y: (d) => (d.a.y + 1) * d.c.rowHeight - d.c.rowHeight / 4,
          strokeDashArray: "3, 3",
          strokeColor: (d) => d.c.classColorScale(d.a.className),
        });

        soda.line({
          chart: this,
          annotations: leftUnaligned,
          selector: 'left-endpoint',
          x1: (d) => d.c.xScale(d.a.x)!,
          x2: (d) => d.c.xScale(d.a.x)!,
          x: (d) => d.a.x,
          y1: (d) => (d.a.y + 1) * d.c.rowHeight,
          y2: (d) => (d.a.y + 1) * d.c.rowHeight - d.c.rowHeight / 2,
          strokeColor: (d) => d.c.classColorScale(d.a.className),
        });

        soda.line({
          chart: this,
          annotations: rightUnaligned,
          selector: 'right-unaligned',
          strokeDashArray: "3, 3",
          y: (d) => (d.a.y + 1) * d.c.rowHeight - d.c.rowHeight / 4,
          strokeColor: (d) => d.c.classColorScale(d.a.className),
        });

        soda.line({
          chart: this,
          annotations: rightUnaligned,
          selector: 'right-endpoint',
          x1: (d) => d.c.xScale(d.a.x2)!,
          x2: (d) => d.c.xScale(d.a.x2)!,
          y1: (d) => (d.a.y + 1) * d.c.rowHeight,
          y2: (d) => (d.a.y + 1) * d.c.rowHeight - d.c.rowHeight / 2,
          strokeColor: (d) => d.c.classColorScale(d.a.className),
        });

        soda.line({
          chart: this,
          annotations: innerUnaligned,
          selector: 'inner-unaligned',
          strokeDashArray: () => "3, 3",
          y: (d) => d.a.y * d.c.rowHeight + d.c.rowHeight / 4,
        });

        soda.line({
          chart: this,
          annotations: leftJoining,
          selector: 'left-join',
          y1: (d) => d.a.y * d.c.rowHeight + d.c.rowHeight / 2,
          y2: (d) => d.a.y * d.c.rowHeight + d.c.rowHeight / 4,
        });

        soda.line({
          chart: this,
          annotations: rightJoining,
          selector: 'right-join',
          y1: (d) => d.a.y * d.c.rowHeight + d.c.rowHeight / 4,
          y2: (d) => d.a.y * d.c.rowHeight + d.c.rowHeight / 2,
        });

        soda.text({
          chart: this,
          annotations: labels,
          selector: 'label',
          textAnchor: 'end',
          x: (d) => d.c.xScale(d.a.x + d.a.w) - 1,
          y: (d) => (d.a.y + 0.45) * d.c.rowHeight,
          textFn: (a) => [
            `${a.subfamilyName}#${a.className}/${a.familyName}`,
            `${a.subfamilyName}#${a.className}...`,
            `${a.subfamilyName}...`
          ]
        });

        soda.tooltip({
          chart: this,
          annotations: aligned,
          text: (d) =>
            `${d.a.subfamilyName}#${d.a.className}/${d.a.familyName}: ${d.a.id}`,
        });
      }
    }
  }

  query(config: RmskQueryConfig) {
    let promise: Promise<RmskRecord[]> = fetch(
      `https://sodaviz.org/RMSKData/current/${config.chromosome}/range?start=${config.start}&end=${config.end}`
    )
      .then((response) => response.json())

    promise.then((records) => this.buildAnnotations(records))
      .then((annotations) => this.render({
        annotations,
        start: config.start,
        end: config.end,
        rowCount: Math.max(...annotations.map((a) => a.row)) + 2
      }));
  }

  buildAnnotations(records: RmskRecord[]): RmskAnnotation[] {
    let groups: RmskAnnotationGroup[] = records.map((r) => RmskBedParse(r));
    let nLayers = soda.greedyGraphLayout(groups, 0, alignedWidthSort);
    let annotations: RmskAnnotation[] = [];
    for (const group of groups) {
      annotations = annotations.concat(group.group);
    }

    for (let layer = 0; layer < nLayers; layer++) {
      let annInLayer = annotations.filter((a) => a.y == layer);
      for (const [i, ann] of annInLayer.entries()) {
        if (ann.type == 'label') {
          let leftNeighbor = annInLayer[i - 1];
          let freeSpace = 10000;
          if (leftNeighbor) {
            freeSpace = ann.x - leftNeighbor.x2 - 1;
          } else {
            ann.x -= freeSpace;
            ann.w += freeSpace;
          }
        }
      }
    }

    return annotations;
  }
}

function alignedWidthSort(verts: string[], graph: soda.AnnotationGraph<RmskAnnotationGroup>) {
  verts.sort((v1: string, v2: string) => {
    if (graph.getAnnotationFromId(v1).alignedW > graph.getAnnotationFromId(v2).alignedW) {
      return -1;
    } else {
      return 1;
    }
  });
}


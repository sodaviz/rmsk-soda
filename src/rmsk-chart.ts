import * as d3 from 'd3';
import * as soda from '@sodaviz/soda';
import {RmskAnnotation, RmskAnnotationGroup} from "./rmsk-annotation";
import {RmskRecord} from "./rmsk-record";
import {RmskBedParse} from "./rmsk-bed-parse";

export interface RmskRenderParams extends soda.RenderParams {
  annotations: RmskAnnotationGroup[];
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
      .domain([0, 7000]);
    let repeatClasses = ['SINE', 'LINE', 'LTR', 'DNA', 'Simple', 'Low_complexity', 'Satellite', 'RNA', 'Other', 'Unknown'];
    this.classColorScale = d3.scaleOrdinal(d3.schemeCategory10)
      .domain(repeatClasses);
    this.densityColorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, .1]);

    this.updateLayout = function (this, params): void {
      let layout = soda.greedyGraphLayout(params.annotations, 0, alignedWidthSort);
      for (const group of params.annotations) {
        for (const ann of group.annotations) {
          layout.rowMap.set(ann.id, layout.rowMap.get(group.id)!)
        }
      }
      layout.rowCount++;
      this.layout = layout;
    }

    this.draw = function (this, params): void {
      this.addAxis();

      let allAnnotations = params.annotations.reduce<RmskAnnotation[]>((prev, curr) => prev.concat(curr.annotations), [])
      let aligned = allAnnotations.filter((a) => a.type == 'aligned');
      let leftUnaligned = allAnnotations.filter((a) => a.type == 'left-unaligned');
      let rightUnaligned = allAnnotations.filter((a) => a.type == 'right-unaligned');
      let innerUnaligned = allAnnotations.filter((a) => a.type == 'inner-unaligned');
      let leftJoining = allAnnotations.filter((a) => a.type == 'left-joining');
      let rightJoining = allAnnotations.filter((a) => a.type == 'right-joining');
      let labels = allAnnotations.filter((a) => a.type == 'label');

      for (let layer = 0; layer < this.layout.rowCount; layer++) {
        let annInLayer = allAnnotations.filter((a) => this.layout.row({a, c: this}) == layer);
        annInLayer = annInLayer.sort((a, b) => a.start > b.start ? 1 : -1)
        for (const [i, ann] of annInLayer.entries()) {
          if (ann.type == 'label') {
            let leftNeighbor = annInLayer[i - 1];
            if (leftNeighbor != undefined) {
              ann.start = leftNeighbor.end + 1;
            } else {
              ann.start -= 10000;
            }
          }
        }
      }
      
      soda.chevronRectangle({
        chart: this,
        annotations: aligned,
        selector: 'aligned',
        y: (d) => d.c.layout.row(d) * d.c.rowHeight + d.c.rowHeight / 2,
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
        y: (d) => (d.c.layout.row(d) + 1) * d.c.rowHeight - d.c.rowHeight / 4,
        strokeDashArray: "3, 3",
        strokeColor: (d) => d.c.classColorScale(d.a.className),
      });

      soda.line({
        chart: this,
        annotations: leftUnaligned,
        selector: 'left-endpoint',
        x1: (d) => d.c.xScale(d.a.start)!,
        x2: (d) => d.c.xScale(d.a.start)!,
        x: (d) => d.a.start,
        y1: (d) => (d.c.layout.row(d) + 1) * d.c.rowHeight,
        y2: (d) => (d.c.layout.row(d) + 1) * d.c.rowHeight - d.c.rowHeight / 2,
        strokeColor: (d) => d.c.classColorScale(d.a.className),
      });

      soda.line({
        chart: this,
        annotations: rightUnaligned,
        selector: 'right-unaligned',
        strokeDashArray: "3, 3",
        y: (d) => (d.c.layout.row(d) + 1) * d.c.rowHeight - d.c.rowHeight / 4,
        strokeColor: (d) => d.c.classColorScale(d.a.className),
      });

      soda.line({
        chart: this,
        annotations: rightUnaligned,
        selector: 'right-endpoint',
        x1: (d) => d.c.xScale(d.a.end)!,
        x2: (d) => d.c.xScale(d.a.end)!,
        y1: (d) => (d.c.layout.row(d) + 1) * d.c.rowHeight,
        y2: (d) => (d.c.layout.row(d) + 1) * d.c.rowHeight - d.c.rowHeight / 2,
        strokeColor: (d) => d.c.classColorScale(d.a.className),
      });

      soda.line({
        chart: this,
        annotations: innerUnaligned,
        selector: 'inner-unaligned',
        strokeDashArray: () => "3, 3",
        y: (d) => d.c.layout.row(d) * d.c.rowHeight + d.c.rowHeight / 4,
      });

      soda.line({
        chart: this,
        annotations: leftJoining,
        selector: 'left-join',
        y1: (d) => d.c.layout.row(d) * d.c.rowHeight + d.c.rowHeight / 2,
        y2: (d) => d.c.layout.row(d) * d.c.rowHeight + d.c.rowHeight / 4,
      });

      soda.line({
        chart: this,
        annotations: rightJoining,
        selector: 'right-join',
        y1: (d) => d.c.layout.row(d) * d.c.rowHeight + d.c.rowHeight / 4,
        y2: (d) => d.c.layout.row(d) * d.c.rowHeight + d.c.rowHeight / 2,
      });
        
      soda.dynamicText({
        chart: this,
        annotations: labels,
        selector: 'label',
        textAnchor: 'end',
        x: (d) => d.c.xScale(d.a.end) - 1,
        y: (d) => (d.c.layout.row(d) + 0.45) * d.c.rowHeight,
        text: (d) => [
          `${d.a.subfamilyName}#${d.a.className}/${d.a.familyName}`,
          `${d.a.subfamilyName}#${d.a.className}...`,
          `${d.a.subfamilyName}...`
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

  query(config: RmskQueryConfig) {
    fetch(`https://sodaviz.org/data/rmsk/${config.chromosome}/${config.start}/${config.end}`)
      .then((response) => response.json())
      .then((records: RmskRecord[]) => records.map((r) => RmskBedParse(r)))
      .then((annotations) => {
        this.render({
          annotations,
          start: config.start,
          end: config.end
        })
      })
  }
}

function alignedWidthSort(verts: string[], graph: soda.AnnotationGraph<RmskAnnotationGroup>) {
  verts.sort((v1: string, v2: string) => {
    if (graph.getAnnotationFromId(v1).alignedWidth > graph.getAnnotationFromId(v2).alignedWidth) {
      return -1;
    } else {
      return 1;
    }
  });
}

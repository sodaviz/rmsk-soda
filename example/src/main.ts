import * as rmsk from '@sodaviz/rmsk-soda';
import {Spinner} from "spin.js";

let spinner = new Spinner({
  color: "cadetblue",
  position: "relative",
  top: "100px",
})

let chart = new rmsk.RmskChart({
  selector: "#charts",
  zoomable: true,
  resizable: true,
  axisType: rmsk.internalSoda.AxisType.Bottom,
  rowHeight: 16,
  postRender(): void {
    this.defaultPostRender();
    spinner.stop();
  }
})

initButtons();
checkUrl();

function submitQuery() {
  let chromosome = (<HTMLInputElement>document.getElementById('chromosome')).value;
  let start = parseInt((<HTMLInputElement>document.getElementById('start')).value);
  let end = parseInt((<HTMLInputElement>document.getElementById('end')).value);
  setUrl(chromosome, `${start}`, `${end}`);
  spinner.spin(document.getElementById("charts")!);
  chart.query({
    chromosome,
    start,
    end
  });
}

function setUrl(chr: string, start: string, end: string): void {
  let params = new URLSearchParams(location.search);
  params.set('chromosome', chr);
  params.set('start', start);
  params.set('end', end);
  window.history.replaceState({}, '', `${location.pathname}?${params}`);
}

function checkUrl(): void {
  let queryString = window.location.search;
  let urlParams = new URLSearchParams(queryString);

  let chrSet = false;
  let startSet = false;
  let endSet = false;

  let chromosome = urlParams.get('chromosome');
  if (chromosome !== null) {
    let chromInput = <HTMLInputElement>document.getElementById('chromosome');
    if (chromInput !== undefined) {
      chromInput.value = chromosome;
      chrSet = true;
    } else {
      throw("Can't find chromosome input");
    }
  }

  let start = urlParams.get('start');
  if (start !== null) {
    let startInput = <HTMLInputElement>document.getElementById('start');
    if (startInput !== undefined) {
      startInput.value = start;
      startSet = true;
    } else {
      throw("Can't find start input");
    }
  }

  let end = urlParams.get('end');
  if (end !== null) {
    let endInput = <HTMLInputElement>document.getElementById('end');
    if (endInput !== undefined) {
      endInput.value = end;
      endSet = true;
    } else {
      throw("Can't find end input");
    }
  }

  if (chrSet && startSet && endSet) {
    submitQuery();
  }
}

let collapsibleElements = document.getElementsByClassName("collapsible");
for (let i = 0; i < collapsibleElements.length; i++) {
  collapsibleElements[i].addEventListener("click", function (this: any) {
    this.classList.toggle("active");
    let content = this.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}

function initButtons(): void {
  let submitButton = document.getElementById('submit-query')!;
  if (submitButton !== undefined) {
    submitButton.addEventListener('click', submitQuery);
  } else {
    throw("Can't find submit button");
  }

  let resetButton = document.getElementById('reset')!;
  if (resetButton !== undefined) {
    resetButton.addEventListener('click', reset);
  } else {
    throw("Can't find reset button");
  }

  let exampleButton = document.getElementById('example')!;
  if (exampleButton !== undefined) {
    exampleButton.addEventListener('click', example);
  } else {
    throw("Can't find example button");
  }
}

function example() {
  (<HTMLInputElement>document.getElementById('chromosome')).value = 'chr10';
  (<HTMLInputElement>document.getElementById('start')).value = '294000';
  (<HTMLInputElement>document.getElementById('end')).value = '299000';
}

function reset() {
  (<HTMLInputElement>document.getElementById('chromosome')).value = 'chr1';
  (<HTMLInputElement>document.getElementById('start')).value = '';
  (<HTMLInputElement>document.getElementById('end')).value = '';
  setUrl('1', '', '');
}

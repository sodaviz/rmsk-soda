# rmsk-soda

>A [SODA](https://sodaviz.org/) visualization for Transposable Elements repeats as annotated by [RepeatMasker](https://www.repeatmasker.org/).

## About

This project is an NPM package that provides some extensions to SODA that produce an interactive visualization of Transposable Elements and simple repeats.
It is largely a reimplementation of the
[UCSC Genome Browser RepeatMasker Viz track](https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&lastVirtModeType=default&lastVirtModeExtraState=&virtModeType=default&virtMode=0&nonVirtPosition=&position=chrX%3A15581309%2D15586945&hgsid=1073096573_yCC1YP3xvlq1aT9RTr4PBTsocket) with improved functionality.
The example application can be found live on the [soda website](https://sodaviz.org/rmsk-soda.html).

## Usage

The easiest way to use rmsk-soda is with the [NPM package manager](https://www.npmjs.com/get-npm).

Once you have NPM installed, you can install rmsk-soda with:

    npm install @sodaviz/rmsk-soda

If you would like to run the rmsk-soda example application locally, clone the repository and run:

    npm i 
    make build
    cd example
    npm i
    make serve

/**
 * Plotly.js Type Declarations
 *
 * Provides TypeScript type definitions for plotly.js-dist-min
 */

declare module 'plotly.js-dist-min' {
  export function newPlot(
    root: HTMLElement | string,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
  ): Promise<PlotlyHTMLElement>;

  export function react(
    root: HTMLElement | string,
    data: Data[],
    layout?: Partial<Layout>,
    config?: Partial<Config>
  ): Promise<PlotlyHTMLElement>;

  export function purge(root: HTMLElement | string): void;

  export function relayout(
    root: HTMLElement | string,
    layout: Partial<Layout>
  ): Promise<PlotlyHTMLElement>;

  export const Plots: {
    resize(root: HTMLElement | string): void;
  };

  export interface PlotlyHTMLElement extends HTMLElement {
    on(event: string, callback: (data: any) => void): void;
    removeAllListeners(event: string): void;
  }

  export interface Data {
    type?: string;
    x?: any[];
    y?: any[];
    z?: any[];
    text?: string | string[];
    textposition?: string;
    name?: string;
    marker?: Partial<Marker>;
    line?: Partial<Line>;
    hoverinfo?: string;
    hovertext?: string | string[];
    hovertemplate?: string | string[];
    customdata?: any[];
    orientation?: 'v' | 'h';
    mode?: string;
    fill?: string;
    fillcolor?: string;
    visible?: boolean | 'legendonly';
    showlegend?: boolean;
    legendgroup?: string;
    opacity?: number;
    base?: number | number[];
    width?: number | number[];
    offset?: number | number[];
    offsetgroup?: string;
    textfont?: Partial<Font>;
    insidetextfont?: Partial<Font>;
    outsidetextfont?: Partial<Font>;
    hole?: number;
    pull?: number | number[];
    labels?: string[];
    values?: number[];
    domain?: Partial<Domain>;
    sort?: boolean;
    direction?: 'clockwise' | 'counterclockwise';
    rotation?: number;
    textinfo?: string;
  }

  export interface Marker {
    color?: string | string[] | number[];
    colorscale?: string | [number, string][];
    size?: number | number[];
    symbol?: string | string[];
    line?: Partial<Line>;
    opacity?: number | number[];
    showscale?: boolean;
    colorbar?: Partial<ColorBar>;
  }

  export interface Line {
    color?: string;
    width?: number;
    dash?: string;
    shape?: string;
  }

  export interface Font {
    family?: string;
    size?: number;
    color?: string;
  }

  export interface Domain {
    x?: [number, number];
    y?: [number, number];
    row?: number;
    column?: number;
  }

  export interface ColorBar {
    title?: string | { text: string };
    thickness?: number;
    len?: number;
    x?: number;
    y?: number;
  }

  export interface Layout {
    title?: string | { text: string; font?: Partial<Font> };
    xaxis?: Partial<Axis>;
    yaxis?: Partial<Axis>;
    margin?: Partial<Margin>;
    showlegend?: boolean;
    legend?: Partial<Legend>;
    barmode?: 'stack' | 'group' | 'overlay' | 'relative';
    bargap?: number;
    bargroupgap?: number;
    hovermode?: 'closest' | 'x' | 'y' | 'x unified' | 'y unified' | false;
    hoverlabel?: Partial<HoverLabel>;
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    font?: Partial<Font>;
    autosize?: boolean;
    width?: number;
    height?: number;
    annotations?: Partial<Annotation>[];
    shapes?: Partial<Shape>[];
    dragmode?: string | false;
  }

  export interface Axis {
    title?: string | { text: string; font?: Partial<Font> };
    type?: 'linear' | 'log' | 'date' | 'category' | 'multicategory';
    range?: [any, any];
    autorange?: boolean | 'reversed';
    tickmode?: 'auto' | 'linear' | 'array';
    tickvals?: any[];
    ticktext?: string[];
    tickangle?: number;
    tickfont?: Partial<Font>;
    showgrid?: boolean;
    gridcolor?: string;
    gridwidth?: number;
    zeroline?: boolean;
    zerolinecolor?: string;
    showline?: boolean;
    linecolor?: string;
    linewidth?: number;
    showticklabels?: boolean;
    tickformat?: string;
    categoryorder?: string;
    categoryarray?: string[];
    fixedrange?: boolean;
    automargin?: boolean;
    color?: string;
    rangemode?: 'normal' | 'tozero' | 'nonnegative';
  }

  export interface Margin {
    l?: number;
    r?: number;
    t?: number;
    b?: number;
    pad?: number;
  }

  export interface Legend {
    x?: number;
    y?: number;
    xanchor?: 'auto' | 'left' | 'center' | 'right';
    yanchor?: 'auto' | 'top' | 'middle' | 'bottom';
    bgcolor?: string;
    bordercolor?: string;
    borderwidth?: number;
    font?: Partial<Font>;
    orientation?: 'v' | 'h';
    traceorder?: string;
  }

  export interface HoverLabel {
    bgcolor?: string;
    bordercolor?: string;
    font?: Partial<Font>;
  }

  export interface Annotation {
    text?: string;
    x?: any;
    y?: any;
    xref?: string;
    yref?: string;
    showarrow?: boolean;
    arrowhead?: number;
    ax?: number;
    ay?: number;
    font?: Partial<Font>;
    align?: 'left' | 'center' | 'right';
    bgcolor?: string;
    bordercolor?: string;
    borderpad?: number;
    borderwidth?: number;
    opacity?: number;
  }

  export interface Shape {
    type?: 'circle' | 'rect' | 'path' | 'line';
    x0?: any;
    y0?: any;
    x1?: any;
    y1?: any;
    xref?: string;
    yref?: string;
    line?: Partial<Line>;
    fillcolor?: string;
    opacity?: number;
    layer?: 'below' | 'above';
  }

  export interface Config {
    responsive?: boolean;
    displayModeBar?: boolean | 'hover';
    displaylogo?: boolean;
    modeBarButtonsToRemove?: string[];
    modeBarButtonsToAdd?: any[];
    toImageButtonOptions?: {
      format?: 'png' | 'svg' | 'jpeg' | 'webp';
      filename?: string;
      height?: number;
      width?: number;
      scale?: number;
    };
    scrollZoom?: boolean;
    editable?: boolean;
    staticPlot?: boolean;
  }
}

/**
 * Global Plotly namespace declarations
 *
 * For use with global Plotly types in chart source files
 */
declare namespace Plotly {
  export interface Data {
    type?: string;
    x?: any[];
    y?: any[];
    z?: any[];
    text?: string | string[];
    textposition?: string;
    name?: string;
    marker?: Partial<Marker>;
    line?: Partial<Line>;
    hoverinfo?: string;
    hovertext?: string | string[];
    hovertemplate?: string | string[];
    customdata?: any[];
    orientation?: 'v' | 'h';
    mode?: string;
    fill?: string;
    fillcolor?: string;
    visible?: boolean | 'legendonly';
    showlegend?: boolean;
    legendgroup?: string;
    opacity?: number;
    base?: number | number[];
    width?: number | number[];
    offset?: number | number[];
    offsetgroup?: string;
    textfont?: Partial<Font>;
    insidetextfont?: Partial<Font>;
    outsidetextfont?: Partial<Font>;
    hole?: number;
    pull?: number | number[];
    labels?: string[];
    values?: number[];
    domain?: Partial<Domain>;
    sort?: boolean;
    direction?: 'clockwise' | 'counterclockwise';
    rotation?: number;
    textinfo?: string;
  }

  export interface Marker {
    color?: string | string[] | number[];
    colorscale?: string | [number, string][];
    size?: number | number[];
    symbol?: string | string[];
    line?: Partial<Line>;
    opacity?: number | number[];
    showscale?: boolean;
    colorbar?: Partial<ColorBar>;
  }

  export interface Line {
    color?: string;
    width?: number;
    dash?: string;
    shape?: string;
  }

  export interface Font {
    family?: string;
    size?: number;
    color?: string;
  }

  export interface Domain {
    x?: [number, number];
    y?: [number, number];
    row?: number;
    column?: number;
  }

  export interface ColorBar {
    title?: string | { text: string };
    thickness?: number;
    len?: number;
    x?: number;
    y?: number;
  }

  export interface Layout {
    title?: string | { text: string; font?: Partial<Font> };
    xaxis?: Partial<Axis>;
    yaxis?: Partial<Axis>;
    margin?: Partial<Margin>;
    showlegend?: boolean;
    legend?: Partial<Legend>;
    barmode?: 'stack' | 'group' | 'overlay' | 'relative';
    bargap?: number;
    bargroupgap?: number;
    hovermode?: 'closest' | 'x' | 'y' | 'x unified' | 'y unified' | false;
    hoverlabel?: Partial<HoverLabel>;
    paper_bgcolor?: string;
    plot_bgcolor?: string;
    font?: Partial<Font>;
    autosize?: boolean;
    width?: number;
    height?: number;
    annotations?: Partial<Annotation>[];
    shapes?: Partial<Shape>[];
    dragmode?: string | false;
  }

  export interface Axis {
    title?: string | { text: string; font?: Partial<Font> };
    type?: 'linear' | 'log' | 'date' | 'category' | 'multicategory';
    range?: [any, any];
    autorange?: boolean | 'reversed';
    tickmode?: 'auto' | 'linear' | 'array';
    tickvals?: any[];
    ticktext?: string[];
    tickangle?: number;
    tickfont?: Partial<Font>;
    showgrid?: boolean;
    gridcolor?: string;
    gridwidth?: number;
    zeroline?: boolean;
    zerolinecolor?: string;
    showline?: boolean;
    linecolor?: string;
    linewidth?: number;
    showticklabels?: boolean;
    tickformat?: string;
    categoryorder?: string;
    categoryarray?: string[];
    fixedrange?: boolean;
    automargin?: boolean;
    color?: string;
    rangemode?: 'normal' | 'tozero' | 'nonnegative';
  }

  export interface Margin {
    l?: number;
    r?: number;
    t?: number;
    b?: number;
    pad?: number;
  }

  export interface Legend {
    x?: number;
    y?: number;
    xanchor?: 'auto' | 'left' | 'center' | 'right';
    yanchor?: 'auto' | 'top' | 'middle' | 'bottom';
    bgcolor?: string;
    bordercolor?: string;
    borderwidth?: number;
    font?: Partial<Font>;
    orientation?: 'v' | 'h';
    traceorder?: string;
  }

  export interface HoverLabel {
    bgcolor?: string;
    bordercolor?: string;
    font?: Partial<Font>;
  }

  export interface Annotation {
    text?: string;
    x?: any;
    y?: any;
    xref?: string;
    yref?: string;
    showarrow?: boolean;
    arrowhead?: number;
    ax?: number;
    ay?: number;
    font?: Partial<Font>;
    align?: 'left' | 'center' | 'right';
    bgcolor?: string;
    bordercolor?: string;
    borderpad?: number;
    borderwidth?: number;
    opacity?: number;
  }

  export interface Shape {
    type?: 'circle' | 'rect' | 'path' | 'line';
    x0?: any;
    y0?: any;
    x1?: any;
    y1?: any;
    xref?: string;
    yref?: string;
    line?: Partial<Line>;
    fillcolor?: string;
    opacity?: number;
    layer?: 'below' | 'above';
  }

  export interface Config {
    responsive?: boolean;
    displayModeBar?: boolean | 'hover';
    displaylogo?: boolean;
    modeBarButtonsToRemove?: string[];
    modeBarButtonsToAdd?: any[];
    toImageButtonOptions?: {
      format?: 'png' | 'svg' | 'jpeg' | 'webp';
      filename?: string;
      height?: number;
      width?: number;
      scale?: number;
    };
    scrollZoom?: boolean;
    editable?: boolean;
    staticPlot?: boolean;
  }
}

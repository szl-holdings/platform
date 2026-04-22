type LabelValues = Record<string, string | number>;

export class Registry {
  contentType = 'text/plain; version=0.0.4; charset=utf-8';
  private _labels: LabelValues = {};
  setDefaultLabels(labels: LabelValues) {
    this._labels = labels;
  }
  register() {}
  async metrics() {
    return '';
  }
}

export class Counter {
  inc(_labels?: LabelValues) {}
  labels(_labels: LabelValues): this {
    return this;
  }
}

export class Histogram {
  observe(_labelsOrValue: LabelValues | number, _value?: number) {}
  labels(_labels: LabelValues): this {
    return this;
  }
  startTimer(_labels?: LabelValues) {
    return (_endLabels?: LabelValues) => {};
  }
}

export class Gauge {
  set(_labelsOrValue: LabelValues | number, _value?: number) {}
  inc(_labels?: LabelValues) {}
  dec(_labels?: LabelValues) {}
  labels(_labels: LabelValues): this {
    return this;
  }
}

export const defaultRegistry = new Registry();
export function register() {}

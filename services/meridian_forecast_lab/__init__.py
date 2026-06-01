"""Alloy Meridian Forecast Lab — deterministic calibrated baseline forecaster.

The forecast lab produces prediction intervals and calibration scores without
any external model dependency, making it safe for CI and offline use.

Research seams (not hard deps):
- Darts / StatsForecast: production-grade time-series forecasting
- HyperFrames: forecast visualisation and export
"""

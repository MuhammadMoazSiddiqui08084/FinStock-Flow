# This file is deprecated - use server.py instead
# Keeping for backward compatibility

from server import app, predict, PredictRequest, PredictResponse

__all__ = ["app", "predict", "PredictRequest", "PredictResponse"]

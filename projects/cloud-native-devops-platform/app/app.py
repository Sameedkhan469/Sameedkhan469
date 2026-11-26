import os
import time
from datetime import datetime, timezone

from flask import Flask, Response, jsonify, request
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

app = Flask(__name__)

APP_NAME = os.getenv("APP_NAME", "Cloud-Native DevOps Platform")
APP_VERSION = os.getenv("APP_VERSION", "1.0")
APP_ENV = os.getenv("APP_ENV", "development")

HTTP_REQUESTS = Counter(
    "flask_http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"],
)
HTTP_REQUEST_DURATION = Histogram(
    "flask_http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"],
)


@app.before_request
def start_request_timer():
    request._metrics_started_at = time.perf_counter()


@app.after_request
def record_request_metrics(response):
    if request.path != "/metrics":
        endpoint = request.endpoint or "unknown"
        HTTP_REQUESTS.labels(request.method, endpoint, str(response.status_code)).inc()
        started_at = getattr(request, "_metrics_started_at", None)
        if started_at is not None:
            HTTP_REQUEST_DURATION.labels(request.method, endpoint).observe(
                time.perf_counter() - started_at
            )
    return response


@app.route("/")
def home():
    return jsonify(
        {
            "project": APP_NAME,
            "message": "Application is running successfully!",
            "status": "healthy",
        }
    )


@app.route("/health")
def health():
    return jsonify(
        {
            "status": "UP",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.route("/info")
def info():
    return jsonify(
        {
            "application": APP_NAME,
            "version": APP_VERSION,
            "environment": APP_ENV,
        }
    )


@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
